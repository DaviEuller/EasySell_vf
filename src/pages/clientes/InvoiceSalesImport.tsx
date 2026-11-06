import { useCallback, useEffect, useRef, useState } from "react"
import type { FormEvent } from "react"
import {
  AlertCircle,
  Bot,
  Check,
  FileText,
  LoaderCircle,
  MessageCircle,
  Plus,
  Send,
  Sparkles,
  Upload,
  WandSparkles,
  X,
} from "lucide-react"

type RecordValue = Record<string, unknown>
type Product = { id: string; name: string; stock: number; price: number }
type InvoiceItem = {
  description: string
  quantity: number
  unitPrice: number
  suggestedProductId: string
  aiConfidence: number | null
  aiQuestion: string | null
}
type ReviewItem = InvoiceItem & {
  productId: string
  quantityInput: string
  priceInput: string
}
type ManualLine = { productId: string; quantity: string; unitPrice: string }
type Invoice = {
  id: string
  fileName: string
  fileType: "xml" | "pdf" | "image" | "manual"
  invoiceNumber: string | null
  issueDate: string | null
  customerName: string | null
  customerPhone: string | null
  totalAmount: number | null
  items: InvoiceItem[]
  ocrText: string | null
  aiNeedsClarification: boolean
  aiClarificationQuestion: string | null
  status: "pending_review" | "imported" | "rejected"
  createdAt: string
}
type AssistantMessage = { role: "user" | "assistant"; content: string }
type AssistResult = {
  items: {
    description: string
    quantity?: number
    unitPrice?: number
    total?: number
    productId?: string
    confidence: number
    clarification?: string
  }[]
  answer: string
  needsClarification: boolean
  clarificationQuestion: string | null
}

const cardClass = "rounded-2xl border border-border bg-card shadow-sm"

class ApiRequestError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

function isRecord(value: unknown): value is RecordValue {
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

  const isFormData = init?.body instanceof FormData
  const response = await fetch(`${apiBaseUrl()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init?.body && !isFormData
        ? { "Content-Type": "application/json" }
        : {}),
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
      throw new ApiRequestError(body.message, response.status)
    }
    if (
      isRecord(body) &&
      Array.isArray(body.message) &&
      body.message.every((item) => typeof item === "string")
    ) {
      throw new ApiRequestError(body.message.join(" "), response.status)
    }
    throw new ApiRequestError(
      `Não foi possível concluir a operação (erro ${response.status}).`,
      response.status
    )
  }
  return body
}

function numberValue(value: unknown, fallback = 0) {
  const result = typeof value === "number" ? value : Number(value)
  return Number.isFinite(result) ? result : fallback
}

function parseProducts(value: unknown): Product[] {
  const rows = isRecord(value) && "data" in value ? value.data : value
  const list = Array.isArray(rows)
    ? rows
    : isRecord(rows)
      ? (rows.products ?? rows.produtos ?? rows.items)
      : null
  if (!Array.isArray(list)) {
    throw new Error("A API retornou uma lista de produtos inválida.")
  }
  return list.flatMap((item) => {
    if (!isRecord(item)) return []
    const id = item._id ?? item.id
    const name = item.name ?? item.nome
    if (typeof id !== "string" || typeof name !== "string") return []
    return [
      {
        id,
        name,
        stock: numberValue(
          item.stock ?? item.estoque ?? item.quantidade ?? item.quantity
        ),
        price: numberValue(item.price ?? item.preco),
      },
    ]
  })
}

function parseInvoice(value: unknown): Invoice {
  if (!isRecord(value) || typeof (value.id ?? value._id) !== "string") {
    throw new Error("A API retornou uma importação de nota inválida.")
  }
  const status = value.status
  if (
    status !== "pending_review" &&
    status !== "imported" &&
    status !== "rejected"
  ) {
    throw new Error("A API retornou um status de nota inválido.")
  }
  const items = Array.isArray(value.items)
    ? value.items.filter(isRecord).map((item) => ({
        description:
          typeof item.description === "string" ? item.description : "",
        quantity: numberValue(item.quantity, 1),
        unitPrice: numberValue(item.unitPrice),
        suggestedProductId:
          typeof item.suggestedProductId === "string"
            ? item.suggestedProductId
            : "",
        aiConfidence:
          typeof item.aiConfidence === "number" ? item.aiConfidence : null,
        aiQuestion:
          typeof item.aiQuestion === "string" ? item.aiQuestion : null,
      }))
    : []
  return {
    id: String(value.id ?? value._id),
    fileName:
      typeof value.fileName === "string" ? value.fileName : "Nota fiscal",
    fileType:
      value.fileType === "xml" ||
      value.fileType === "pdf" ||
      value.fileType === "manual"
        ? value.fileType
        : "image",
    invoiceNumber:
      typeof value.invoiceNumber === "string" ? value.invoiceNumber : null,
    issueDate: typeof value.issueDate === "string" ? value.issueDate : null,
    customerName:
      typeof value.customerName === "string" ? value.customerName : null,
    customerPhone:
      typeof value.customerPhone === "string" ? value.customerPhone : null,
    totalAmount:
      typeof value.totalAmount === "number" ? value.totalAmount : null,
    items,
    ocrText: typeof value.ocrText === "string" ? value.ocrText : null,
    aiNeedsClarification: value.aiNeedsClarification === true,
    aiClarificationQuestion:
      typeof value.aiClarificationQuestion === "string"
        ? value.aiClarificationQuestion
        : null,
    status,
    createdAt: typeof value.createdAt === "string" ? value.createdAt : "",
  }
}

function parseAssistResult(value: unknown): AssistResult {
  if (!isRecord(value) || !Array.isArray(value.items)) {
    throw new Error("A Sell IA retornou uma análise inválida.")
  }
  return {
    items: value.items.filter(isRecord).map((item) => ({
      description: typeof item.description === "string" ? item.description : "",
      ...(typeof item.quantity === "number" ? { quantity: item.quantity } : {}),
      ...(typeof item.unitPrice === "number"
        ? { unitPrice: item.unitPrice }
        : {}),
      ...(typeof item.total === "number" ? { total: item.total } : {}),
      ...(typeof item.productId === "string"
        ? { productId: item.productId }
        : {}),
      confidence: numberValue(item.confidence),
      ...(typeof item.clarification === "string"
        ? { clarification: item.clarification }
        : {}),
    })),
    answer:
      typeof value.answer === "string"
        ? value.answer
        : "Revise os itens extraídos antes de continuar.",
    needsClarification: value.needsClarification === true,
    clarificationQuestion:
      typeof value.clarificationQuestion === "string"
        ? value.clarificationQuestion
        : null,
  }
}

function money(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function manualLineTotal(line: ManualLine) {
  const quantity = numberValue(line.quantity)
  const unitPrice = numberValue(line.unitPrice)
  return Math.round(quantity * unitPrice * 100) / 100
}

function itemForReview(item?: InvoiceItem): ReviewItem {
  const confidence = item?.aiConfidence ?? null
  const suggestedProductId = item?.suggestedProductId ?? ""
  return {
    description: item?.description ?? "",
    quantity: item?.quantity ?? 1,
    unitPrice: item?.unitPrice ?? 0,
    suggestedProductId,
    aiConfidence: confidence,
    aiQuestion: item?.aiQuestion ?? null,
    productId:
      confidence === null || confidence >= 0.8 ? suggestedProductId : "",
    quantityInput: item?.quantity ? String(item.quantity) : "",
    priceInput: item?.unitPrice ? String(item.unitPrice) : "",
  }
}

function mergeAssistantSuggestions(
  current: ReviewItem[],
  suggestions: AssistResult["items"]
) {
  const updated = current.map((item, index) => {
    const suggestion = suggestions[index]
    if (!suggestion) return item
    const suggestedProductId = suggestion.productId ?? item.suggestedProductId
    const confidence = suggestion.confidence
    return {
      ...item,
      description: item.description || suggestion.description,
      productId:
        item.productId ||
        (confidence >= 0.8 ? (suggestion.productId ?? "") : ""),
      suggestedProductId,
      aiConfidence: confidence,
      aiQuestion: suggestion.clarification ?? null,
      quantityInput:
        item.quantityInput ||
        (suggestion.quantity && suggestion.quantity > 0
          ? String(suggestion.quantity)
          : ""),
      priceInput:
        item.priceInput ||
        (suggestion.unitPrice && suggestion.unitPrice > 0
          ? String(suggestion.unitPrice)
          : ""),
    }
  })
  return [
    ...updated,
    ...suggestions.slice(current.length).map((suggestion) =>
      itemForReview({
        description: suggestion.description,
        quantity: suggestion.quantity ?? 0,
        unitPrice: suggestion.unitPrice ?? 0,
        suggestedProductId: suggestion.productId ?? "",
        aiConfidence: suggestion.confidence,
        aiQuestion: suggestion.clarification ?? null,
      })
    ),
  ]
}

function formatDate(value: string | null) {
  if (!value) return "Data não identificada"
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("pt-BR")
}

export default function InvoiceSalesImport() {
  const [entryMode, setEntryMode] = useState<"invoice" | "manual">("invoice")
  const [products, setProducts] = useState<Product[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [selectedId, setSelectedId] = useState("")
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([])
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [reviewTab, setReviewTab] = useState<"items" | "assistant">("items")
  const [assistantMessages, setAssistantMessages] = useState<
    AssistantMessage[]
  >([])
  const [question, setQuestion] = useState("")
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState("")
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const [manualCustomerName, setManualCustomerName] = useState("")
  const [manualCustomerPhone, setManualCustomerPhone] = useState("")
  const [manualLines, setManualLines] = useState<ManualLine[]>([
    { productId: "", quantity: "1", unitPrice: "" },
  ])
  const fileInput = useRef<HTMLInputElement>(null)
  const selected = invoices.find((invoice) => invoice.id === selectedId)
  const pendingInvoices = invoices.filter(
    (invoice) => invoice.status === "pending_review"
  )

  const loadData = useCallback(async () => {
    const companyId = localStorage.getItem("companyId")
    if (!companyId) {
      throw new Error(
        "Não foi possível identificar a empresa. Entre novamente."
      )
    }
    const [invoiceResult, productResult] = await Promise.all([
      apiRequest("/invoice-imports"),
      apiRequest(`/produtos/company/${encodeURIComponent(companyId)}`),
    ])
    if (!Array.isArray(invoiceResult)) {
      throw new Error("A API retornou uma lista de notas inválida.")
    }
    setInvoices(invoiceResult.map(parseInvoice))
    setProducts(parseProducts(productResult))
  }, [])

  const refreshAfterMissingInvoice = async (reason: unknown) => {
    if (!(reason instanceof ApiRequestError) || reason.status !== 404) {
      return false
    }
    setSelectedId("")
    try {
      await loadData()
      setError(
        "Esta nota ou venda não foi encontrada nesta empresa. Atualizei a lista; abra novamente uma revisão disponível."
      )
    } catch (refreshError) {
      setError(
        refreshError instanceof Error
          ? `A revisão não foi encontrada e a lista não pôde ser atualizada: ${refreshError.message}`
          : "A revisão não foi encontrada e a lista não pôde ser atualizada."
      )
    }
    return true
  }

  useEffect(() => {
    let active = true
    void Promise.resolve()
      .then(loadData)
      .catch((reason: unknown) => {
        if (active) {
          setError(
            reason instanceof Error
              ? reason.message
              : "Não foi possível carregar as notas fiscais."
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

  const beginReview = (invoice: Invoice) => {
    setSelectedId(invoice.id)
    setReviewItems(
      invoice.items.length
        ? invoice.items.map(itemForReview)
        : [itemForReview()]
    )
    setCustomerName(invoice.customerName ?? "")
    setCustomerPhone(invoice.customerPhone ?? "")
    setReviewTab(invoice.aiNeedsClarification ? "assistant" : "items")
    setAssistantMessages(
      invoice.aiClarificationQuestion
        ? [{ role: "assistant", content: invoice.aiClarificationQuestion }]
        : []
    )
    setError("")
    setNotice("")
  }

  const updateItem = (
    index: number,
    field: "description" | "productId" | "quantityInput" | "priceInput",
    value: string
  ) => {
    setReviewItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [field]: value,
              ...(field === "quantityInput"
                ? { quantity: numberValue(value) }
                : {}),
              ...(field === "priceInput"
                ? { unitPrice: numberValue(value) }
                : {}),
            }
          : item
      )
    )
  }

  const askAssistant = async (invoice: Invoice, prompt?: string) => {
    const questionText = prompt?.trim() ?? ""
    const history = questionText
      ? [
          ...assistantMessages
            .slice(-6)
            .map(
              (message) =>
                `${message.role === "user" ? "Pessoa" : "Sell IA"}: ${message.content}`
            ),
          `Pessoa: ${questionText}`,
        ]
          .join("\n")
          .slice(-1000)
      : ""
    setBusy(questionText ? "question" : "assist")
    setError("")
    if (questionText) {
      setAssistantMessages((current) => [
        ...current,
        { role: "user", content: questionText },
      ])
    }
    try {
      const result = parseAssistResult(
        await apiRequest(
          `/invoice-imports/${encodeURIComponent(invoice.id)}/assist`,
          {
            method: "POST",
            body: JSON.stringify(questionText ? { question: history } : {}),
          }
        )
      )
      if (!questionText) {
        const suggestions = result.items.map((item) =>
          itemForReview({
            description: item.description,
            quantity: item.quantity ?? 0,
            unitPrice: item.unitPrice ?? 0,
            suggestedProductId: item.productId ?? "",
            aiConfidence: item.confidence,
            aiQuestion: item.clarification ?? null,
          })
        )
        setReviewItems(suggestions.length ? suggestions : [itemForReview()])
      } else if (result.items.length) {
        setReviewItems((current) =>
          mergeAssistantSuggestions(current, result.items)
        )
      }
      setAssistantMessages((current) => [
        ...current,
        {
          role: "assistant",
          content:
            !questionText && result.needsClarification
              ? (result.clarificationQuestion ?? result.answer)
              : result.answer,
        },
      ])
      setReviewTab(
        questionText || result.needsClarification ? "assistant" : "items"
      )
      await loadData()
    } catch (reason) {
      if (await refreshAfterMissingInvoice(reason)) return
      setError(
        reason instanceof Error
          ? reason.message
          : "Não foi possível analisar a nota com a Sell IA."
      )
    } finally {
      setBusy("")
    }
  }

  const uploadInvoice = async (file: File) => {
    setBusy("upload")
    setError("")
    setNotice("")
    const formData = new FormData()
    formData.append("file", file)
    try {
      const created = parseInvoice(
        await apiRequest("/invoice-imports", {
          method: "POST",
          body: formData,
        })
      )
      setInvoices((current) => [created, ...current])
      beginReview(created)
      setNotice(
        "Nota recebida. A Sell IA está identificando produtos e valores."
      )
      await askAssistant(created)
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Não foi possível enviar a nota fiscal."
      )
    } finally {
      setBusy("")
      if (fileInput.current) fileInput.current.value = ""
    }
  }

  const handleSampleInvoice = async () => {
    setBusy("sample")
    setError("")
    setNotice("")
    try {
      const response = await fetch(
        `${import.meta.env.BASE_URL}examples/nota-fiscal-exemplo.svg`
      )
      if (!response.ok) {
        throw new Error("Não foi possível carregar a imagem de exemplo.")
      }
      const image = await createImageBitmap(await response.blob())
      const canvas = document.createElement("canvas")
      canvas.width = image.width
      canvas.height = image.height
      const context = canvas.getContext("2d")
      if (!context) throw new Error("Não foi possível preparar a imagem.")
      context.drawImage(image, 0, 0)
      image.close()
      const png = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/png")
      )
      if (!png) throw new Error("Não foi possível converter a imagem.")
      await uploadInvoice(
        new File([png], "nota-fiscal-exemplo.png", { type: "image/png" })
      )
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Não foi possível processar a imagem de exemplo."
      )
      setBusy("")
    }
  }

  const updateManualLine = (
    index: number,
    field: keyof ManualLine,
    value: string
  ) => {
    setManualLines((current) =>
      current.map((line, lineIndex) => {
        if (lineIndex !== index) return line
        if (field !== "productId") return { ...line, [field]: value }
        const selectedPrice = products.find(
          (product) => product.id === value
        )?.price
        return {
          ...line,
          productId: value,
          unitPrice:
            selectedPrice !== undefined && selectedPrice > 0
              ? String(selectedPrice)
              : "",
        }
      })
    )
  }

  const manualTotal =
    Math.round(
      manualLines.reduce((total, line) => total + manualLineTotal(line), 0) *
        100
    ) / 100

  const createManualReview = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!manualCustomerName.trim()) {
      setError("Informe o nome do cliente para cadastrar a venda.")
      return
    }
    if (
      manualLines.length === 0 ||
      manualLines.some(
        (line) =>
          !line.productId ||
          !Number.isInteger(Number(line.quantity)) ||
          Number(line.quantity) < 1 ||
          !Number.isFinite(Number(line.unitPrice)) ||
          Number(line.unitPrice) <= 0
      )
    ) {
      setError("Escolha o produto e confira quantidade e preço de cada item.")
      return
    }
    setBusy("manual")
    setError("")
    setNotice("")
    try {
      const invoice = parseInvoice(
        await apiRequest("/invoice-imports/manual", {
          method: "POST",
          body: JSON.stringify({
            customerName: manualCustomerName.trim(),
            ...(manualCustomerPhone.trim()
              ? { customerPhone: manualCustomerPhone.trim() }
              : {}),
            items: manualLines.map((line) => ({
              productId: line.productId,
              quantity: Number(line.quantity),
              unitPrice: Number(line.unitPrice),
            })),
          }),
        })
      )
      setInvoices((current) => [invoice, ...current])
      beginReview(invoice)
      setEntryMode("invoice")
      setNotice(
        "Venda preparada. Confira os dados e confirme para registrar e atualizar o estoque."
      )
    } catch (reason) {
      if (await refreshAfterMissingInvoice(reason)) return
      setError(
        reason instanceof Error
          ? reason.message
          : "Não foi possível preparar a venda manual."
      )
    } finally {
      setBusy("")
    }
  }

  const sendQuestion = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selected || !question.trim() || busy) return
    const prompt = question
    setQuestion("")
    await askAssistant(selected, prompt)
  }

  const confirmInvoice = async (invoice: Invoice) => {
    if (!customerName.trim()) {
      setError("Informe o nome do cliente antes de confirmar a venda.")
      setReviewTab("items")
      return
    }
    if (
      reviewItems.length === 0 ||
      reviewItems.some(
        (item) =>
          !item.productId ||
          !Number.isInteger(Number(item.quantityInput)) ||
          Number(item.quantityInput) < 1 ||
          !Number.isFinite(Number(item.priceInput)) ||
          Number(item.priceInput) <= 0
      )
    ) {
      setError("Confira o produto, a quantidade e o preço de cada item.")
      setReviewTab("items")
      return
    }
    setBusy("confirm")
    setError("")
    try {
      await apiRequest(
        `/invoice-imports/${encodeURIComponent(invoice.id)}/confirm`,
        {
          method: "POST",
          body: JSON.stringify({
            confirmAsSale: true,
            customerName: customerName.trim(),
            ...(customerPhone.trim()
              ? { customerPhone: customerPhone.trim() }
              : {}),
            items: reviewItems.map((item) => ({
              productId: item.productId,
              quantity: Number(item.quantityInput),
              unitPrice: Number(item.priceInput),
            })),
          }),
        }
      )
      setInvoices((current) =>
        current.map((item) =>
          item.id === invoice.id ? { ...item, status: "imported" } : item
        )
      )
      setSelectedId("")
      setNotice("Venda registrada e estoque atualizado.")
      await loadData()
    } catch (reason) {
      if (await refreshAfterMissingInvoice(reason)) return
      setError(
        reason instanceof Error
          ? reason.message
          : "Não foi possível registrar a venda."
      )
    } finally {
      setBusy("")
    }
  }

  const rejectInvoice = async (invoice: Invoice) => {
    setBusy("reject")
    setError("")
    try {
      await apiRequest(
        `/invoice-imports/${encodeURIComponent(invoice.id)}/reject`,
        { method: "POST" }
      )
      setInvoices((current) =>
        current.map((item) =>
          item.id === invoice.id ? { ...item, status: "rejected" } : item
        )
      )
      setSelectedId("")
      setNotice("Revisão cancelada sem registrar venda ou alterar estoque.")
    } catch (reason) {
      if (await refreshAfterMissingInvoice(reason)) return
      setError(
        reason instanceof Error
          ? reason.message
          : "Não foi possível recusar a nota."
      )
    } finally {
      setBusy("")
    }
  }

  return (
    <section className="space-y-5">
      <div
        aria-label="Forma de identificar a venda"
        className="flex w-fit max-w-full gap-1 overflow-x-auto rounded-xl border border-border bg-card p-1"
        role="tablist"
      >
        <button
          aria-selected={entryMode === "invoice"}
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium ${
            entryMode === "invoice"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted"
          }`}
          onClick={() => setEntryMode("invoice")}
          role="tab"
          type="button"
        >
          <Sparkles size={16} />
          Ler nota com OCR e IA
        </button>
        <button
          aria-selected={entryMode === "manual"}
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium ${
            entryMode === "manual"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted"
          }`}
          onClick={() => setEntryMode("manual")}
          role="tab"
          type="button"
        >
          <Plus size={16} />
          Cadastrar venda manualmente
        </button>
      </div>

      {entryMode === "invoice" ? (
        <div className={`${cardClass} overflow-hidden`}>
          <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div className="flex items-start gap-4">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <WandSparkles size={22} />
              </span>
              <div>
                <p className="text-sm font-medium text-primary">
                  Importação inteligente
                </p>
                <h2 className="mt-1 text-xl font-semibold">
                  Registre uma venda pela nota fiscal
                </h2>
                <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                  Envie um XML, PDF ou foto. A Sell IA extrai itens e preços,
                  sugere produtos do seu catálogo e pergunta quando algo não
                  estiver claro. Você revisa tudo antes de registrar.
                </p>
              </div>
            </div>
            <div>
              <input
                accept=".xml,.pdf,.png,.jpg,.jpeg,.webp"
                className="sr-only"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (file) void uploadInvoice(file)
                }}
                ref={fileInput}
                type="file"
              />
              <button
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60 sm:w-auto"
                disabled={Boolean(busy)}
                onClick={() => fileInput.current?.click()}
                type="button"
              >
                {busy === "upload" ? (
                  <LoaderCircle className="animate-spin" size={17} />
                ) : (
                  <Upload size={17} />
                )}
                Enviar nota fiscal
              </button>
            </div>
          </div>
          <div className="grid gap-4 border-t border-border bg-muted/20 p-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-6">
            <div className="flex items-center gap-4">
              <img
                alt="Exemplo fictício de nota fiscal para teste do OCR"
                className="hidden h-24 w-20 rounded-lg border border-border bg-white object-cover object-top sm:block"
                height="120"
                src={`${import.meta.env.BASE_URL}examples/nota-fiscal-exemplo.png`}
                width="90"
              />
              <div>
                <p className="text-sm font-medium">
                  Teste com uma nota de exemplo
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Imagem fictícia, sem valor fiscal, com três itens e preços
                  para validar a leitura automática.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <a
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium transition hover:bg-muted"
                download="nota-fiscal-exemplo.png"
                href={`${import.meta.env.BASE_URL}examples/nota-fiscal-exemplo.png`}
              >
                <FileText size={16} />
                Baixar imagem
              </a>
              <button
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium transition hover:bg-muted disabled:opacity-60"
                disabled={Boolean(busy)}
                onClick={() => void handleSampleInvoice()}
                type="button"
              >
                {busy === "sample" ? (
                  <LoaderCircle className="animate-spin" size={16} />
                ) : (
                  <FileText size={16} />
                )}
                Testar imagem
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-2 border-t border-border bg-muted/30 px-5 py-3 text-xs text-muted-foreground sm:px-6">
            <span>XML, PDF, PNG, JPG ou WEBP</span>
            <span>Máximo de 10 MB</span>
            <span>Confirmação manual antes de alterar estoque</span>
          </div>
        </div>
      ) : (
        <form
          className={`${cardClass} space-y-5 p-5 sm:p-6`}
          onSubmit={createManualReview}
        >
          <div>
            <p className="text-sm font-medium text-primary">Registro manual</p>
            <h2 className="mt-1 text-xl font-semibold">
              Identifique os itens da venda
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Informe cliente, produtos, quantidades e preços. A venda só será
              registrada depois da revisão e confirmação.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-medium">
              Cliente
              <input
                className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 font-normal outline-none focus:border-primary"
                maxLength={120}
                onChange={(event) => setManualCustomerName(event.target.value)}
                required
                value={manualCustomerName}
              />
            </label>
            <label className="text-sm font-medium">
              Telefone{" "}
              <span className="font-normal text-muted-foreground">
                (opcional)
              </span>
              <input
                className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 font-normal outline-none focus:border-primary"
                maxLength={40}
                onChange={(event) => setManualCustomerPhone(event.target.value)}
                value={manualCustomerPhone}
              />
            </label>
          </div>
          <div className="space-y-3">
            {manualLines.map((line, index) => (
              <div
                className="grid gap-3 rounded-xl border border-border bg-background p-4 sm:grid-cols-[minmax(0,1fr)_120px_150px_auto]"
                key={`manual-line-${index}`}
              >
                <label className="text-xs font-medium text-muted-foreground">
                  Produto
                  <select
                    className="mt-1.5 w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm font-normal text-foreground outline-none focus:border-primary"
                    onChange={(event) =>
                      updateManualLine(index, "productId", event.target.value)
                    }
                    required
                    value={line.productId}
                  >
                    <option value="">Escolha um produto</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} · estoque {product.stock}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-xs font-medium text-muted-foreground">
                  Quantidade
                  <input
                    className="mt-1.5 w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm font-normal text-foreground outline-none focus:border-primary"
                    min="1"
                    onChange={(event) =>
                      updateManualLine(index, "quantity", event.target.value)
                    }
                    required
                    type="number"
                    value={line.quantity}
                  />
                </label>
                <label className="text-xs font-medium text-muted-foreground">
                  Preço unitário
                  <input
                    className="mt-1.5 w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm font-normal text-foreground outline-none focus:border-primary"
                    min="0.01"
                    onChange={(event) =>
                      updateManualLine(index, "unitPrice", event.target.value)
                    }
                    required
                    step="0.01"
                    type="number"
                    value={line.unitPrice}
                  />
                </label>
                <p className="text-sm font-medium text-foreground sm:col-span-2 sm:text-right">
                  Total do item: {money(manualLineTotal(line))}
                </p>
                <div className="flex items-end">
                  {manualLines.length > 1 ? (
                    <button
                      aria-label={`Remover produto ${index + 1}`}
                      className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-destructive"
                      onClick={() =>
                        setManualLines((current) =>
                          current.filter((_, lineIndex) => lineIndex !== index)
                        )
                      }
                      type="button"
                    >
                      <X size={17} />
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap justify-between gap-3 border-t border-border pt-4">
            <button
              className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted"
              onClick={() =>
                setManualLines((current) => [
                  ...current,
                  { productId: "", quantity: "1", unitPrice: "" },
                ])
              }
              type="button"
            >
              <Plus size={16} />
              Adicionar produto
            </button>
            <button
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
              disabled={Boolean(busy) || products.length === 0}
              type="submit"
            >
              {busy === "manual" ? (
                <LoaderCircle className="animate-spin" size={16} />
              ) : (
                <Check size={16} />
              )}
              Revisar venda
            </button>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-primary/5 px-4 py-3">
            <span className="text-sm font-medium">Total da venda</span>
            <strong className="text-lg font-semibold text-primary">
              {money(manualTotal)}
            </strong>
          </div>
          {products.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Cadastre produtos antes de preparar uma venda manual.
            </p>
          ) : null}
        </form>
      )}

      {error ? (
        <div
          className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
          role="alert"
        >
          <AlertCircle className="mt-0.5 shrink-0" size={17} />
          {error}
        </div>
      ) : null}
      {notice ? (
        <div
          className="flex items-start gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300"
          role="status"
        >
          <Check className="mt-0.5 shrink-0" size={17} />
          {notice}
        </div>
      ) : null}

      {selected ? (
        <section className={`${cardClass} overflow-hidden`}>
          <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <span className="rounded-xl bg-muted p-2.5 text-muted-foreground">
                <FileText size={20} />
              </span>
              <div>
                <h3 className="font-semibold">{selected.fileName}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {selected.fileType === "manual"
                    ? "Venda preenchida manualmente"
                    : `Nota ${selected.invoiceNumber ?? "sem número"} · ${formatDate(selected.issueDate)}${
                        selected.totalAmount !== null
                          ? ` · Total lido: ${money(selected.totalAmount)}`
                          : ""
                      }`}
                </p>
              </div>
            </div>
            <button
              aria-label="Fechar revisão"
              className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted"
              onClick={() => setSelectedId("")}
              type="button"
            >
              <X size={18} />
            </button>
          </header>

          <div className="flex border-b border-border px-5 sm:px-6">
            <button
              className={`inline-flex items-center gap-2 border-b-2 px-3 py-3 text-sm font-medium ${
                reviewTab === "items"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setReviewTab("items")}
              type="button"
            >
              <FileText size={16} />
              Itens da venda
            </button>
            <button
              className={`inline-flex items-center gap-2 border-b-2 px-3 py-3 text-sm font-medium ${
                reviewTab === "assistant"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setReviewTab("assistant")}
              type="button"
            >
              <MessageCircle size={16} />
              Perguntar à Sell IA
              {selected.fileType !== "manual" &&
              reviewItems.some(
                (item) => item.aiConfidence === null || item.aiConfidence < 0.8
              ) ? (
                <span className="size-2 rounded-full bg-amber-500" />
              ) : null}
            </button>
          </div>

          {reviewTab === "items" ? (
            <div className="space-y-5 p-5 sm:p-6">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-sm font-medium">
                  Cliente
                  <input
                    className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 font-normal transition outline-none focus:border-primary"
                    onChange={(event) => setCustomerName(event.target.value)}
                    value={customerName}
                  />
                </label>
                <label className="text-sm font-medium">
                  Telefone{" "}
                  <span className="font-normal text-muted-foreground">
                    (opcional)
                  </span>
                  <input
                    className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 font-normal transition outline-none focus:border-primary"
                    onChange={(event) => setCustomerPhone(event.target.value)}
                    value={customerPhone}
                  />
                </label>
              </div>

              {reviewItems.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border p-6 text-center">
                  <Bot className="mx-auto text-muted-foreground" size={24} />
                  <p className="mt-2 text-sm text-muted-foreground">
                    A IA ainda não identificou itens. Use a aba “Perguntar à
                    Sell IA” para esclarecer ou adicione os itens manualmente.
                  </p>
                </div>
              ) : null}

              <div className="space-y-3">
                {reviewItems.map((item, index) => (
                  <div
                    className="rounded-xl border border-border bg-background p-4"
                    key={`${selected.id}-review-${index}`}
                  >
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold">Item {index + 1}</p>
                      <div className="flex items-center gap-2">
                        {item.aiConfidence !== null ? (
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                              item.aiConfidence >= 0.8
                                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                                : "bg-amber-500/10 text-amber-700 dark:text-amber-300"
                            }`}
                          >
                            IA: {Math.round(item.aiConfidence * 100)}% confiança
                          </span>
                        ) : null}
                        {reviewItems.length > 1 ? (
                          <button
                            aria-label={`Remover item ${index + 1}`}
                            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-destructive"
                            onClick={() =>
                              setReviewItems((current) =>
                                current.filter(
                                  (_, itemIndex) => itemIndex !== index
                                )
                              )
                            }
                            type="button"
                          >
                            <X size={16} />
                          </button>
                        ) : null}
                      </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1.5fr)_130px_150px]">
                      <label className="text-xs font-medium text-muted-foreground">
                        Descrição lida
                        <input
                          className="mt-1.5 w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm font-normal text-foreground outline-none focus:border-primary"
                          onChange={(event) =>
                            updateItem(index, "description", event.target.value)
                          }
                          value={item.description}
                        />
                      </label>
                      <label className="text-xs font-medium text-muted-foreground">
                        Produto EasySell
                        <select
                          className="mt-1.5 w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm font-normal text-foreground outline-none focus:border-primary"
                          onChange={(event) =>
                            updateItem(index, "productId", event.target.value)
                          }
                          value={item.productId}
                        >
                          <option value="">Escolha um produto</option>
                          {item.suggestedProductId &&
                          !products.some(
                            (product) => product.id === item.suggestedProductId
                          ) ? (
                            <option value={item.suggestedProductId}>
                              Sugestão não encontrada no catálogo
                            </option>
                          ) : null}
                          {products.map((product) => (
                            <option key={product.id} value={product.id}>
                              {product.name} · estoque {product.stock}
                            </option>
                          ))}
                        </select>
                        {item.aiConfidence !== null &&
                        item.aiConfidence < 0.8 &&
                        item.suggestedProductId ? (
                          <span className="mt-1 block text-amber-700 dark:text-amber-300">
                            Sugestão da IA:{" "}
                            {products.find(
                              (product) =>
                                product.id === item.suggestedProductId
                            )?.name ?? "produto não localizado"}
                          </span>
                        ) : null}
                      </label>
                      <label className="text-xs font-medium text-muted-foreground">
                        Quantidade
                        <input
                          className="mt-1.5 w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm font-normal text-foreground outline-none focus:border-primary"
                          min="1"
                          onChange={(event) =>
                            updateItem(
                              index,
                              "quantityInput",
                              event.target.value
                            )
                          }
                          type="number"
                          value={item.quantityInput}
                        />
                      </label>
                      <label className="text-xs font-medium text-muted-foreground">
                        Preço unitário
                        <input
                          className="mt-1.5 w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm font-normal text-foreground outline-none focus:border-primary"
                          min="0.01"
                          onChange={(event) =>
                            updateItem(index, "priceInput", event.target.value)
                          }
                          step="0.01"
                          type="number"
                          value={item.priceInput}
                        />
                      </label>
                    </div>
                    {item.aiQuestion ? (
                      <p className="mt-3 text-xs text-amber-700 dark:text-amber-300">
                        <Sparkles className="mr-1 inline" size={13} />
                        {item.aiQuestion}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>

              <button
                className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium transition hover:bg-muted"
                onClick={() =>
                  setReviewItems((current) => [...current, itemForReview()])
                }
                type="button"
              >
                <Plus size={16} />
                Adicionar item manualmente
              </button>

              {selected.ocrText ? (
                <details className="rounded-xl border border-border p-4 text-sm">
                  <summary className="cursor-pointer font-medium">
                    Ver texto extraído pelo OCR
                  </summary>
                  <pre className="mt-3 max-h-56 overflow-auto rounded-lg bg-muted p-3 text-xs whitespace-pre-wrap text-muted-foreground">
                    {selected.ocrText}
                  </pre>
                </details>
              ) : null}

              <div className="flex flex-wrap justify-between gap-3 border-t border-border pt-4">
                <div className="flex gap-2">
                  <button
                    className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted disabled:opacity-60"
                    disabled={Boolean(busy)}
                    onClick={() => void rejectInvoice(selected)}
                    type="button"
                  >
                    {selected.fileType === "manual"
                      ? "Cancelar revisão"
                      : "Recusar nota"}
                  </button>
                  <button
                    className="inline-flex items-center gap-2 rounded-lg border border-primary/30 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/5 disabled:opacity-60"
                    disabled={Boolean(busy)}
                    onClick={() => void askAssistant(selected)}
                    type="button"
                  >
                    {busy === "assist" ? (
                      <LoaderCircle className="animate-spin" size={16} />
                    ) : (
                      <Sparkles size={16} />
                    )}
                    Analisar novamente
                  </button>
                </div>
                <button
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
                  disabled={Boolean(busy)}
                  onClick={() => void confirmInvoice(selected)}
                  type="button"
                >
                  {busy === "confirm" ? (
                    <LoaderCircle className="animate-spin" size={16} />
                  ) : (
                    <Check size={16} />
                  )}
                  Confirmar venda
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                A análise da IA é apenas uma sugestão. A venda e a baixa no
                estoque só acontecem depois da sua confirmação.
              </p>
            </div>
          ) : (
            <div className="flex min-h-[360px] flex-col">
              <div className="flex-1 space-y-3 overflow-y-auto bg-muted/20 p-5 sm:p-6">
                {assistantMessages.length === 0 ? (
                  <div className="mx-auto mt-12 max-w-md text-center">
                    <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Bot size={23} />
                    </span>
                    <h4 className="mt-3 font-semibold">
                      Tire dúvidas sobre esta nota
                    </h4>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Peça para conferir um preço ou esclarecer qual produto
                      corresponde a uma descrição. A Sell IA usa o texto lido e
                      seu catálogo para ajudar.
                    </p>
                    <button
                      className="mt-4 rounded-full border border-border bg-card px-3 py-1.5 text-xs hover:bg-muted"
                      onClick={() =>
                        setQuestion("Quais itens ficaram sem correspondência?")
                      }
                      type="button"
                    >
                      Quais itens não foram identificados?
                    </button>
                  </div>
                ) : (
                  assistantMessages.map((message, index) => (
                    <div
                      className={`flex ${
                        message.role === "user"
                          ? "justify-end"
                          : "justify-start"
                      }`}
                      key={`${selected.id}-chat-${index}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap ${
                          message.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "border border-border bg-card"
                        }`}
                      >
                        {message.role === "assistant" ? (
                          <Bot className="mb-2 text-primary" size={16} />
                        ) : null}
                        {message.content}
                      </div>
                    </div>
                  ))
                )}
                {busy === "question" ? (
                  <p className="flex items-center gap-2 text-sm text-muted-foreground">
                    <LoaderCircle className="animate-spin" size={15} />A Sell IA
                    está analisando...
                  </p>
                ) : null}
              </div>
              <form
                className="flex gap-2 border-t border-border p-4"
                onSubmit={sendQuestion}
              >
                <input
                  aria-label="Pergunta para a Sell IA sobre a nota"
                  className="min-w-0 flex-1 rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary"
                  maxLength={1000}
                  onChange={(event) => setQuestion(event.target.value)}
                  placeholder="Pergunte sobre os itens ou valores..."
                  value={question}
                />
                <button
                  aria-label="Enviar pergunta"
                  className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground disabled:opacity-50"
                  disabled={!question.trim() || Boolean(busy)}
                  type="submit"
                >
                  <Send size={17} />
                </button>
              </form>
            </div>
          )}
        </section>
      ) : null}

      <section className={`${cardClass} overflow-hidden`}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4 sm:px-6">
          <div>
            <h3 className="font-semibold">Vendas para revisar</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {pendingInvoices.length} aguardando sua conferência
            </p>
          </div>
          <button
            className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted disabled:opacity-60"
            disabled={Boolean(busy)}
            onClick={() => {
              setLoading(true)
              void loadData()
                .catch((reason: unknown) =>
                  setError(
                    reason instanceof Error
                      ? reason.message
                      : "Não foi possível atualizar as notas."
                  )
                )
                .finally(() => setLoading(false))
            }}
            type="button"
          >
            Atualizar lista
          </button>
        </div>
        {loading ? (
          <p className="p-6 text-sm text-muted-foreground">
            Carregando notas...
          </p>
        ) : pendingInvoices.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="mx-auto text-muted-foreground/50" size={32} />
            <p className="mt-3 font-medium">Tudo em dia</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Notas lidas por OCR e vendas manuais aparecerão aqui para revisão.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {pendingInvoices.map((invoice) => (
              <li
                className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-6"
                key={invoice.id}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="rounded-xl bg-muted p-2.5 text-muted-foreground">
                    <FileText size={18} />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{invoice.fileName}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {invoice.fileType === "manual"
                        ? "Venda manual"
                        : `Nota ${invoice.invoiceNumber ?? "sem número"}`}{" "}
                      · {invoice.items.length} item(ns) extraído(s) ·{" "}
                      {invoice.customerName ?? "cliente não identificado"}
                    </p>
                  </div>
                </div>
                <button
                  className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium transition hover:bg-muted"
                  disabled={Boolean(busy)}
                  onClick={() => {
                    beginReview(invoice)
                    if (
                      invoice.fileType !== "manual" &&
                      !invoice.items.some((item) => item.aiConfidence !== null)
                    ) {
                      void askAssistant(invoice)
                    }
                  }}
                  type="button"
                >
                  {invoice.fileType === "manual" ? (
                    <FileText size={16} />
                  ) : (
                    <Sparkles size={16} />
                  )}
                  {invoice.fileType === "manual"
                    ? "Revisar venda"
                    : "Revisar com IA"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {invoices.some((invoice) => invoice.status !== "pending_review") ? (
        <section className={`${cardClass} p-5 sm:p-6`}>
          <h3 className="font-semibold">Importações recentes</h3>
          <ul className="mt-3 divide-y divide-border text-sm">
            {invoices
              .filter((invoice) => invoice.status !== "pending_review")
              .map((invoice) => (
                <li
                  className="flex flex-wrap items-center justify-between gap-2 py-3"
                  key={invoice.id}
                >
                  <span>{invoice.fileName}</span>
                  <span
                    className={
                      invoice.status === "imported"
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-muted-foreground"
                    }
                  >
                    {invoice.status === "imported"
                      ? "Venda registrada"
                      : "Recusada"}
                  </span>
                </li>
              ))}
          </ul>
        </section>
      ) : null}
    </section>
  )
}
