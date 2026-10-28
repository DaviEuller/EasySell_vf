import { useCallback, useEffect, useState } from "react"
import type { FormEvent } from "react"
import {
  Bot,
  Check,
  CircleAlert,
  LoaderCircle,
  MessageCircle,
  Plus,
  Send,
  ShieldCheck,
  Trash2,
  Wifi,
  WifiOff,
} from "lucide-react"

type ConnectionStatus = "disconnected" | "connecting" | "qr" | "ready" | "error"

type BotConnection = {
  status: ConnectionStatus
  phoneNumber: string | null
  qrCodeDataUrl: string | null
  lastError: string | null
}

type EasyBotContact = {
  _id: string
  name: string
  phone: string
  autoReplyEnabled: boolean
}

type EasyBotMessage = {
  _id: string
  content: string
  direction: "incoming" | "outgoing"
  status: "received" | "sending" | "sent" | "failed"
  createdAt: string
}

type ApiRecord = Record<string, unknown>

const panelClass = "rounded-2xl border border-border bg-card shadow-sm"

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

  const response = await fetch(`${apiBaseUrl()}/easybot${path}`, {
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
      body.message.every((message) => typeof message === "string")
    ) {
      throw new Error(body.message.join(" "))
    }
    throw new Error(
      `Não foi possível acessar o EasyBot (erro ${response.status}).`
    )
  }
  return body
}

function parseConnection(value: unknown): BotConnection {
  if (!isRecord(value)) throw new Error("A API retornou um status inválido.")
  const status = value.status
  if (
    status !== "disconnected" &&
    status !== "connecting" &&
    status !== "qr" &&
    status !== "ready" &&
    status !== "error"
  ) {
    throw new Error("A API retornou um status de conexão desconhecido.")
  }
  return {
    status,
    phoneNumber:
      typeof value.phoneNumber === "string" ? value.phoneNumber : null,
    qrCodeDataUrl:
      typeof value.qrCodeDataUrl === "string" ? value.qrCodeDataUrl : null,
    lastError: typeof value.lastError === "string" ? value.lastError : null,
  }
}

function parseContacts(value: unknown): EasyBotContact[] {
  if (!Array.isArray(value)) {
    throw new Error("A API retornou uma lista de contatos inválida.")
  }
  return value.map((item) => {
    if (
      !isRecord(item) ||
      typeof item._id !== "string" ||
      typeof item.name !== "string" ||
      typeof item.phone !== "string" ||
      typeof item.autoReplyEnabled !== "boolean"
    ) {
      throw new Error("A API retornou um contato inválido.")
    }
    return {
      _id: item._id,
      name: item.name,
      phone: item.phone,
      autoReplyEnabled: item.autoReplyEnabled,
    }
  })
}

function parseMessages(value: unknown): EasyBotMessage[] {
  if (!Array.isArray(value)) {
    throw new Error("A API retornou um histórico de mensagens inválido.")
  }
  return value.map((item) => {
    if (
      !isRecord(item) ||
      typeof item._id !== "string" ||
      typeof item.content !== "string" ||
      (item.direction !== "incoming" && item.direction !== "outgoing") ||
      (item.status !== "received" &&
        item.status !== "sending" &&
        item.status !== "sent" &&
        item.status !== "failed") ||
      typeof item.createdAt !== "string"
    ) {
      throw new Error("A API retornou uma mensagem inválida.")
    }
    return {
      _id: item._id,
      content: item.content,
      direction: item.direction,
      status: item.status,
      createdAt: item.createdAt,
    }
  })
}

function formatTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  return date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

const statusLabels: Record<ConnectionStatus, string> = {
  disconnected: "Desconectado",
  connecting: "Conectando",
  qr: "Aguardando leitura do QR Code",
  ready: "Conectado",
  error: "Erro na conexão",
}

export default function EasyBot() {
  const [connection, setConnection] = useState<BotConnection>({
    status: "disconnected",
    phoneNumber: null,
    qrCodeDataUrl: null,
    lastError: null,
  })
  const [contacts, setContacts] = useState<EasyBotContact[]>([])
  const [selectedContactId, setSelectedContactId] = useState("")
  const [messages, setMessages] = useState<EasyBotMessage[]>([])
  const [contactName, setContactName] = useState("")
  const [contactPhone, setContactPhone] = useState("")
  const [draftMessage, setDraftMessage] = useState("")
  const [notice, setNotice] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSavingContact, setIsSavingContact] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [isChangingConnection, setIsChangingConnection] = useState(false)
  const selectedContact =
    contacts.find((contact) => contact._id === selectedContactId) ?? null

  const loadStatus = useCallback(async () => {
    setConnection(parseConnection(await apiRequest("/status")))
  }, [])

  const loadMessages = useCallback(async (contactId: string) => {
    setMessages(
      parseMessages(
        await apiRequest(`/contacts/${encodeURIComponent(contactId)}/messages`)
      )
    )
  }, [])

  useEffect(() => {
    let active = true
    void Promise.all([
      apiRequest("/status").then(parseConnection),
      apiRequest("/contacts").then(parseContacts),
    ])
      .then(([nextConnection, nextContacts]) => {
        if (!active) return
        setConnection(nextConnection)
        setContacts(nextContacts)
        setError("")
      })
      .catch((reason: unknown) => {
        if (active) {
          setError(
            reason instanceof Error
              ? reason.message
              : "Não foi possível carregar o EasyBot."
          )
        }
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (
      connection.status !== "connecting" &&
      connection.status !== "qr" &&
      connection.status !== "ready"
    ) {
      return
    }
    const interval = window.setInterval(() => {
      void loadStatus().catch((reason: unknown) => {
        setError(
          reason instanceof Error
            ? reason.message
            : "Não foi possível atualizar a conexão."
        )
      })
    }, 3000)
    return () => window.clearInterval(interval)
  }, [connection.status, loadStatus])

  useEffect(() => {
    if (!selectedContactId) {
      setMessages([])
      return
    }
    let active = true
    const refresh = () => {
      void apiRequest(
        `/contacts/${encodeURIComponent(selectedContactId)}/messages`
      )
        .then(parseMessages)
        .then((nextMessages) => {
          if (active) {
            setMessages(nextMessages)
            setError("")
          }
        })
        .catch((reason: unknown) => {
          if (active) {
            setError(
              reason instanceof Error
                ? reason.message
                : "Não foi possível carregar as mensagens."
            )
          }
        })
    }
    refresh()
    const interval = window.setInterval(refresh, 4000)
    return () => {
      active = false
      window.clearInterval(interval)
    }
  }, [selectedContactId])

  const changeConnection = async () => {
    setIsChangingConnection(true)
    setError("")
    setNotice("")
    try {
      const next =
        connection.status === "ready"
          ? await apiRequest("/disconnect", { method: "POST" })
          : await apiRequest("/connect", { method: "POST" })
      setConnection(parseConnection(next))
      if (connection.status === "ready") {
        setNotice("WhatsApp desconectado com sucesso.")
      } else {
        setNotice("Conexão iniciada. Escaneie o QR Code com o WhatsApp.")
      }
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Não foi possível alterar a conexão do WhatsApp."
      )
    } finally {
      setIsChangingConnection(false)
    }
  }

  const addContact = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSavingContact(true)
    setError("")
    setNotice("")
    try {
      const result = await apiRequest("/contacts", {
        method: "POST",
        body: JSON.stringify({
          name: contactName.trim(),
          phone: contactPhone.trim(),
          autoReplyEnabled: true,
        }),
      })
      const created = parseContacts([result])[0]
      setContacts((current) =>
        [...current, created].sort((left, right) =>
          left.name.localeCompare(right.name, "pt-BR")
        )
      )
      setSelectedContactId(created._id)
      setContactName("")
      setContactPhone("")
      setNotice("Contato cadastrado. A resposta automática está ativada.")
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Não foi possível cadastrar o contato."
      )
    } finally {
      setIsSavingContact(false)
    }
  }

  const toggleAutoReply = async (contact: EasyBotContact) => {
    setError("")
    try {
      const updated = await apiRequest(
        `/contacts/${encodeURIComponent(contact._id)}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            autoReplyEnabled: !contact.autoReplyEnabled,
          }),
        }
      )
      const next = parseContacts([updated])[0]
      setContacts((current) =>
        current.map((item) => (item._id === next._id ? next : item))
      )
      setNotice(
        next.autoReplyEnabled
          ? "Resposta automática ativada para este contato."
          : "Resposta automática desativada para este contato."
      )
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Não foi possível atualizar a resposta automática."
      )
    }
  }

  const deleteContact = async (contact: EasyBotContact) => {
    if (!window.confirm(`Remover ${contact.name} dos contatos do EasyBot?`)) {
      return
    }
    setError("")
    try {
      await apiRequest(`/contacts/${encodeURIComponent(contact._id)}`, {
        method: "DELETE",
      })
      setContacts((current) =>
        current.filter((item) => item._id !== contact._id)
      )
      if (selectedContactId === contact._id) {
        setSelectedContactId("")
        setMessages([])
      }
      setNotice("Contato removido.")
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Não foi possível remover o contato."
      )
    }
  }

  const sendMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedContact || !draftMessage.trim()) return
    setIsSending(true)
    setError("")
    try {
      await apiRequest("/messages", {
        method: "POST",
        body: JSON.stringify({
          contactId: selectedContact._id,
          message: draftMessage.trim(),
        }),
      })
      setDraftMessage("")
      await loadMessages(selectedContact._id)
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Não foi possível enviar a mensagem."
      )
    } finally {
      setIsSending(false)
    }
  }

  const connectionReady = connection.status === "ready"
  const isConnecting =
    connection.status === "connecting" || connection.status === "qr"

  return (
    <main className="min-h-screen bg-background px-4 pt-20 pb-10 text-foreground sm:px-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-blue-600 dark:text-blue-300">
              Automação de atendimento
            </p>
            <h1 className="mt-1 flex items-center gap-3 text-3xl font-bold tracking-tight">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-300">
                <Bot aria-hidden="true" size={24} />
              </span>
              EasyBot
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Conecte o WhatsApp da empresa, salve seus contatos e deixe a Sell
              IA responder perguntas sobre produtos e estoque.
            </p>
          </div>
          <button
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isChangingConnection || isLoading || isConnecting}
            onClick={() => void changeConnection()}
            type="button"
          >
            {isChangingConnection || isConnecting ? (
              <LoaderCircle
                aria-hidden="true"
                className="animate-spin"
                size={17}
              />
            ) : connectionReady ? (
              <WifiOff aria-hidden="true" size={17} />
            ) : (
              <Wifi aria-hidden="true" size={17} />
            )}
            {isChangingConnection
              ? "Aguarde..."
              : isConnecting
                ? "Aguardando conexão..."
                : connectionReady
                  ? "Desconectar WhatsApp"
                  : "Conectar WhatsApp"}
          </button>
        </header>

        {error ? (
          <div
            className="flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-700 dark:text-red-300"
            role="alert"
          >
            <CircleAlert
              aria-hidden="true"
              className="mt-0.5 shrink-0"
              size={17}
            />
            {error}
          </div>
        ) : null}
        {notice ? (
          <div
            className="flex items-start gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300"
            role="status"
          >
            <Check aria-hidden="true" className="mt-0.5 shrink-0" size={17} />
            {notice}
          </div>
        ) : null}

        <section
          className={`${panelClass} flex flex-col gap-5 p-5 sm:flex-row sm:items-center`}
        >
          <div
            className={`flex size-12 shrink-0 items-center justify-center rounded-full ${
              connectionReady
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {connectionReady ? (
              <Wifi aria-hidden="true" size={22} />
            ) : (
              <WifiOff aria-hidden="true" size={22} />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-semibold">Conexão do WhatsApp</h2>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                  connectionReady
                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                    : connection.status === "error"
                      ? "bg-red-500/10 text-red-700 dark:text-red-300"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {statusLabels[connection.status]}
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {connection.phoneNumber
                ? `Número conectado: +${connection.phoneNumber}`
                : "Conecte um número exclusivo para esta empresa."}
            </p>
            {connection.lastError ? (
              <p className="mt-1 text-sm text-red-600 dark:text-red-300">
                {connection.lastError}
              </p>
            ) : null}
          </div>
          {connection.qrCodeDataUrl ? (
            <div className="flex shrink-0 flex-col items-center gap-2 rounded-xl border border-border bg-white p-3">
              <img
                alt="QR Code de conexão do WhatsApp"
                className="size-44"
                src={connection.qrCodeDataUrl}
              />
              <span className="max-w-48 text-center text-xs text-muted-foreground">
                No WhatsApp, acesse Aparelhos conectados e escaneie o código.
              </span>
            </div>
          ) : isConnecting ? (
            <div
              className="flex items-center gap-2 text-sm text-muted-foreground"
              role="status"
            >
              <LoaderCircle
                aria-hidden="true"
                className="animate-spin"
                size={16}
              />
              Preparando conexão...
            </div>
          ) : null}
        </section>

        {!isLoading && !connectionReady ? (
          <p className="rounded-xl border border-blue-500/20 bg-blue-500/5 px-4 py-3 text-sm text-blue-800 dark:text-blue-200">
            Conecte o WhatsApp para enviar mensagens. Contatos cadastrados só
            receberão respostas automáticas quando a conexão estiver ativa.
          </p>
        ) : null}

        <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="space-y-5">
            <section className={`${panelClass} p-5`}>
              <h2 className="flex items-center gap-2 font-semibold">
                <Plus aria-hidden="true" className="text-blue-600" size={18} />
                Cadastrar contato
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Só os números salvos podem receber respostas automáticas.
              </p>
              <form className="mt-4 space-y-3" onSubmit={addContact}>
                <label className="block space-y-1.5 text-sm font-medium">
                  Nome
                  <input
                    autoComplete="name"
                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 font-normal transition outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15"
                    maxLength={100}
                    onChange={(event) => setContactName(event.target.value)}
                    placeholder="Nome do contato"
                    required
                    value={contactName}
                  />
                </label>
                <label className="block space-y-1.5 text-sm font-medium">
                  WhatsApp com DDI e DDD
                  <input
                    autoComplete="tel"
                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 font-normal transition outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15"
                    maxLength={30}
                    onChange={(event) => setContactPhone(event.target.value)}
                    placeholder="+55 11 99999-9999"
                    required
                    type="tel"
                    value={contactPhone}
                  />
                </label>
                <button
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
                  disabled={isSavingContact}
                  type="submit"
                >
                  {isSavingContact ? (
                    <LoaderCircle
                      aria-hidden="true"
                      className="animate-spin"
                      size={16}
                    />
                  ) : (
                    <Plus aria-hidden="true" size={16} />
                  )}
                  Salvar contato
                </button>
              </form>
            </section>

            <section className={`${panelClass} overflow-hidden`}>
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <div>
                  <h2 className="font-semibold">Contatos</h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {contacts.length}{" "}
                    {contacts.length === 1 ? "contato" : "contatos"}
                  </p>
                </div>
                <ShieldCheck
                  aria-label="Respostas automáticas somente para contatos cadastrados"
                  className="text-blue-600"
                  size={19}
                />
              </div>
              {isLoading ? (
                <p className="p-5 text-sm text-muted-foreground">
                  Carregando contatos...
                </p>
              ) : contacts.length === 0 ? (
                <p className="p-5 text-sm text-muted-foreground">
                  Nenhum contato cadastrado. Adicione um número para começar.
                </p>
              ) : (
                <ul className="max-h-[440px] divide-y divide-border overflow-y-auto">
                  {contacts.map((contact) => (
                    <li
                      className={`p-3 transition-colors ${
                        selectedContactId === contact._id ? "bg-blue-500/5" : ""
                      }`}
                      key={contact._id}
                    >
                      <div className="flex items-start gap-3">
                        <button
                          aria-pressed={selectedContactId === contact._id}
                          className="flex min-w-0 flex-1 items-center gap-3 rounded-lg text-left"
                          onClick={() => setSelectedContactId(contact._id)}
                          type="button"
                        >
                          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-blue-500/10 font-semibold text-blue-700 dark:text-blue-300">
                            {contact.name.slice(0, 1).toUpperCase()}
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-medium">
                              {contact.name}
                            </span>
                            <span className="block truncate text-xs text-muted-foreground">
                              +{contact.phone}
                            </span>
                          </span>
                        </button>
                        <button
                          aria-label={
                            contact.autoReplyEnabled
                              ? `Desativar resposta automática para ${contact.name}`
                              : `Ativar resposta automática para ${contact.name}`
                          }
                          className={`mt-1 rounded-lg p-1.5 transition-colors ${
                            contact.autoReplyEnabled
                              ? "text-blue-600 hover:bg-blue-500/10"
                              : "text-muted-foreground hover:bg-muted"
                          }`}
                          onClick={() => void toggleAutoReply(contact)}
                          title={
                            contact.autoReplyEnabled
                              ? "Resposta automática ativada"
                              : "Resposta automática desativada"
                          }
                          type="button"
                        >
                          <Bot aria-hidden="true" size={17} />
                        </button>
                        <button
                          aria-label={`Remover ${contact.name}`}
                          className="mt-1 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-600"
                          onClick={() => void deleteContact(contact)}
                          type="button"
                        >
                          <Trash2 aria-hidden="true" size={16} />
                        </button>
                      </div>
                      <p className="mt-2 pl-[52px] text-xs text-muted-foreground">
                        Resposta automática{" "}
                        {contact.autoReplyEnabled ? "ativada" : "desativada"}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </aside>

          <section
            className={`${panelClass} flex min-h-[580px] flex-col overflow-hidden`}
          >
            <header className="flex items-center gap-3 border-b border-border px-5 py-4">
              <span className="flex size-10 items-center justify-center rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-300">
                <MessageCircle aria-hidden="true" size={19} />
              </span>
              <div className="min-w-0">
                <h2 className="truncate font-semibold">
                  {selectedContact?.name ?? "Mensagens"}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {selectedContact
                    ? `+${selectedContact.phone}`
                    : "Selecione um contato para abrir a conversa"}
                </p>
              </div>
            </header>
            <div
              aria-live="polite"
              className="flex flex-1 flex-col gap-3 overflow-y-auto bg-muted/20 p-4 sm:p-6"
            >
              {!selectedContact ? (
                <div className="m-auto max-w-sm text-center">
                  <MessageCircle
                    aria-hidden="true"
                    className="mx-auto text-muted-foreground/50"
                    size={38}
                  />
                  <p className="mt-3 font-medium">
                    Suas conversas aparecerão aqui
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Escolha um contato na lista para consultar o histórico e
                    enviar mensagens.
                  </p>
                </div>
              ) : messages.length === 0 ? (
                <div className="m-auto text-center text-sm text-muted-foreground">
                  Nenhuma mensagem para este contato ainda.
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    className={`flex ${
                      message.direction === "outgoing"
                        ? "justify-end"
                        : "justify-start"
                    }`}
                    key={message._id}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm shadow-sm sm:max-w-[75%] ${
                        message.direction === "outgoing"
                          ? "rounded-br-md bg-blue-600 text-white"
                          : "rounded-bl-md border border-border bg-card text-foreground"
                      }`}
                    >
                      <p className="break-words whitespace-pre-wrap">
                        {message.content}
                      </p>
                      <p
                        className={`mt-1 text-right text-[10px] ${
                          message.direction === "outgoing"
                            ? "text-white/70"
                            : "text-muted-foreground"
                        }`}
                      >
                        {formatTime(message.createdAt)}
                        {message.status === "failed" ? " · falhou" : ""}
                        {message.status === "sending" ? " · enviando" : ""}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <form
              className="flex gap-2 border-t border-border p-3 sm:p-4"
              onSubmit={sendMessage}
            >
              <input
                aria-label="Mensagem para enviar"
                className="min-w-0 flex-1 rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm transition outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 disabled:opacity-60"
                disabled={!selectedContact || !connectionReady || isSending}
                maxLength={4096}
                onChange={(event) => setDraftMessage(event.target.value)}
                placeholder={
                  !connectionReady
                    ? "Conecte o WhatsApp para enviar mensagens..."
                    : selectedContact
                      ? `Mensagem para ${selectedContact.name}...`
                      : "Selecione um contato..."
                }
                value={draftMessage}
              />
              <button
                aria-label="Enviar mensagem"
                className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={
                  !selectedContact ||
                  !connectionReady ||
                  !draftMessage.trim() ||
                  isSending
                }
                type="submit"
              >
                {isSending ? (
                  <LoaderCircle
                    aria-hidden="true"
                    className="animate-spin"
                    size={18}
                  />
                ) : (
                  <Send aria-hidden="true" size={18} />
                )}
              </button>
            </form>
          </section>
        </div>
      </div>
    </main>
  )
}
