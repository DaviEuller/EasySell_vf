import { useCallback, useEffect, useState } from "react"
import {
  CircleAlert,
  ExternalLink,
  FileText,
  LoaderCircle,
  RefreshCw,
  ShoppingBag,
} from "lucide-react"

type ApiRecord = Record<string, unknown>
type MercadoLivreStatus = {
  status: "connected" | "disconnected"
  nickname: string | null
  lastSyncAt: string | null
  lastSyncError: string | null
}
type Purchase = {
  externalOrderId: string
  status: string
  statusDetail: string | null
  totalAmount: number
  currency: string
  orderedAt: string
  items: { title: string; quantity: number; unitPrice: number }[]
  fiscalDocumentsStatus: string
  fiscalDocuments: { documentId: string; fileName: string | null }[]
}

const cardClass = "rounded-2xl border border-border bg-card shadow-sm"

function isRecord(value: unknown): value is ApiRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function apiBaseUrl() {
  const value = import.meta.env.VITE_API_URL?.trim().replace(/\/+$/, "")
  if (!value)
    throw new Error("A API não está configurada. Defina VITE_API_URL.")
  return value
}

async function apiRequest(path: string, init?: RequestInit): Promise<unknown> {
  const token = localStorage.getItem("accessToken")
  if (!token) throw new Error("Sua sessão expirou. Entre novamente.")

  const response = await fetch(`${apiBaseUrl()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  })
  const text = await response.text()
  let body: unknown = null
  if (text) {
    try {
      body = JSON.parse(text) as unknown
    } catch {
      if (response.ok) throw new Error("A API retornou uma resposta inválida.")
    }
  }
  if (!response.ok) {
    if (isRecord(body) && typeof body.message === "string") {
      throw new Error(body.message)
    }
    if (
      isRecord(body) &&
      Array.isArray(body.message) &&
      body.message.every((item) => typeof item === "string")
    ) {
      throw new Error(body.message.join(" "))
    }
    throw new Error(
      `Não foi possível concluir a operação (erro ${response.status}).`
    )
  }
  return body
}

function readString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback
}

function readNumber(value: unknown, fallback = 0) {
  const parsed = typeof value === "number" ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function parseStatus(value: unknown): MercadoLivreStatus {
  if (
    !isRecord(value) ||
    (value.status !== "connected" && value.status !== "disconnected")
  ) {
    throw new Error("A API retornou um status do Mercado Livre inválido.")
  }
  return {
    status: value.status,
    nickname: typeof value.nickname === "string" ? value.nickname : null,
    lastSyncAt: typeof value.lastSyncAt === "string" ? value.lastSyncAt : null,
    lastSyncError:
      typeof value.lastSyncError === "string" ? value.lastSyncError : null,
  }
}

function parsePurchases(value: unknown): Purchase[] {
  if (!isRecord(value) || !Array.isArray(value.items)) {
    throw new Error("A API retornou uma lista de compras inválida.")
  }
  return value.items.filter(isRecord).map((item) => ({
    externalOrderId: readString(item.externalOrderId),
    status: readString(item.status, "desconhecido"),
    statusDetail:
      typeof item.statusDetail === "string" ? item.statusDetail : null,
    totalAmount: readNumber(item.totalAmount),
    currency: readString(item.currency, "BRL"),
    orderedAt: readString(item.orderedAt),
    items: Array.isArray(item.items)
      ? item.items.filter(isRecord).map((product) => ({
          title: readString(product.title, "Produto"),
          quantity: readNumber(product.quantity, 1),
          unitPrice: readNumber(product.unitPrice),
        }))
      : [],
    fiscalDocumentsStatus: readString(
      item.fiscalDocumentsStatus,
      "not_available"
    ),
    fiscalDocuments: Array.isArray(item.fiscalDocuments)
      ? item.fiscalDocuments.filter(isRecord).map((document) => ({
          documentId: readString(document.documentId),
          fileName:
            typeof document.fileName === "string" ? document.fileName : null,
        }))
      : [],
  }))
}

function money(value: number, currency = "BRL") {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: /^[A-Z]{3}$/.test(currency) ? currency : "BRL",
  }).format(value)
}

function formatDate(value: string | null) {
  if (!value) return "Não informado"
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("pt-BR")
}

export default function Integracoes() {
  const [mercadoLivre, setMercadoLivre] = useState<MercadoLivreStatus | null>(
    null
  )
  const [authorizationUrl, setAuthorizationUrl] = useState("")
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState("")
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")

  const loadData = useCallback(async () => {
    const status = parseStatus(await apiRequest("/mercadolivre/status"))
    setMercadoLivre(status)
    if (status.status === "connected") {
      setPurchases(
        parsePurchases(
          await apiRequest("/mercadolivre/purchases?page=1&limit=20")
        )
      )
    } else {
      setPurchases([])
    }
  }, [])

  useEffect(() => {
    let active = true
    void Promise.resolve()
      .then(loadData)
      .catch((reason: unknown) => {
        if (active) {
          setError(
            reason instanceof Error
              ? reason.message
              : "Não foi possível carregar o Mercado Livre."
          )
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [loadData])

  const connect = async () => {
    setBusy("connect")
    setError("")
    setNotice("")
    try {
      const result = await apiRequest("/mercadolivre/connect", {
        method: "POST",
      })
      if (!isRecord(result) || typeof result.authorizationUrl !== "string") {
        throw new Error("A API não retornou o link de autorização.")
      }
      setAuthorizationUrl(result.authorizationUrl)
      setNotice("Abra o link para autorizar sua conta do Mercado Livre.")
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Não foi possível iniciar a conexão."
      )
    } finally {
      setBusy("")
    }
  }

  const sync = async () => {
    setBusy("sync")
    setError("")
    setNotice("")
    try {
      await apiRequest("/mercadolivre/sync", { method: "POST" })
      await loadData()
      setNotice("Compras e documentos fiscais atualizados.")
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Não foi possível sincronizar as compras."
      )
    } finally {
      setBusy("")
    }
  }

  const downloadDocument = async (
    purchaseId: string,
    documentId: string,
    fileName: string | null
  ) => {
    const token = localStorage.getItem("accessToken")
    if (!token) {
      setError("Sua sessão expirou. Entre novamente.")
      return
    }
    const key = `document:${purchaseId}:${documentId}`
    setBusy(key)
    setError("")
    try {
      const response = await fetch(
        `${apiBaseUrl()}/mercadolivre/purchases/${encodeURIComponent(purchaseId)}/fiscal-documents/${encodeURIComponent(documentId)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (!response.ok) {
        const text = await response.text()
        let message = `Não foi possível baixar o documento (erro ${response.status}).`
        if (text) {
          try {
            const body: unknown = JSON.parse(text)
            if (isRecord(body) && typeof body.message === "string") {
              message = body.message
            }
          } catch {
            message = text
          }
        }
        throw new Error(message)
      }
      const url = URL.createObjectURL(await response.blob())
      const anchor = document.createElement("a")
      anchor.href = url
      anchor.download = fileName || `documento-fiscal-${documentId}`
      anchor.click()
      URL.revokeObjectURL(url)
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Não foi possível baixar o documento fiscal."
      )
    } finally {
      setBusy("")
    }
  }

  return (
    <main className="min-h-screen bg-background px-4 pt-20 pb-12 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-primary">Canais de venda</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">
              Integrações
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Conecte o Mercado Livre para acompanhar pedidos e consultar
              documentos fiscais.
            </p>
          </div>
          <button
            className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-medium transition hover:bg-muted disabled:opacity-60"
            disabled={Boolean(busy)}
            onClick={() => {
              setLoading(true)
              setError("")
              void loadData()
                .catch((reason: unknown) =>
                  setError(
                    reason instanceof Error
                      ? reason.message
                      : "Não foi possível atualizar as integrações."
                  )
                )
                .finally(() => setLoading(false))
            }}
            type="button"
          >
            <RefreshCw size={16} />
            Atualizar
          </button>
        </header>

        {error ? (
          <div
            className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
            role="alert"
          >
            <CircleAlert className="mt-0.5 shrink-0" size={17} />
            {error}
          </div>
        ) : null}
        {notice ? (
          <p
            className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300"
            role="status"
          >
            {notice}
          </p>
        ) : null}

        <section className={`${cardClass} p-5 sm:p-6`}>
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-yellow-400/15 text-yellow-600">
                <ShoppingBag size={22} />
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold">Mercado Livre</h2>
                  {!loading ? (
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        mercadoLivre?.status === "connected"
                          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {mercadoLivre?.status === "connected"
                        ? "Conectado"
                        : "Desconectado"}
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {loading
                    ? "Carregando conexão..."
                    : mercadoLivre?.nickname
                      ? `Conta autorizada como ${mercadoLivre.nickname}`
                      : "Autorize sua conta para sincronizar pedidos."}
                </p>
                {mercadoLivre?.lastSyncAt ? (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Última sincronização: {formatDate(mercadoLivre.lastSyncAt)}
                  </p>
                ) : null}
                {mercadoLivre?.lastSyncError ? (
                  <p className="mt-2 text-sm text-destructive">
                    Falha na sincronização: {mercadoLivre.lastSyncError}
                  </p>
                ) : null}
              </div>
            </div>
            {mercadoLivre?.status === "connected" ? (
              <button
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
                disabled={Boolean(busy)}
                onClick={() => void sync()}
                type="button"
              >
                {busy === "sync" ? (
                  <LoaderCircle className="animate-spin" size={16} />
                ) : (
                  <RefreshCw size={16} />
                )}
                Sincronizar compras
              </button>
            ) : (
              <button
                className="rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
                disabled={Boolean(busy) || loading}
                onClick={() => void connect()}
                type="button"
              >
                {busy === "connect" ? "Preparando..." : "Conectar conta"}
              </button>
            )}
          </div>
          {authorizationUrl ? (
            <a
              className="mt-4 inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted"
              href={authorizationUrl}
              rel="noreferrer"
              target="_blank"
            >
              Autorizar no Mercado Livre
              <ExternalLink size={15} />
            </a>
          ) : null}
        </section>

        {mercadoLivre?.status === "connected" ? (
          <section className={`${cardClass} overflow-hidden`}>
            <header className="border-b border-border p-5 sm:p-6">
              <h2 className="font-semibold">Pedidos recentes</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Consulte o status das compras e baixe os documentos fiscais
                disponíveis.
              </p>
            </header>
            {purchases.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground">
                Nenhum pedido sincronizado. Use “Sincronizar compras” para
                consultar sua conta.
              </p>
            ) : (
              <div className="divide-y divide-border">
                {purchases.map((purchase) => (
                  <article
                    className="space-y-3 p-5 sm:p-6"
                    key={purchase.externalOrderId}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-medium">
                          Pedido {purchase.externalOrderId}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {purchase.status}
                          {purchase.statusDetail
                            ? ` · ${purchase.statusDetail}`
                            : ""}
                          {" · "}
                          {formatDate(purchase.orderedAt)}
                        </p>
                      </div>
                      <p className="font-semibold">
                        {money(purchase.totalAmount, purchase.currency)}
                      </p>
                    </div>
                    {purchase.items.length ? (
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        {purchase.items.map((item, index) => (
                          <li key={`${purchase.externalOrderId}-item-${index}`}>
                            {item.quantity}× {item.title} —{" "}
                            {money(item.unitPrice, purchase.currency)}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-xs text-muted-foreground">
                        {purchase.fiscalDocumentsStatus === "available"
                          ? `${purchase.fiscalDocuments.length} documento(s) fiscal(is)`
                          : purchase.fiscalDocumentsStatus === "unavailable"
                            ? "Documento fiscal indisponível"
                            : "Sem documento fiscal"}
                      </span>
                      {purchase.fiscalDocuments.map((document) => (
                        <button
                          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline disabled:opacity-50"
                          disabled={Boolean(busy)}
                          key={document.documentId}
                          onClick={() =>
                            void downloadDocument(
                              purchase.externalOrderId,
                              document.documentId,
                              document.fileName
                            )
                          }
                          type="button"
                        >
                          {busy ===
                          `document:${purchase.externalOrderId}:${document.documentId}` ? (
                            <LoaderCircle className="animate-spin" size={15} />
                          ) : (
                            <FileText size={15} />
                          )}
                          {document.fileName || "Baixar documento fiscal"}
                        </button>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        ) : null}
      </div>
    </main>
  )
}
