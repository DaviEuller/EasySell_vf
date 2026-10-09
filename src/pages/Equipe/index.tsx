    import { Fragment, useCallback, useEffect, useState } from "react"
import type { FormEvent } from "react"
import {
  Check,
  CircleAlert,
  ChevronDown,
  ChevronUp,
  Download,
  ListTodo,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserPlus,
  UsersRound,
  X,
} from "lucide-react"

type TeamMember = {
  id: string
  name: string
  age: number
  role: string
  joinedAt: string
  phone: string
  userEmail?: string
  tasks: TeamTask[]
}

type TeamTask = {
  id: string
  text: string
  completed: boolean
  dueDate?: string
  submittedAt?: string
  report?: string
  attachment?: {
    name: string
    type: string
    size: number
  }
}

type MemberDraft = {
  name: string
  age: string
  role: string
  joinedAt: string
  phone: string
  userEmail: string
}

type ApiRecord = Record<string, unknown>

function isApiRecord(value: unknown): value is ApiRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function parseOptionalDate(value: unknown): string | undefined | null {
  if (value === undefined || value === null) return undefined
  const date =
    value instanceof Date
      ? value
      : typeof value === "string"
        ? new Date(value)
        : null
  if (!date || Number.isNaN(date.getTime())) return null
  return date.toISOString()
}

function getApiContext(requireCompany = true) {
  const apiUrl = import.meta.env.VITE_API_URL?.trim().replace(/\/+$/, "")
  const companyId = localStorage.getItem("companyId")
  const token = localStorage.getItem("accessToken")

  if (!apiUrl) {
    throw new Error("A API não está configurada. Defina VITE_API_URL.")
  }
  if (requireCompany && !companyId) {
    throw new Error("Não foi possível identificar a empresa. Entre novamente.")
  }
  if (!token) {
    throw new Error("Sua sessão expirou. Entre novamente para continuar.")
  }

  return {
    apiUrl,
    companyId: companyId ?? "",
    headers: { Authorization: `Bearer ${token}` },
  }
}

async function getApiError(response: Response) {
  const responseText = await response.text()
  if (!responseText) {
    return `Não foi possível concluir a operação (erro ${response.status}).`
  }

  try {
    const body: unknown = JSON.parse(responseText)
    if (isApiRecord(body)) {
      if (typeof body.message === "string") return body.message
      if (
        Array.isArray(body.message) &&
        body.message.every((item) => typeof item === "string")
      ) {
        return body.message.join(" ")
      }
      if (typeof body.error === "string") return body.error
    }
  } catch {
    return responseText
  }

  return `Não foi possível concluir a operação (erro ${response.status}).`
}

async function readApiJson(response: Response): Promise<unknown> {
  const responseText = await response.text()
  if (!responseText) return null
  try {
    return JSON.parse(responseText) as unknown
  } catch {
    throw new Error("A resposta da API de equipe está em um formato inválido.")
  }
}

function parseMember(value: unknown): TeamMember | null {
  if (isApiRecord(value) && "data" in value) {
    return parseMember(value.data)
  }
  if (isApiRecord(value) && "member" in value) {
    return parseMember(value.member)
  }
  if (!isApiRecord(value)) return null

  const rawId = value._id ?? value.id
  const rawAge = value.age
  const rawDate = value.dataEntrada
  if (
    (typeof rawId !== "string" && typeof rawId !== "number") ||
    typeof value.name !== "string" ||
    (typeof rawAge !== "number" && typeof rawAge !== "string") ||
    typeof value.funcao !== "string" ||
    (typeof rawDate !== "string" && !(rawDate instanceof Date)) ||
    (typeof value.telefone !== "string" && typeof value.telefone !== "number")
  ) {
    return null
  }

  const age = Number(rawAge)
  const date = rawDate instanceof Date ? rawDate.toISOString() : rawDate
  if (!String(rawId).trim() || !Number.isInteger(age) || age < 0) return null

  const rawTasks = value.tasks ?? []
  if (!Array.isArray(rawTasks)) return null
  const tasks = rawTasks.map((rawTask): TeamTask | null => {
    if (!isApiRecord(rawTask)) return null
    const taskId = rawTask._id ?? rawTask.id
    if (
      (typeof taskId !== "string" && typeof taskId !== "number") ||
      typeof rawTask.text !== "string" ||
      typeof rawTask.completed !== "boolean"
    ) {
      return null
    }
    const dueDate = parseOptionalDate(rawTask.dueDate)
    const submittedAt = parseOptionalDate(rawTask.submittedAt)
    if (
      dueDate === null ||
      submittedAt === null ||
      (rawTask.report !== undefined && typeof rawTask.report !== "string")
    ) {
      return null
    }
    let attachment: TeamTask["attachment"]
    if (rawTask.attachmentName !== undefined) {
      if (
        typeof rawTask.attachmentName !== "string" ||
        typeof rawTask.attachmentType !== "string" ||
        typeof rawTask.attachmentSize !== "number"
      ) {
        return null
      }
      attachment = {
        name: rawTask.attachmentName,
        type: rawTask.attachmentType,
        size: rawTask.attachmentSize,
      }
    }
    return {
      id: String(taskId),
      text: rawTask.text,
      completed: rawTask.completed,
      ...(dueDate ? { dueDate } : {}),
      ...(submittedAt ? { submittedAt } : {}),
      ...(typeof rawTask.report === "string" ? { report: rawTask.report } : {}),
      ...(attachment ? { attachment } : {}),
    }
  })
  if (tasks.some((task) => task === null)) return null

  return {
    id: String(rawId),
    name: value.name,
    age,
    role: value.funcao,
    joinedAt: date.slice(0, 10),
    phone: String(value.telefone),
    ...(typeof value.userEmail === "string"
      ? { userEmail: value.userEmail }
      : {}),
    tasks: tasks.filter((task): task is TeamTask => task !== null),
  }
}

function parseMembers(payload: unknown): TeamMember[] {
  let data = payload
  if (isApiRecord(data) && "data" in data) data = data.data
  if (isApiRecord(data)) {
    data = data.members ?? data.equipe ?? data.items
  }
  if (!Array.isArray(data)) {
    throw new Error("A resposta da API de equipe está em um formato inválido.")
  }

  const members = data.map(parseMember)
  if (members.some((member) => member === null)) {
    throw new Error("A API retornou um membro com dados inválidos.")
  }
  return members.filter((member): member is TeamMember => member !== null)
}

function today() {
  const date = new Date()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${date.getFullYear()}-${month}-${day}`
}

function emptyDraft(): MemberDraft {
  return {
    name: "",
    age: "",
    role: "",
    joinedAt: today(),
    phone: "",
    userEmail: "",
  }
}

function exportMembers(members: TeamMember[]) {
  downloadCsv("equipe-easysell.csv", [
    ["Nome", "Idade", "Função", "Telefone", "Data de entrada"],
    ...members.map((member) => [
      member.name,
      String(member.age),
      member.role,
      member.phone,
      member.joinedAt,
    ]),
  ])
}

function formatDate(date: string) {
  if (!date) return "—"
  const parsedDate = new Date(`${date}T00:00:00`)
  return Number.isNaN(parsedDate.getTime())
    ? date
    : parsedDate.toLocaleDateString("pt-BR")
}

function formatDateTime(date: string) {
  const parsedDate = new Date(date)
  return Number.isNaN(parsedDate.getTime())
    ? date
    : parsedDate.toLocaleString("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
      })
}

function isTaskOverdue(task: TeamTask) {
  if (task.completed || !task.dueDate) return false
  const deadline = new Date(`${task.dueDate.slice(0, 10)}T23:59:59`)
  return deadline.getTime() < Date.now()
}

function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows
    .map((row) =>
      row
        .map((value) => `"${value.replace(/"/g, '""')}"`)
        .join(";"),
    )
    .join("\r\n")
  const url = URL.createObjectURL(
    new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }),
  )
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function exportTaskReport(member: TeamMember) {
  const rows = [
    ["Tarefa", "Prazo", "Entregue em", "Status", "Relatório"],
    ...member.tasks.map((task) => [
      task.text,
      task.dueDate ? formatDate(task.dueDate.slice(0, 10)) : "Sem prazo",
      task.submittedAt ? formatDateTime(task.submittedAt) : "Ainda não entregue",
      task.completed ? "Concluída" : isTaskOverdue(task) ? "Atrasada" : "Pendente",
      task.report ?? "",
    ]),
  ]
  const filename = `relatorio-tarefas-${member.name
    .trim()
    .replace(/[^a-z0-9]+/gi, "-")
    .toLowerCase()}.csv`
  downloadCsv(filename, rows)
}

export function Equipe() {
  const currentRole = localStorage.getItem("role")
  const isEmployee =
    currentRole === "funcionario" || currentRole === "atendente"
  const [members, setMembers] = useState<TeamMember[]>([])
  const [query, setQuery] = useState("")
  const [notice, setNotice] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const [loadError, setLoadError] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null)
  const [draft, setDraft] = useState<MemberDraft>(emptyDraft)
  const [expandedMemberId, setExpandedMemberId] = useState<string | null>(null)
  const [taskDrafts, setTaskDrafts] = useState<Record<string, string>>({})
  const [taskDueDates, setTaskDueDates] = useState<Record<string, string>>({})
  const [taskReports, setTaskReports] = useState<Record<string, string>>({})
  const [savingTaskFor, setSavingTaskFor] = useState<string | null>(null)

  const loadMembers = useCallback(async () => {
    const { apiUrl, companyId, headers } = getApiContext(!isEmployee)
    const response = await fetch(
      isEmployee
        ? `${apiUrl}/equipe/minhas-tarefas`
        : `${apiUrl}/equipe/funcionarios?companyId=${encodeURIComponent(companyId)}`,
      { headers },
    )
    if (!response.ok) throw new Error(await getApiError(response))
    const payload = await readApiJson(response)
    if (isEmployee) {
      const member = parseMember(payload)
      if (!member) {
        throw new Error(
          "A API não retornou os dados do funcionário e suas tarefas.",
        )
      }
      localStorage.setItem("equipeMemberId", member.id)
      setMembers([member])
    } else {
      setMembers(parseMembers(payload))
    }
    setLoadError("")
  }, [isEmployee])

  useEffect(() => {
    let active = true
    Promise.resolve()
      .then(loadMembers)
      .catch((error: unknown) => {
        if (active) {
          setLoadError(
            error instanceof Error
              ? error.message
              : "Não foi possível carregar a equipe.",
          )
        }
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })

    return () => {
      active = false
    }
  }, [loadMembers])

  const filteredMembers = members.filter((member) =>
    `${member.name} ${member.role} ${member.phone}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  )

  const openCreateForm = () => {
    setEditingMember(null)
    setDraft(emptyDraft())
    setErrorMessage("")
    setShowForm(true)
  }

  const openEditForm = (member: TeamMember) => {
    setEditingMember(member)
    setDraft({
      name: member.name,
      age: String(member.age),
      role: member.role,
      joinedAt: member.joinedAt,
      phone: member.phone,
      userEmail: member.userEmail ?? "",
    })
    setErrorMessage("")
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingMember(null)
    setDraft(emptyDraft())
    setErrorMessage("")
  }

  const saveMember = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setErrorMessage("")

    try {
      const { apiUrl, companyId, headers } = getApiContext()
      const payload = {
        name: draft.name.trim(),
        age: Number(draft.age),
        funcao: draft.role.trim(),
        dataEntrada: draft.joinedAt,
        telefone: draft.phone.trim(),
        ...(!editingMember ? { companyId } : {}),
        ...(draft.userEmail.trim()
          ? { userEmail: draft.userEmail.trim() }
          : {}),
      }
      const response = await fetch(
        editingMember
          ? `${apiUrl}/equipe/${encodeURIComponent(editingMember.id)}`
          : `${apiUrl}/equipe`,
        {
          method: editingMember ? "PATCH" : "POST",
          headers: { ...headers, "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      )
      if (!response.ok) throw new Error(await getApiError(response))

      const savedMember = parseMember(await readApiJson(response))
      if (!savedMember) {
        throw new Error("A API retornou os dados do membro em um formato inválido.")
      }

      setMembers((current) =>
        editingMember
          ? current.map((member) =>
              member.id === editingMember.id ? savedMember : member,
            )
          : [savedMember, ...current],
      )
      setNotice(
        editingMember
          ? "Dados do membro atualizados."
          : "Membro adicionado à equipe.",
      )
      closeForm()
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível salvar o membro.",
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const removeMember = async (member: TeamMember) => {
    if (!window.confirm(`Remover ${member.name} da equipe?`)) return
    setNotice("")
    setErrorMessage("")

    try {
      const { apiUrl, headers } = getApiContext()
      const response = await fetch(
        `${apiUrl}/equipe/${encodeURIComponent(member.id)}`,
        { method: "DELETE", headers },
      )
      if (!response.ok) throw new Error(await getApiError(response))

      setMembers((current) =>
        current.filter((currentMember) => currentMember.id !== member.id),
      )
      setNotice(`${member.name} foi removido da equipe.`)
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível remover o membro.",
      )
    }
  }

  const replaceMemberFromResponse = (payload: unknown) => {
    const updatedMember = parseMember(payload)
    if (!updatedMember) {
      throw new Error("A API retornou dados inválidos para as tarefas.")
    }
    setMembers((current) =>
      current.map((member) =>
        member.id === updatedMember.id ? updatedMember : member,
      ),
    )
  }

  const submitTaskFile = async (
    member: TeamMember,
    task: TeamTask,
    file: File,
    report: string,
  ) => {
    if (!report.trim()) {
      setErrorMessage("Escreva um relatório breve antes de enviar o comprovante.")
      return
    }
    setSavingTaskFor(member.id)
    setErrorMessage("")
    setNotice("")
    try {
      const { apiUrl, headers } = getApiContext(false)
      const formData = new FormData()
      formData.append("file", file)
      formData.append("report", report.trim())
      const response = await fetch(
        `${apiUrl}/equipe/${encodeURIComponent(member.id)}/tasks/${encodeURIComponent(task.id)}/attachment`,
        { method: "POST", headers, body: formData },
      )
      if (!response.ok) throw new Error(await getApiError(response))
      replaceMemberFromResponse(await readApiJson(response))
      setTaskReports((current) => ({ ...current, [task.id]: "" }))
      setNotice("Arquivo enviado. A tarefa foi concluída.")
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível enviar o arquivo da tarefa.",
      )
    } finally {
      setSavingTaskFor(null)
    }
  }

  const downloadTaskFile = async (member: TeamMember, task: TeamTask) => {
    setSavingTaskFor(member.id)
    setErrorMessage("")
    try {
      const { apiUrl, headers } = getApiContext(false)
      const response = await fetch(
        `${apiUrl}/equipe/${encodeURIComponent(member.id)}/tasks/${encodeURIComponent(task.id)}/file`,
        { headers },
      )
      if (!response.ok) throw new Error(await getApiError(response))
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = task.attachment?.name ?? "comprovante"
      link.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível baixar o arquivo da tarefa.",
      )
    } finally {
      setSavingTaskFor(null)
    }
  }

  const addTask = async (member: TeamMember) => {
    const text = taskDrafts[member.id]?.trim()
    const dueDate = taskDueDates[member.id] ?? today()
    if (!text || !dueDate) return

    setSavingTaskFor(member.id)
    setErrorMessage("")
    setNotice("")
    try {
      const { apiUrl, headers } = getApiContext()
      const response = await fetch(
        `${apiUrl}/equipe/${encodeURIComponent(member.id)}/tasks`,
        {
          method: "POST",
          headers: { ...headers, "Content-Type": "application/json" },
          body: JSON.stringify({ text, dueDate }),
        },
      )
      if (!response.ok) throw new Error(await getApiError(response))
      replaceMemberFromResponse(await readApiJson(response))
      setTaskDrafts((current) => ({ ...current, [member.id]: "" }))
      setTaskDueDates((current) => ({ ...current, [member.id]: today() }))
      setNotice("Tarefa adicionada.")
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível adicionar a tarefa.",
      )
    } finally {
      setSavingTaskFor(null)
    }
  }

  const removeTask = async (member: TeamMember, task: TeamTask) => {
    setSavingTaskFor(member.id)
    setErrorMessage("")
    setNotice("")
    try {
      const { apiUrl, headers } = getApiContext()
      const response = await fetch(
        `${apiUrl}/equipe/${encodeURIComponent(member.id)}/tasks/${encodeURIComponent(task.id)}`,
        { method: "DELETE", headers },
      )
      if (!response.ok) throw new Error(await getApiError(response))
      replaceMemberFromResponse(await readApiJson(response))
      setNotice("Tarefa removida.")
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível remover a tarefa.",
      )
    } finally {
      setSavingTaskFor(null)
    }
  }

  const averageAge = members.length
    ? Math.round(
        members.reduce((total, member) => total + member.age, 0) /
          members.length,
      )
    : null
  const roleCount = new Set(members.map((member) => member.role)).size

  if (isEmployee) {
    const member = members[0]
    const completedTasks =
      member?.tasks.filter((task) => task.completed).length ?? 0
    const overdueTasks =
      member?.tasks.filter(isTaskOverdue).length ?? 0
    return (
    <main className="min-h-screen bg-background px-4 pt-20 pb-16 text-foreground sm:px-8">
      <div className="mx-auto max-w-4xl">
        <header className="py-10">
          <p className="text-xs font-semibold tracking-[0.24em] text-blue-600 uppercase dark:text-blue-300">
            Área do funcionário
          </p>
          <h1 className="mt-4 font-heading text-4xl font-bold">
            Minhas tarefas
          </h1>
          <p className="mt-3 text-sm text-foreground/55">
            Envie um arquivo de comprovação para concluir cada tarefa.
          </p>
        </header>
        {notice && (
          <p className="mb-4 rounded-md border border-blue-400/20 bg-blue-400/5 px-4 py-3 text-sm text-blue-700 dark:text-blue-200">
            {notice}
          </p>
        )}
        {errorMessage && (
          <p role="alert" className="mb-4 rounded-md bg-red-400/10 px-4 py-3 text-sm text-red-700 dark:text-red-300">
            {errorMessage}
          </p>
        )}
        {!isLoading && !loadError && member && (
          <section className="app-panel mb-4 rounded-md p-5 sm:p-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h2 className="font-heading text-lg font-bold">
                  Relatório das tarefas
                </h2>
                <p className="mt-1 text-sm text-foreground/55">
                  {member.tasks.length} no total · {completedTasks} concluídas ·{" "}
                  {overdueTasks} atrasadas
                </p>
              </div>
              <button
                type="button"
                disabled={member.tasks.length === 0}
                onClick={() => exportTaskReport(member)}
                className="rounded-md border border-border px-4 py-2 text-sm font-semibold transition hover:bg-foreground/[0.05] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Baixar relatório para Excel (CSV)
              </button>
            </div>
          </section>
        )}
        {isLoading ? (
          <p className="app-panel rounded-md p-8 text-center text-sm text-foreground/55">
            Carregando tarefas...
          </p>
        ) : loadError ? (
          <div className="app-panel rounded-md p-8 text-center">
            <p role="alert" className="text-sm text-red-700 dark:text-red-300">{loadError}</p>
            <button
              onClick={() => {
                setIsLoading(true)
                void loadMembers()
                  .catch((error: unknown) =>
                    setLoadError(
                      error instanceof Error
                        ? error.message
                        : "Não foi possível carregar as tarefas.",
                    ),
                  )
                  .finally(() => setIsLoading(false))
              }}
              className="mt-4 text-sm font-semibold text-blue-600 dark:text-blue-300"
            >
              Tentar novamente
            </button>
          </div>
        ) : !member ? (
          <p className="app-panel rounded-md p-8 text-center text-sm text-foreground/55">
            Sua conta ainda não foi vinculada a um membro da equipe. Fale com o responsável da empresa.
          </p>
        ) : member.tasks.length === 0 ? (
          <p className="app-panel rounded-md p-8 text-center text-sm text-foreground/55">
            Você ainda não tem tarefas atribuídas.
          </p>
        ) : (
          <ul className="space-y-3">
            {member.tasks.map((task) => (
              <li key={task.id} className="app-panel rounded-md p-5 sm:p-6">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div className="flex items-start gap-3">
                    {task.completed ? (
                      <Check className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-300" size={19} />
                    ) : (
                      <ListTodo className="mt-0.5 shrink-0 text-blue-600 dark:text-blue-300" size={19} />
                    )}
                    <div>
                      <p className={`font-semibold ${task.completed ? "text-foreground/55 line-through" : ""}`}>
                        {task.text}
                      </p>
                      <p className="mt-1 text-xs text-foreground/45">
                        {task.completed ? "Concluída com arquivo enviado" : "Pendente — envie PDF ou imagem (máx. 5 MB)"}
                      </p>
                      <p className="mt-2 text-xs text-foreground/55">
                        Prazo:{" "}
                        {task.dueDate
                          ? formatDate(task.dueDate.slice(0, 10))
                          : "Não informado"}
                        {task.submittedAt
                          ? ` · Entregue em ${formatDateTime(task.submittedAt)}`
                          : ""}
                        {isTaskOverdue(task) ? " · Atrasada" : ""}
                      </p>
                      {task.report && (
                        <div className="mt-3 rounded-md border border-border bg-foreground/[0.03] p-3">
                          <p className="text-xs font-semibold text-foreground/55">
                            Relatório enviado
                          </p>
                          <p className="mt-1 whitespace-pre-wrap text-sm text-foreground/75">
                            {task.report}
                          </p>
                        </div>
                      )}
                      {!task.completed && (
                        <label className="mt-4 block">
                          <span className="text-xs font-semibold text-foreground/60">
                            Relatório da tarefa
                          </span>
                          <textarea
                            maxLength={2000}
                            required
                            value={taskReports[task.id] ?? ""}
                            onChange={(event) =>
                              setTaskReports((current) => ({
                                ...current,
                                [task.id]: event.target.value,
                              }))
                            }
                            placeholder="Descreva o trabalho realizado antes de anexar o comprovante."
                            className="mt-1 min-h-20 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-foreground/35 focus:border-blue-400/60"
                          />
                        </label>
                      )}
                      {task.attachment && (
                        <button
                          type="button"
                          disabled={savingTaskFor === member.id}
                          onClick={() => void downloadTaskFile(member, task)}
                          className="mt-2 text-xs font-semibold text-blue-600 hover:text-blue-500 dark:text-blue-300"
                        >
                          Ver arquivo enviado: {task.attachment.name}
                        </button>
                      )}
                    </div>
                  </div>
                  {!task.completed && (
                    <label className="inline-flex h-10 cursor-pointer items-center justify-center rounded-md bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-500">
                      {savingTaskFor === member.id ? "Enviando..." : "Enviar arquivo"}
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
                        disabled={
                          savingTaskFor === member.id ||
                          !taskReports[task.id]?.trim()
                        }
                        className="sr-only"
                        onChange={(event) => {
                          const file = event.currentTarget.files?.[0]
                          if (file) {
                            void submitTaskFile(
                              member,
                              task,
                              file,
                              taskReports[task.id] ?? "",
                            )
                          }
                          event.currentTarget.value = ""
                        }}
                      />
                    </label>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
    )
  }

  return (
    <main className="min-h-screen overflow-hidden bg-background px-4 pt-20 pb-16 text-foreground sm:px-8">
      <div className="relative z-10 mx-auto max-w-7xl">
        <section className="flex flex-col justify-between gap-6 py-10 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold tracking-[0.24em] text-blue-600 uppercase dark:text-blue-300">
              Gestão interna
            </p>
            <h1 className="mt-4 font-heading text-4xl font-bold sm:text-5xl">
              Sua equipe.
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-foreground/50">
              Gerencie os membros e acompanhe os dados da sua equipe em um só
              lugar.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => exportMembers(filteredMembers)}
              disabled={members.length === 0}
              className="inline-flex h-11 items-center gap-2 rounded-md border border-foreground/15 bg-foreground/[0.04] px-4 text-sm font-semibold text-foreground/75 transition hover:bg-foreground/10 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Download size={16} /> Exportar para Excel
            </button>
            <button
              onClick={openCreateForm}
              className="inline-flex h-11 items-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-500"
            >
              <Plus size={17} /> Adicionar
            </button>
          </div>
        </section>

        <section className="grid gap-3 border-y border-border py-6 sm:grid-cols-3">
          <div>
            <p className="text-xs text-foreground/45">Membros da equipe</p>
            <strong className="mt-2 block font-heading text-3xl">
              {isLoading || loadError ? "—" : members.length}
            </strong>
          </div>
          <div>
            <p className="text-xs text-foreground/45">Idade média</p>
            <strong className="mt-2 block font-heading text-3xl">
              {isLoading || loadError || averageAge === null
                ? "—"
                : `${averageAge} anos`}
            </strong>
          </div>
          <div>
            <p className="text-xs text-foreground/45">Funções representadas</p>
            <strong className="mt-2 block font-heading text-3xl">
              {isLoading || loadError ? "—" : roleCount}
            </strong>
          </div>
        </section>

        <section className="mt-8 grid gap-4 lg:grid-cols-[1fr_0.8fr]">
          <div className="app-panel rounded-md p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold tracking-[0.16em] text-blue-600 uppercase dark:text-blue-300">
                  Pessoas
                </p>
                <h2 className="mt-2 font-heading text-2xl font-bold">
                  Uma equipe conectada
                </h2>
                <p className="mt-3 text-sm leading-6 text-foreground/50">
                  Cadastre e mantenha atualizadas as informações dos
                  funcionários da sua empresa.
                </p>
              </div>
              <UsersRound className="text-blue-600 dark:text-blue-300" size={22} />
            </div>
          </div>
          <div className="app-panel rounded-md p-5 sm:p-6">
            <p className="text-xs font-semibold tracking-[0.16em] text-blue-600 uppercase dark:text-blue-300">
              EasyCrew
            </p>
            <h2 className="mt-2 font-heading text-2xl font-bold">
              Encontre seu próximo talento.
            </h2>
            <p className="mt-3 text-sm leading-6 text-foreground/50">
              A integração de candidatos do EasyCrew estará disponível em breve.
            </p>
            <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 dark:text-blue-200">
              <UserPlus size={16} /> Em breve
            </span>
          </div>
        </section>

        <section className="app-panel mt-8 rounded-md">
          <div className="flex flex-col gap-4 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div>
              <p className="text-xs font-semibold tracking-[0.16em] text-blue-600 uppercase dark:text-blue-300">
                Pessoas
              </p>
              <h2 className="mt-2 font-heading text-2xl font-bold">
                Funcionários
              </h2>
            </div>
            <label className="relative">
              <Search
                className="absolute top-1/2 left-3 -translate-y-1/2 text-foreground/35"
                size={16}
              />
              <input
                aria-label="Buscar funcionário"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar funcionário"
                className="h-10 w-full rounded-md border border-border bg-foreground/[0.04] pr-3 pl-9 text-sm outline-none placeholder:text-foreground/35 focus:border-blue-400/50 sm:w-64"
              />
            </label>
          </div>

          {notice && (
            <p className="border-b border-blue-400/15 bg-blue-400/5 px-5 py-3 text-sm text-blue-700 dark:text-blue-200 sm:px-6">
              {notice}
            </p>
          )}
          {errorMessage && (
            <p
              role="alert"
              className="flex items-center gap-2 border-b border-red-400/20 bg-red-400/5 px-5 py-3 text-sm text-red-700 dark:text-red-300 sm:px-6"
            >
              <CircleAlert size={16} /> {errorMessage}
            </p>
          )}

          {showForm && (
            <form
              onSubmit={saveMember}
              className="border-b border-border bg-foreground/[0.02] p-5 sm:p-6"
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="font-heading text-xl font-bold">
                  {editingMember ? "Editar membro" : "Adicionar membro"}
                </h3>
                <button
                  type="button"
                  onClick={closeForm}
                  aria-label="Fechar formulário"
                  className="rounded-md p-2 text-foreground/50 transition hover:bg-foreground/10 hover:text-foreground"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <label className="text-xs font-medium text-foreground/55">
                  Nome
                  <input
                    required
                    maxLength={120}
                    value={draft.name}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    className="mt-1.5 h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-blue-400/60"
                  />
                </label>
                <label className="text-xs font-medium text-foreground/55">
                  Idade
                  <input
                    required
                    min="0"
                    max="150"
                    type="number"
                    value={draft.age}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        age: event.target.value,
                      }))
                    }
                    className="mt-1.5 h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-blue-400/60"
                  />
                </label>
                <label className="text-xs font-medium text-foreground/55">
                  Função
                  <input
                    required
                    maxLength={100}
                    value={draft.role}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        role: event.target.value,
                      }))
                    }
                    className="mt-1.5 h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-blue-400/60"
                  />
                </label>
                <label className="text-xs font-medium text-foreground/55">
                  Data de entrada
                  <input
                    required
                    type="date"
                    value={draft.joinedAt}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        joinedAt: event.target.value,
                      }))
                    }
                    className="mt-1.5 h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-blue-400/60"
                  />
                </label>
                <label className="text-xs font-medium text-foreground/55">
                  Telefone
                  <input
                    required
                    maxLength={30}
                    type="tel"
                    value={draft.phone}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        phone: event.target.value,
                      }))
                    }
                    className="mt-1.5 h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-blue-400/60"
                  />
                </label>
                <label className="text-xs font-medium text-foreground/55 sm:col-span-2 lg:col-span-1">
                  E-mail da conta do funcionário
                  <input
                    type="email"
                    value={draft.userEmail}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        userEmail: event.target.value,
                      }))
                    }
                    placeholder="funcionario@empresa.com"
                    className="mt-1.5 h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none placeholder:text-foreground/35 focus:border-blue-400/60"
                  />
                  <span className="mt-1 block text-[11px] text-foreground/40">
                    Vincule uma conta existente que não seja responsável por outra empresa. Ela passará a ter o perfil de funcionário.
                  </span>
                </label>
              </div>
              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeForm}
                  className="h-10 rounded-md border border-border px-4 text-sm font-semibold text-foreground/65 transition hover:bg-foreground/5"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-10 rounded-md bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-wait disabled:opacity-60"
                >
                  {isSubmitting
                    ? "Salvando..."
                    : editingMember
                      ? "Salvar alterações"
                      : "Adicionar à equipe"}
                </button>
              </div>
            </form>
          )}

          {isLoading ? (
            <p className="p-8 text-center text-sm text-foreground/50">
              Carregando equipe...
            </p>
          ) : loadError ? (
            <div className="p-8 text-center">
              <p role="alert" className="text-sm text-red-700 dark:text-red-300">
                {loadError}
              </p>
              <button
                onClick={() => {
                  setIsLoading(true)
                  void loadMembers()
                    .catch((error: unknown) =>
                      setLoadError(
                        error instanceof Error
                          ? error.message
                          : "Não foi possível carregar a equipe.",
                      ),
                    )
                    .finally(() => setIsLoading(false))
                }}
                className="mt-4 text-sm font-semibold text-blue-600 hover:text-blue-500 dark:text-blue-300"
              >
                Tentar novamente
              </button>
            </div>
          ) : members.length === 0 ? (
            <div className="p-10 text-center">
              <UsersRound
                className="mx-auto text-foreground/30"
                size={30}
              />
              <h3 className="mt-4 font-heading text-lg font-bold">
                Sua equipe ainda está vazia
              </h3>
              <p className="mt-2 text-sm text-foreground/50">
                Adicione o primeiro funcionário para começar.
              </p>
              <button
                onClick={openCreateForm}
                className="mt-5 inline-flex h-10 items-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-500"
              >
                <Plus size={16} /> Adicionar funcionário
              </button>
            </div>
          ) : filteredMembers.length === 0 ? (
            <p className="p-8 text-center text-sm text-foreground/50">
              Nenhum funcionário encontrado para essa busca.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="text-xs tracking-[0.12em] text-foreground/40 uppercase">
                  <tr>
                    <th className="px-5 py-4 font-medium sm:px-6">Nome</th>
                    <th className="px-5 py-4 font-medium">Idade</th>
                    <th className="px-5 py-4 font-medium">Função</th>
                    <th className="px-5 py-4 font-medium">Telefone</th>
                    <th className="px-5 py-4 font-medium">Data de entrada</th>
                    <th className="px-5 py-4 font-medium">Tarefas</th>
                    <th className="px-5 py-4 font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.map((member) => (
                    <Fragment key={member.id}>
                    <tr className="border-t border-border">
                      <td className="px-5 py-4 font-semibold sm:px-6">
                        {member.name}
                      </td>
                      <td className="px-5 py-4 text-foreground/60">
                        {member.age}
                      </td>
                      <td className="px-5 py-4 text-foreground/60">
                        {member.role}
                      </td>
                      <td className="px-5 py-4 text-foreground/60">
                        {member.phone}
                      </td>
                      <td className="px-5 py-4 text-foreground/60">
                        {formatDate(member.joinedAt)}
                      </td>
                      <td className="px-5 py-4">
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedMemberId((current) =>
                              current === member.id ? null : member.id,
                            )
                          }
                          aria-expanded={expandedMemberId === member.id}
                          aria-label={`${expandedMemberId === member.id ? "Ocultar" : "Ver"} tarefas de ${member.name}`}
                          className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-semibold text-foreground/65 transition hover:bg-foreground/5 hover:text-foreground"
                        >
                          <ListTodo size={14} />
                          {member.tasks.length}
                          {expandedMemberId === member.id ? (
                            <ChevronUp size={14} />
                          ) : (
                            <ChevronDown size={14} />
                          )}
                        </button>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <button
                            aria-label={`Editar ${member.name}`}
                            onClick={() => openEditForm(member)}
                            className="text-foreground/45 transition hover:text-foreground"
                          >
                            <Pencil size={17} />
                          </button>
                          <button
                            aria-label={`Remover ${member.name}`}
                            onClick={() => void removeMember(member)}
                            className="text-foreground/45 transition hover:text-red-600 dark:hover:text-red-300"
                          >
                            <Trash2 size={17} />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedMemberId === member.id && (
                      <tr className="border-t border-border bg-foreground/[0.02]">
                        <td colSpan={7} className="px-5 py-5 sm:px-6">
                          <div className="mx-auto max-w-3xl">
                            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                              <h3 className="font-heading text-base font-bold">
                                Tarefas de {member.name}
                              </h3>
                              <button
                                type="button"
                                disabled={member.tasks.length === 0}
                                onClick={() => exportTaskReport(member)}
                                className="text-left text-xs font-semibold text-blue-600 hover:text-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:text-blue-300"
                              >
                                Baixar relatório para Excel (CSV)
                              </button>
                            </div>
                            {member.tasks.length === 0 ? (
                              <p className="mt-2 text-sm text-foreground/50">
                                Nenhuma tarefa cadastrada.
                              </p>
                            ) : (
                              <ul className="mt-3 space-y-2">
                                {member.tasks.map((task) => (
                                  <li
                                    key={task.id}
                                    className="flex flex-col gap-2 rounded-md border border-border bg-background px-3 py-3 sm:flex-row sm:items-center sm:gap-3"
                                  >
                                    <span
                                      className={`min-w-0 flex-1 text-sm ${task.completed ? "text-foreground/45 line-through" : "text-foreground/80"}`}
                                    >
                                      <span className="block">{task.text}</span>
                                      <span className="mt-1 block text-xs text-foreground/50">
                                        Prazo:{" "}
                                        {task.dueDate
                                          ? formatDate(task.dueDate.slice(0, 10))
                                          : "Não informado"}
                                        {task.submittedAt
                                          ? ` · Entregue em ${formatDateTime(task.submittedAt)}`
                                          : ""}
                                      </span>
                                      {task.report && (
                                        <span className="mt-2 block whitespace-pre-wrap rounded bg-foreground/[0.04] p-2 text-xs text-foreground/70">
                                          <strong>Relatório: </strong>
                                          {task.report}
                                        </span>
                                      )}
                                    </span>
                                    <span className={`text-xs font-semibold ${task.completed ? "text-emerald-600 dark:text-emerald-300" : "text-amber-600 dark:text-amber-300"}`}>
                                      {task.completed ? "Comprovada" : "Pendente"}
                                    </span>
                                    {task.attachment && (
                                      <button
                                        type="button"
                                        disabled={savingTaskFor === member.id}
                                        onClick={() =>
                                          void downloadTaskFile(member, task)
                                        }
                                        className="text-xs font-semibold text-blue-600 hover:text-blue-500 dark:text-blue-300"
                                      >
                                        Ver arquivo
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      aria-label={`Excluir tarefa: ${task.text}`}
                                      disabled={savingTaskFor === member.id}
                                      onClick={() =>
                                        void removeTask(member, task)
                                      }
                                      className="rounded p-1.5 text-foreground/40 transition hover:bg-red-400/10 hover:text-red-600 disabled:opacity-50 dark:hover:text-red-300"
                                    >
                                      <Trash2 size={15} />
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            )}
                            {!member.userEmail && (
                              <p className="mt-3 text-xs text-amber-700 dark:text-amber-300">
                                Vincule uma conta de funcionário antes de atribuir tarefas.
                              </p>
                            )}
                            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                              <input
                                aria-label={`Nova tarefa para ${member.name}`}
                                maxLength={200}
                                disabled={!member.userEmail}
                                value={taskDrafts[member.id] ?? ""}
                                onChange={(event) =>
                                  setTaskDrafts((current) => ({
                                    ...current,
                                    [member.id]: event.target.value,
                                  }))
                                }
                                onKeyDown={(event) => {
                                  if (event.key === "Enter") {
                                    event.preventDefault()
                                    void addTask(member)
                                  }
                                }}
                                placeholder="Descreva uma tarefa"
                                className="h-10 min-w-0 flex-1 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none placeholder:text-foreground/35 focus:border-blue-400/60"
                              />
                              <input
                                type="date"
                                aria-label={`Prazo da tarefa para ${member.name}`}
                                required
                                disabled={!member.userEmail}
                                min={today()}
                                value={taskDueDates[member.id] ?? today()}
                                onChange={(event) =>
                                  setTaskDueDates((current) => ({
                                    ...current,
                                    [member.id]: event.target.value,
                                  }))
                                }
                                className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-blue-400/60 disabled:opacity-50"
                              />
                              <button
                                type="button"
                                disabled={
                                  !member.userEmail ||
                                  savingTaskFor === member.id ||
                                  !taskDrafts[member.id]?.trim()
                                }
                                onClick={() => void addTask(member)}
                                className="inline-flex h-10 items-center gap-1.5 rounded-md bg-blue-600 px-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <Plus size={15} />
                                {savingTaskFor === member.id
                                  ? "Salvando..."
                                  : "Adicionar tarefa"}
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}

export default Equipe
