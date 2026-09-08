import { useEffect, useState } from "react"
import {
  ArrowLeft,
  CalendarDays,
  Building2,
  Check,
  ClipboardCheck,
  Clock3,
  FileUp,
  Flag,
  Search,
  Send,
  UserRound,
} from "lucide-react"

type Mode = "choose" | "create" | "join" | "tasks"
type Task = { id: number; title: string; detail: string; done: boolean }
type EmployeeTab = "tasks" | "report" | "time" | "calendar" | "files"
type EmployeeSchedule = {
  start: string
  end: string
  lunch: string
  total: string
}
type CalendarRecord = { type: "folga" | "falta"; justification: string }
type CompanyData = {
  razao_social: string
  nome_fantasia?: string
  situacao_cadastral?: string
  cnpj: string
  responsibleCpf?: string
}

const inputClass =
  "mt-2 h-11 w-full rounded-lg border border-white/10 bg-white/[0.05] px-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-blue-400/60"
const initialTasks: Task[] = [
  {
    id: 1,
    title: "Conferir pedidos do dia",
    detail: "Verifique os pedidos recebidos antes das 10h.",
    done: false,
  },
  {
    id: 2,
    title: "Atualizar estoque",
    detail: "Registre entradas e saídas dos produtos vendidos.",
    done: false,
  },
  {
    id: 3,
    title: "Responder clientes",
    detail: "Finalize os atendimentos pendentes no CRM.",
    done: true,
  },
  {
    id: 4,
    title: "Enviar fechamento",
    detail: "Compartilhe o resumo das atividades com a equipe.",
    done: false,
  },
]

const employeeSchedule: EmployeeSchedule = {
  start: "08:00",
  end: "18:00",
  lunch: "01:00",
  total: "9h00",
}

function isValidCpf(value: string) {
  const digits = value.replace(/\D/g, "")
  if (digits.length !== 11 || /^([0-9])\1+$/.test(digits)) return false
  let total = 0
  for (let index = 0; index < 9; index += 1)
    total += Number(digits[index]) * (10 - index)
  let digit = (total * 10) % 11
  if (digit === 10) digit = 0
  if (digit !== Number(digits[9])) return false
  total = 0
  for (let index = 0; index < 10; index += 1)
    total += Number(digits[index]) * (11 - index)
  digit = (total * 10) % 11
  if (digit === 10) digit = 0
  return digit === Number(digits[10])
}

export function Empresa() {
  const [mode, setMode] = useState<Mode>("choose")
  const [cnpj, setCnpj] = useState("")
  const [cpf, setCpf] = useState("")
  const [company, setCompany] = useState("")
  const [foundCompany, setFoundCompany] = useState<CompanyData | null>(null)
  const [notice, setNotice] = useState("")
  const [loadingCompany, setLoadingCompany] = useState(false)
  const [tasks, setTasks] = useState(initialTasks)
  const [employeeTab, setEmployeeTab] = useState<EmployeeTab>("tasks")
  const [clockedIn, setClockedIn] = useState(false)
  const [clockInAt, setClockInAt] = useState<number | null>(null)
  const [clockOutAt, setClockOutAt] = useState<number | null>(null)
  const [lunchStarted, setLunchStarted] = useState(false)
  const [lunchStartedAt, setLunchStartedAt] = useState<number | null>(null)
  const [lunchElapsed, setLunchElapsed] = useState(0)
  const [now, setNow] = useState(() => Date.now())
  const [problem, setProblem] = useState("")
  const [report, setReport] = useState("")
  const [sentFiles, setSentFiles] = useState<string[]>([])
  const [calendarRecords, setCalendarRecords] = useState<
    Record<number, CalendarRecord>
  >({})
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [dayJustification, setDayJustification] = useState("")
  const completed = tasks.filter((task) => task.done).length
  const clockElapsed =
    clockInAt && clockedIn ? Math.floor((now - clockInAt) / 1000) : 0
  const activeLunchElapsed =
    lunchStartedAt && lunchStarted
      ? Math.floor((now - lunchStartedAt) / 1000)
      : lunchElapsed
  const minimumLunchSeconds = 30 * 60

  useEffect(() => {
    if (!clockedIn && !lunchStarted) return
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [clockedIn, lunchStarted])

  const formatDuration = (seconds: number) =>
    `${String(Math.floor(seconds / 3600)).padStart(2, "0")}:${String(Math.floor((seconds % 3600) / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`
  const formatTime = (timestamp: number | null) =>
    timestamp
      ? new Date(timestamp).toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "--:--"

  const findCompany = async () => {
    const digits = cnpj.replace(/\D/g, "")
    if (digits.length !== 14)
      return setNotice("Digite um CNPJ válido com 14 números.")
    setLoadingCompany(true)
    setFoundCompany(null)
    setNotice("")
    try {
      const response = await fetch(
        `https://brasilapi.com.br/api/cnpj/v1/${digits}`
      )
      if (!response.ok) throw new Error("CNPJ não encontrado")
      const data = (await response.json()) as CompanyData
      if (data.situacao_cadastral && data.situacao_cadastral !== "ATIVA") {
        setNotice(
          `Empresa inválida: situação cadastral ${data.situacao_cadastral.toLowerCase()}.`
        )
        return
      }
      setFoundCompany(data)
      setNotice("Empresa encontrada. Confirme o CPF do responsável.")
    } catch {
      setNotice(
        "Não foi possível localizar esse CNPJ. Confira os números e tente novamente."
      )
    } finally {
      setLoadingCompany(false)
    }
  }
  const createCompany = () => {
    if (!foundCompany || !isValidCpf(cpf))
      return setNotice("Empresa inválida: o CPF informado não é válido.")
    if (
      foundCompany.responsibleCpf &&
      foundCompany.responsibleCpf !== cpf.replace(/\D/g, "")
    )
      return setNotice(
        "Empresa inválida: o CPF não corresponde ao responsável cadastrado."
      )
    setNotice("Empresa criada e responsável confirmado.")
    setMode("tasks")
  }
  const requestJoin = () => {
    if (company.trim().length < 2)
      return setNotice("Informe o código ou nome da empresa.")
    setNotice(`Solicitação enviada para ${company}.`)
    setMode("tasks")
  }
  const toggleTask = (id: number) =>
    setTasks((current) =>
      current.map((task) =>
        task.id === id ? { ...task, done: !task.done } : task
      )
    )
  const selectedDateIsWeekday =
    selectedDay !== null &&
    new Date(2026, 8, selectedDay).getDay() > 0 &&
    new Date(2026, 8, selectedDay).getDay() < 6
  const registerCalendarRecord = (type: CalendarRecord["type"]) => {
    if (!selectedDay || !selectedDateIsWeekday) return
    if (type === "folga" && !dayJustification.trim()) {
      setNotice("Informe a justificativa para solicitar a folga.")
      return
    }
    setCalendarRecords((current) => ({
      ...current,
      [selectedDay]: { type, justification: dayJustification.trim() },
    }))
    setNotice(
      type === "folga"
        ? `Solicitação de folga para o dia ${selectedDay} enviada.`
        : `Falta do dia ${selectedDay} registrada como não justificada.`
    )
    setDayJustification("")
  }
  const toggleClock = () => {
    if (clockedIn) {
      setClockedIn(false)
      setClockOutAt(Date.now())
      setNotice("Saída registrada com sucesso.")
      return
    }
    setClockInAt(Date.now())
    setClockOutAt(null)
    setClockedIn(true)
    setNotice("Entrada registrada. O cronômetro está contando em tempo real.")
  }

  const toggleLunch = () => {
    if (lunchStarted) {
      if (activeLunchElapsed < minimumLunchSeconds) {
        setNotice("O almoço só pode ser encerrado após 30 minutos.")
        return
      }
      setLunchElapsed(activeLunchElapsed)
      setLunchStarted(false)
      setLunchStartedAt(null)
      setNotice("Retorno do almoço registrado.")
      return
    }
    setLunchStartedAt(Date.now())
    setLunchElapsed(0)
    setLunchStarted(true)
    setNotice("Almoço iniciado. O retorno será liberado após 30 minutos.")
  }
  const tabItems: {
    id: EmployeeTab
    label: string
    icon: typeof ClipboardCheck
  }[] = [
    { id: "tasks", label: "Tarefas", icon: ClipboardCheck },
    { id: "time", label: "Ponto e descanso", icon: Clock3 },
    { id: "calendar", label: "Calendário", icon: CalendarDays },
    { id: "report", label: "Relatórios e problemas", icon: Flag },
    { id: "files", label: "Arquivos", icon: FileUp },
  ]

  return (
    <main className="min-h-screen overflow-hidden bg-[#070B14] px-4 pb-16 text-white sm:px-8">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_85%_8%,rgba(37,99,235,0.16),transparent_28%),radial-gradient(circle_at_10%_90%,rgba(14,165,233,0.08),transparent_30%)]" />
      <div className="relative z-10 mx-auto max-w-6xl">
        <header className="flex items-center justify-between border-b border-white/10 py-6">
          <a
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-white/55 hover:text-white"
          >
            <ArrowLeft size={16} /> Voltar ao painel
          </a>
          <span className="font-heading text-lg font-bold">
            EasySell<span className="text-blue-400">.</span>
          </span>
        </header>
        {mode !== "tasks" ? (
          <div className="mx-auto grid max-w-5xl gap-10 py-14 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <section>
              <p className="text-xs font-semibold tracking-[0.24em] text-blue-300 uppercase">
                Sua organização
              </p>
              <h1 className="mt-4 font-heading text-4xl font-bold sm:text-6xl">
                Escolha como começar.
              </h1>
              <p className="mt-5 max-w-md text-sm leading-6 text-white/50">
                Crie uma empresa para administrar sua operação ou entre em uma
                equipe já existente.
              </p>
            </section>
            <section className="rounded-xl border border-white/10 bg-[#0B1120]/85 p-5 shadow-2xl shadow-black/20 sm:p-8">
              {mode === "choose" && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    onClick={() => setMode("create")}
                    className="rounded-lg border border-blue-400/25 bg-blue-500/10 p-5 text-left hover:bg-blue-500/15"
                  >
                    <Building2 className="text-blue-300" size={24} />
                    <h2 className="mt-6 font-heading text-xl font-bold">
                      Criar empresa
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-white/50">
                      Cadastre o CNPJ e confirme seus dados para começar.
                    </p>
                  </button>
                  <button
                    onClick={() => setMode("join")}
                    className="rounded-lg border border-white/15 bg-white/[0.03] p-5 text-left hover:bg-white/[0.07]"
                  >
                    <UserRound className="text-[#5DCAA5]" size={24} />
                    <h2 className="mt-6 font-heading text-xl font-bold">
                      Entrar na empresa
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-white/50">
                      Use o código ou nome da empresa para enviar uma
                      solicitação.
                    </p>
                  </button>
                </div>
              )}
              {mode === "create" && (
                <div>
                  <button
                    onClick={() => setMode("choose")}
                    className="mb-6 text-sm text-white/45 hover:text-white"
                  >
                    ← Voltar
                  </button>
                  <p className="text-xs font-semibold tracking-[0.18em] text-blue-300 uppercase">
                    Criar empresa
                  </p>
                  <h2 className="mt-3 font-heading text-3xl font-bold">
                    Consulte seu CNPJ.
                  </h2>
                  <label className="mt-7 block text-sm">
                    CNPJ
                    <input
                      className={inputClass}
                      value={cnpj}
                      onChange={(event) => setCnpj(event.target.value)}
                      placeholder="00.000.000/0000-00"
                    />
                  </label>
                  <button
                    onClick={findCompany}
                    disabled={loadingCompany}
                    className="mt-4 inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold hover:bg-blue-500"
                  >
                    <Search size={16} />{" "}
                    {loadingCompany ? "Consultando..." : "Buscar empresa"}
                  </button>
                  {foundCompany && (
                    <div className="mt-6 rounded-lg border border-[#5DCAA5]/25 bg-[#5DCAA5]/10 p-4">
                      <p className="text-xs text-[#5DCAA5]">
                        Empresa encontrada
                      </p>
                      <p className="mt-1 font-semibold">
                        {foundCompany.razao_social}
                      </p>
                      {foundCompany.nome_fantasia && (
                        <p className="mt-1 text-sm text-white/55">
                          {foundCompany.nome_fantasia}
                        </p>
                      )}
                      <p className="mt-2 text-xs text-[#5DCAA5]">
                        Situação: {foundCompany.situacao_cadastral || "ATIVA"}
                      </p>
                      <label className="mt-4 block text-sm">
                        CPF do responsável
                        <input
                          className={inputClass}
                          value={cpf}
                          onChange={(event) => setCpf(event.target.value)}
                          placeholder="000.000.000-00"
                        />
                      </label>
                      <button
                        onClick={createCompany}
                        className="mt-4 inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold hover:bg-blue-500"
                      >
                        <Check size={16} /> Confirmar e criar
                      </button>
                    </div>
                  )}
                </div>
              )}
              {mode === "join" && (
                <div>
                  <button
                    onClick={() => setMode("choose")}
                    className="mb-6 text-sm text-white/45 hover:text-white"
                  >
                    ← Voltar
                  </button>
                  <p className="text-xs font-semibold tracking-[0.18em] text-blue-300 uppercase">
                    Entrar na empresa
                  </p>
                  <h2 className="mt-3 font-heading text-3xl font-bold">
                    Encontre sua equipe.
                  </h2>
                  <label className="mt-7 block text-sm">
                    Código ou nome da empresa
                    <input
                      className={inputClass}
                      value={company}
                      onChange={(event) => setCompany(event.target.value)}
                      placeholder="EASY-4821 ou Loja da Maria"
                    />
                  </label>
                  <button
                    onClick={requestJoin}
                    className="mt-6 inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold hover:bg-blue-500"
                  >
                    <UserRound size={16} /> Enviar solicitação
                  </button>
                </div>
              )}
              {notice && <p className="mt-5 text-sm text-blue-200">{notice}</p>}
            </section>
          </div>
        ) : (
          <div className="mx-auto max-w-5xl py-12">
            <section className="flex flex-col justify-between gap-6 border-b border-white/10 pb-8 sm:flex-row sm:items-end">
              <div>
                <p className="text-xs font-semibold tracking-[0.24em] text-blue-300 uppercase">
                  Área do funcionário
                </p>
                <h1 className="mt-4 font-heading text-4xl font-bold sm:text-5xl">
                  Tarefas de hoje.
                </h1>
                <p className="mt-4 text-sm text-white/50">
                  Organize seu dia e acompanhe o que precisa ser concluído.
                </p>
              </div>
              <div className="rounded-lg border border-[#5DCAA5]/25 bg-[#5DCAA5]/10 px-4 py-3 text-sm text-[#5DCAA5]">
                <strong>
                  {completed}/{tasks.length}
                </strong>{" "}
                concluídas
              </div>
            </section>
            <nav
              className="mt-8 flex gap-2 overflow-x-auto border-b border-white/10 pb-px"
              aria-label="Ferramentas do funcionário"
            >
              {tabItems.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setEmployeeTab(id)}
                  className={`inline-flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-sm font-semibold ${employeeTab === id ? "border-blue-400 text-white" : "border-transparent text-white/45 hover:text-white"}`}
                >
                  <Icon size={15} /> {label}
                </button>
              ))}
            </nav>
            <section className="mt-6 rounded-xl border border-blue-400/20 bg-blue-500/10 p-5 sm:p-6">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <p className="text-xs font-semibold tracking-[0.16em] text-blue-200 uppercase">
                    Minha jornada
                  </p>
                  <h2 className="mt-2 font-heading text-2xl font-bold">
                    Horário definido pela empresa
                  </h2>
                  <p className="mt-2 text-sm text-white/50">
                    Este é o horário usado como referência para seu ponto.
                  </p>
                </div>
                <Clock3 className="hidden text-blue-300 sm:block" size={26} />
              </div>
              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
                  <p className="text-xs text-white/45">Entrada</p>
                  <strong className="mt-1 block text-lg">
                    {employeeSchedule.start}
                  </strong>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
                  <p className="text-xs text-white/45">Saída</p>
                  <strong className="mt-1 block text-lg">
                    {employeeSchedule.end}
                  </strong>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
                  <p className="text-xs text-white/45">Almoço</p>
                  <strong className="mt-1 block text-lg">
                    {employeeSchedule.lunch}
                  </strong>
                </div>
                <div className="rounded-lg border border-[#5DCAA5]/20 bg-[#5DCAA5]/10 p-3">
                  <p className="text-xs text-white/45">Carga líquida</p>
                  <strong className="mt-1 block text-lg text-[#5DCAA5]">
                    {employeeSchedule.total}
                  </strong>
                </div>
              </div>
            </section>
            <section className="mt-8 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-xl border border-white/10 bg-[#0B1120]/85 p-5 sm:p-6">
                <div className="flex items-center gap-3">
                  <ClipboardCheck className="text-blue-300" size={22} />
                  <h2 className="font-heading text-2xl font-bold">
                    Lista diária
                  </h2>
                </div>
                <div className="mt-6 space-y-3">
                  {tasks.map((task) => (
                    <button
                      key={task.id}
                      onClick={() => toggleTask(task.id)}
                      className="flex w-full items-start gap-3 rounded-lg border border-white/10 bg-white/[0.02] p-4 text-left hover:border-blue-400/40"
                    >
                      <span
                        className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded border ${task.done ? "border-[#5DCAA5] bg-[#5DCAA5] text-[#070B14]" : "border-white/25 text-transparent"}`}
                      >
                        <Check size={13} />
                      </span>
                      <span>
                        <strong
                          className={
                            task.done
                              ? "text-white/45 line-through"
                              : "text-white"
                          }
                        >
                          {task.title}
                        </strong>
                        <span className="mt-1 block text-xs leading-5 text-white/40">
                          {task.detail}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              <aside className="rounded-xl border border-blue-400/20 bg-blue-500/10 p-5 sm:p-6">
                <p className="text-xs font-semibold tracking-[0.16em] text-blue-200 uppercase">
                  Seu espaço
                </p>
                <h2 className="mt-3 font-heading text-2xl font-bold">
                  Trabalhe com clareza.
                </h2>
                <p className="mt-4 text-sm leading-6 text-white/55">
                  As tarefas são atualizadas pela sua equipe todos os dias.
                </p>
                <div className="mt-8 h-2 rounded-full bg-white/10">
                  <div
                    className="h-2 rounded-full bg-[#5DCAA5]"
                    style={{ width: `${(completed / tasks.length) * 100}%` }}
                  />
                </div>
                <p className="mt-3 text-xs text-white/45">
                  {Math.round((completed / tasks.length) * 100)}% do dia
                  concluído
                </p>
              </aside>
            </section>
            {employeeTab === "time" && (
              <section className="mt-4 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-white/10 bg-[#0B1120]/85 p-5 sm:p-6">
                    <p className="text-xs font-semibold tracking-[0.16em] text-blue-300 uppercase">
                      Registro de ponto
                    </p>
                    <h2 className="mt-2 font-heading text-2xl font-bold">
                      Jornada de hoje
                    </h2>
                    <p className="mt-3 text-sm text-white/50">
                      {clockedIn
                        ? `Entrada às ${formatTime(clockInAt)} · tempo trabalhado ${formatDuration(clockElapsed)}`
                        : clockOutAt
                          ? `Saída registrada às ${formatTime(clockOutAt)}.`
                          : "Registre sua entrada para começar o dia."}
                    </p>
                    <button
                      onClick={toggleClock}
                      className="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold hover:bg-blue-500"
                    >
                      <Clock3 size={16} />{" "}
                      {clockedIn
                        ? "Registrar saída"
                        : clockOutAt
                          ? "Bater ponto novamente"
                          : "Bater ponto"}
                    </button>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-[#0B1120]/85 p-5 sm:p-6">
                    <p className="text-xs font-semibold tracking-[0.16em] text-[#5DCAA5] uppercase">
                      Descanso e almoço
                    </p>
                    <h2 className="mt-2 font-heading text-2xl font-bold">
                      Pausa do dia
                    </h2>
                    <p className="mt-3 text-sm text-white/50">
                      {lunchStarted
                        ? `Almoço iniciado às ${formatTime(lunchStartedAt)} · ${formatDuration(activeLunchElapsed)}`
                        : lunchElapsed > 0
                          ? `Último almoço: ${formatDuration(lunchElapsed)}.`
                          : "Controle o início do seu horário de almoço."}
                    </p>
                    <button
                      onClick={toggleLunch}
                      disabled={
                        lunchStarted && activeLunchElapsed < minimumLunchSeconds
                      }
                      className="mt-6 inline-flex items-center gap-2 rounded-lg border border-[#5DCAA5]/30 bg-[#5DCAA5]/10 px-4 py-2 text-sm font-semibold text-[#5DCAA5] hover:bg-[#5DCAA5]/20 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Clock3 size={16} />{" "}
                      {lunchStarted
                        ? activeLunchElapsed < minimumLunchSeconds
                          ? "Aguarde 30 minutos"
                          : "Voltar do almoço"
                        : "Iniciar almoço"}
                    </button>
                    {lunchStarted && (
                      <p className="mt-3 text-xs text-white/40">
                        Mínimo restante:{" "}
                        {formatDuration(
                          Math.max(0, minimumLunchSeconds - activeLunchElapsed)
                        )}
                      </p>
                    )}
                  </div>
                </div>
              </section>
            )}
            {employeeTab === "calendar" && (
              <section className="mt-4 rounded-xl border border-white/10 bg-[#0B1120]/85 p-5 sm:p-6">
                <p className="text-xs font-semibold tracking-[0.16em] text-blue-300 uppercase">
                  Presença
                </p>
                <h2 className="mt-2 font-heading text-2xl font-bold">
                  Setembro 2026
                </h2>
                <div className="mt-6 grid grid-cols-7 gap-2 text-center text-xs">
                  <div className="col-span-7 grid grid-cols-7 text-white/35">
                    {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map(
                      (day) => (
                        <span key={day}>{day}</span>
                      )
                    )}
                  </div>
                  {Array.from({ length: 30 }, (_, index) => (
                    <button
                      key={index}
                      type="button"
                      disabled={
                        new Date(2026, 8, index + 1).getDay() === 0 ||
                        new Date(2026, 8, index + 1).getDay() === 6
                      }
                      onClick={() => setSelectedDay(index + 1)}
                      className={`rounded-md py-2 transition ${calendarRecords[index + 1]?.type === "folga" ? "bg-blue-400/25 text-blue-200" : calendarRecords[index + 1]?.type === "falta" ? "bg-red-400/20 text-red-300" : new Date(2026, 8, index + 1).getDay() === 0 || new Date(2026, 8, index + 1).getDay() === 6 ? "cursor-not-allowed text-white/20" : "bg-[#5DCAA5]/15 text-[#5DCAA5] hover:bg-[#5DCAA5]/25"}`}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>
                {selectedDay && selectedDateIsWeekday && (
                  <div className="mt-6 rounded-lg border border-blue-400/20 bg-blue-500/5 p-4">
                    <p className="text-sm font-semibold text-white">
                      Dia {selectedDay} de setembro
                    </p>
                    <p className="mt-1 text-xs text-white/45">
                      Escolha o registro e, para folga, informe o motivo.
                    </p>
                    <textarea
                      value={dayJustification}
                      onChange={(event) =>
                        setDayJustification(event.target.value)
                      }
                      placeholder="Justificativa da folga (opcional para falta)"
                      className="mt-3 min-h-20 w-full rounded-md border border-white/10 bg-[#070B14] p-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-blue-400/60"
                    />
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => registerCalendarRecord("folga")}
                        className="rounded-md bg-blue-600 px-3 py-2 text-xs font-semibold hover:bg-blue-500"
                      >
                        Solicitar folga
                      </button>
                      <button
                        type="button"
                        onClick={() => registerCalendarRecord("falta")}
                        className="rounded-md border border-red-400/30 px-3 py-2 text-xs font-semibold text-red-200 hover:bg-red-400/10"
                      >
                        Registrar falta não justificada
                      </button>
                    </div>
                  </div>
                )}
                <p className="mt-5 text-xs text-white/45">
                  Clique em um dia útil para solicitar folga ou registrar uma
                  falta.
                </p>
              </section>
            )}
            {employeeTab === "report" && (
              <section className="mt-4 grid gap-4 sm:grid-cols-2">
                <form
                  onSubmit={(event) => {
                    event.preventDefault()
                    setNotice("Relatório enviado para a gestão.")
                    setReport("")
                  }}
                  className="rounded-xl border border-white/10 bg-[#0B1120]/85 p-5 sm:p-6"
                >
                  <p className="text-xs font-semibold tracking-[0.16em] text-blue-300 uppercase">
                    Relatório
                  </p>
                  <h2 className="mt-2 font-heading text-2xl font-bold">
                    Relatar atividade
                  </h2>
                  <textarea
                    required
                    value={report}
                    onChange={(event) => setReport(event.target.value)}
                    placeholder="Descreva o que você realizou hoje..."
                    className="mt-5 min-h-32 w-full rounded-lg border border-white/10 bg-white/[0.04] p-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-blue-400/60"
                  />
                  <button className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold hover:bg-blue-500">
                    <Send size={15} /> Enviar relatório
                  </button>
                </form>
                <form
                  onSubmit={(event) => {
                    event.preventDefault()
                    setNotice("Problema enviado para a gestão.")
                    setProblem("")
                  }}
                  className="rounded-xl border border-red-400/15 bg-[#0B1120]/85 p-5 sm:p-6"
                >
                  <p className="text-xs font-semibold tracking-[0.16em] text-red-300 uppercase">
                    Suporte interno
                  </p>
                  <h2 className="mt-2 font-heading text-2xl font-bold">
                    Reportar problema
                  </h2>
                  <textarea
                    required
                    value={problem}
                    onChange={(event) => setProblem(event.target.value)}
                    placeholder="O que aconteceu na empresa?"
                    className="mt-5 min-h-32 w-full rounded-lg border border-white/10 bg-white/[0.04] p-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-red-400/60"
                  />
                  <button className="mt-4 inline-flex items-center gap-2 rounded-lg border border-red-400/30 px-4 py-2 text-sm font-semibold text-red-200 hover:bg-red-400/10">
                    <Flag size={15} /> Enviar problema
                  </button>
                </form>
              </section>
            )}
            {employeeTab === "files" && (
              <section className="mt-4 rounded-xl border border-white/10 bg-[#0B1120]/85 p-5 sm:p-6">
                <p className="text-xs font-semibold tracking-[0.16em] text-blue-300 uppercase">
                  Arquivos das tarefas
                </p>
                <h2 className="mt-2 font-heading text-2xl font-bold">
                  Envie comprovantes e entregas.
                </h2>
                <label className="mt-6 flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-white/20 bg-white/[0.03] text-center text-sm text-white/50 hover:border-blue-400/50">
                  <FileUp className="mb-2 text-blue-300" size={24} /> Selecionar
                  arquivo
                  <input
                    type="file"
                    className="hidden"
                    onChange={(event) => {
                      const name = event.target.files?.[0]?.name
                      if (name) setSentFiles((current) => [...current, name])
                    }}
                  />
                </label>
                {sentFiles.length > 0 && (
                  <div className="mt-4 space-y-2 text-sm text-[#5DCAA5]">
                    {sentFiles.map((file) => (
                      <p key={file}>✓ {file}</p>
                    ))}
                  </div>
                )}
              </section>
            )}
            {notice && (
              <p className="mt-4 rounded-lg border border-blue-400/15 bg-blue-400/5 px-4 py-3 text-sm text-blue-200">
                {notice}
              </p>
            )}
          </div>
        )}
      </div>
    </main>
  )
}

export default Empresa
