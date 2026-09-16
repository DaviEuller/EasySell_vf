import { useEffect, useRef, useState } from "react"
import {
  CalendarDays,
  Building2,
  Check,
  ChevronDown,
  ClipboardCheck,
  Clock,
  Clock3,
  FileUp,
  Flag,
  LayoutDashboard,
  Paperclip,
  PartyPopper,
  Search,
  Send,
  ShieldCheck,
  UserRound,
} from "lucide-react"

type Mode = "choose" | "create" | "join" | "created" | "tasks"
type TaskStatus = "pendente" | "concluido" | "verificado"
type Task = {
  id: number
  title: string
  deadline: string
  steps: string[]
  status: TaskStatus
  verifiedBy?: string
  attachment: string | null
}
type EmployeeTab = "tasks" | "report" | "time" | "calendar"
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

// Animação padrão aplicada a todos os botões da tela
const btnAnim =
  "transition-all duration-200 ease-out will-change-transform hover:-translate-y-0.5 active:translate-y-0 active:scale-95 disabled:hover:translate-y-0 disabled:active:scale-100"

const initialTasks: Task[] = [
  {
    id: 1,
    title: "Conferir pedidos do dia",
    deadline: "Até 10:00",
    steps: [
      "Acesse o painel de pedidos na CRM.",
      "Verifique o horário de recebimento dos pedidos.",
      "Confira os pedidos recebidos até as 10:00.",
      "Envie o arquivo de resumo.",
    ],
    status: "verificado",
    verifiedBy: "João",
    attachment: "resumo-pedidos.pdf",
  },
  {
    id: 2,
    title: "Atualizar estoque",
    deadline: "Até 12:00",
    steps: [
      "Registre as entradas do dia.",
      "Registre as saídas dos produtos vendidos.",
      "Confira as divergências com o sistema.",
    ],
    status: "pendente",
    attachment: null,
  },
  {
    id: 3,
    title: "Responder clientes",
    deadline: "Até 16:00",
    steps: [
      "Abra os atendimentos pendentes no CRM.",
      "Responda todas as mensagens em aberto.",
      "Marque os atendimentos concluídos.",
    ],
    status: "concluido",
    attachment: "prints-crm.png",
  },
  {
    id: 4,
    title: "Enviar fechamento",
    deadline: "Até 18:00",
    steps: [
      "Reúna o resumo das atividades do dia.",
      "Compartilhe o fechamento com a equipe.",
    ],
    status: "pendente",
    attachment: null,
  },
]

const employeeSchedule: EmployeeSchedule = {
  start: "08:00",
  end: "18:00",
  lunch: "01:00",
  total: "9h00",
}

// Junta classes condicionais (mesmo helper usado no dashboard)
function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ")
}

// Hook para detectar quando o elemento entra no viewport (mesmo do dashboard)
function useInView<T extends HTMLElement>(threshold = 0.15) {
  const ref = useRef<T | null>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          observer.disconnect()
        }
      },
      { threshold }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold])

  return [ref, inView] as const
}

// Componente de animação (mesmo do dashboard), agora polimórfico
// para poder renderizar como <form>, <section>, etc. quando necessário.
function FadeIn({
  delay = 0,
  className,
  children,
  as: Tag = "div",
  ...rest
}: {
  delay?: number
  className?: string
  children: React.ReactNode
  as?: React.ElementType
  [key: string]: unknown
}) {
  const [ref, inView] = useInView<HTMLElement>()

  return (
    <Tag
      ref={ref}
      style={{ transitionDelay: inView ? `${delay}ms` : "0ms" }}
      className={cx(
        "transition-all duration-700 ease-out",
        inView ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0",
        className
      )}
      {...rest}
    >
      {children}
    </Tag>
  )
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

const statusStyles: Record<
  TaskStatus,
  { label: string; className: string }
> = {
  pendente: {
    label: "Pendente",
    className: "border border-white/15 bg-white/[0.06] text-white/55",
  },
  concluido: {
    label: "Concluído",
    className:
      "border border-[#5DCAA5]/30 bg-[#5DCAA5]/15 text-[#5DCAA5]",
  },
  verificado: {
    label: "Verificado",
    className: "border border-blue-400/30 bg-blue-400/15 text-blue-200",
  },
}

export function Empresa() {
  const [mode, setMode] = useState<Mode>("choose")
  const [cnpj, setCnpj] = useState("")
  const [cpf, setCpf] = useState("")
  const [company, setCompany] = useState("")
  const [foundCompany, setFoundCompany] = useState<CompanyData | null>(null)
  const [createdCompany, setCreatedCompany] = useState<CompanyData | null>(
    null
  )
  const [createdCpf, setCreatedCpf] = useState("")
  const [notice, setNotice] = useState("")
  const [loadingCompany, setLoadingCompany] = useState(false)
  const [tasks, setTasks] = useState(initialTasks)
  const [expandedTaskId, setExpandedTaskId] = useState<number | null>(
    initialTasks[0]?.id ?? null
  )
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
  const [calendarRecords, setCalendarRecords] = useState<
    Record<number, CalendarRecord>
  >({})
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [dayJustification, setDayJustification] = useState("")
  const completed = tasks.filter(
    (task) => task.status === "concluido" || task.status === "verificado"
  ).length
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
      const response = await fetch(`https://publica.cnpj.ws/cnpj/${digits}`)
      if (!response.ok) throw new Error("CNPJ não encontrado")
      const data = (await response.json()) as CompanyData
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
    setCreatedCompany(foundCompany)
    setCreatedCpf(cpf)
    setNotice("")
    setMode("created")
  }
  const requestJoin = () => {
    if (company.trim().length < 2)
      return setNotice("Informe o código ou nome da empresa.")
    setNotice(`Solicitação enviada para ${company}.`)
    setMode("tasks")
  }
  const toggleTaskExpanded = (id: number) =>
    setExpandedTaskId((current) => (current === id ? null : id))
  const attachTaskFile = (id: number, file?: File) => {
    if (!file) return
    setTasks((current) =>
      current.map((task) =>
        task.id === id ? { ...task, attachment: file.name } : task
      )
    )
    setNotice("Arquivo anexado à tarefa.")
  }
  const toggleTaskStatus = (id: number) =>
    setTasks((current) =>
      current.map((task) => {
        if (task.id !== id || task.status === "verificado") return task
        if (task.status === "pendente" && !task.attachment) {
          setNotice("Anexe um arquivo antes de concluir a tarefa.")
          return task
        }
        return {
          ...task,
          status: task.status === "pendente" ? "concluido" : "pendente",
        }
      })
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
  ]

  return (
    <main className="min-h-screen overflow-hidden bg-[#070B14] px-4 pt-20 pb-16 text-white sm:px-8">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_85%_8%,rgba(37,99,235,0.16),transparent_28%),radial-gradient(circle_at_10%_90%,rgba(14,165,233,0.08),transparent_30%)]" />
      <div className="relative z-10 mx-auto max-w-6xl">
        {mode !== "tasks" ? (
          <div className="mx-auto grid max-w-5xl gap-10 py-14 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <FadeIn>
              <p className="text-xs font-semibold tracking-[0.24em] text-blue-300 uppercase">
                Sua organização
              </p>
              <h1 className="mt-4 font-heading text-4xl font-bold sm:text-6xl">
                {mode === "created" ? "Tudo pronto." : "Escolha como começar."}
              </h1>
              <p className="mt-5 max-w-md text-sm leading-6 text-white/50">
                {mode === "created"
                  ? "Sua empresa foi cadastrada com sucesso. Confira os dados abaixo antes de seguir para o painel."
                  : "Crie uma empresa para administrar sua operação ou entre em uma equipe já existente."}
              </p>
            </FadeIn>
            <FadeIn
              delay={100}
              className="relative overflow-hidden rounded-xl border border-white/12 bg-white/[0.045] p-5 shadow-2xl shadow-black/20 backdrop-blur-2xl before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-white/25 sm:p-8"
            >
              {mode === "choose" && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    onClick={() => setMode("create")}
                    className={cx(
                      btnAnim,
                      "rounded-lg border border-blue-400/25 bg-blue-500/10 p-5 text-left hover:bg-blue-500/15"
                    )}
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
                    className={cx(
                      btnAnim,
                      "rounded-lg border border-white/15 bg-white/[0.03] p-5 text-left hover:bg-white/[0.07]"
                    )}
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
                    className={cx(btnAnim, "mb-6 text-sm text-white/45 hover:text-white")}
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
                    className={cx(
                      btnAnim,
                      "mt-4 inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-70"
                    )}
                  >
                    <Search size={16} />{" "}
                    {loadingCompany ? "Consultando..." : "Buscar empresa"}
                  </button>
                  {foundCompany && (
                    <FadeIn className="mt-6 rounded-lg border border-[#5DCAA5]/25 bg-[#5DCAA5]/10 p-4">
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
                        className={cx(
                          btnAnim,
                          "mt-4 inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold hover:bg-blue-500"
                        )}
                      >
                        <Check size={16} /> Confirmar e criar
                      </button>
                    </FadeIn>
                  )}
                </div>
              )}
              {mode === "join" && (
                <div>
                  <button
                    onClick={() => setMode("choose")}
                    className={cx(btnAnim, "mb-6 text-sm text-white/45 hover:text-white")}
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
                    className={cx(
                      btnAnim,
                      "mt-6 inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold hover:bg-blue-500"
                    )}
                  >
                    <UserRound size={16} /> Enviar solicitação
                  </button>
                </div>
              )}
              {mode === "created" && createdCompany && (
                <div>
                  <div className="flex size-12 items-center justify-center rounded-full border border-[#5DCAA5]/30 bg-[#5DCAA5]/10 text-[#5DCAA5]">
                    <PartyPopper size={22} />
                  </div>
                  <p className="mt-5 text-xs font-semibold tracking-[0.18em] text-[#5DCAA5] uppercase">
                    Empresa criada
                  </p>
                  <h2 className="mt-3 font-heading text-3xl font-bold">
                    {createdCompany.razao_social}
                  </h2>
                  {createdCompany.nome_fantasia && (
                    <p className="mt-1 text-sm text-white/55">
                      {createdCompany.nome_fantasia}
                    </p>
                  )}
                  <div className="mt-6 space-y-3 rounded-lg border border-white/10 bg-white/[0.03] p-4 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-white/40">CNPJ</span>
                      <span className="font-semibold">
                        {createdCompany.cnpj}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white/40">Situação</span>
                      <span className="font-semibold text-[#5DCAA5]">
                        {createdCompany.situacao_cadastral || "ATIVA"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white/40">CPF do responsável</span>
                      <span className="font-semibold">{createdCpf}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      window.location.href = "/dashboard"
                    }}
                    className={cx(
                      btnAnim,
                      "mt-6 inline-flex h-11 items-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-semibold hover:bg-blue-500"
                    )}
                  >
                    <LayoutDashboard size={16} /> Ir para o painel
                  </button>
                </div>
              )}
              {notice && <p className="mt-5 text-sm text-blue-200">{notice}</p>}
            </FadeIn>
          </div>
        ) : (
          <div className="mx-auto max-w-5xl py-12">
            <FadeIn className="flex flex-col justify-between gap-6 border-b border-white/10 pb-8 sm:flex-row sm:items-end">
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
              <div className="shrink-0 rounded-lg border border-[#5DCAA5]/25 bg-[#5DCAA5]/10 px-4 py-3 text-sm text-[#5DCAA5]">
                <strong>
                  {completed}/{tasks.length}
                </strong>{" "}
                concluídas
              </div>
            </FadeIn>
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

            {employeeTab === "tasks" && (
              <section className="mt-8 space-y-4">
                {/* Minha jornada */}
                <FadeIn className="relative overflow-hidden rounded-xl border border-white/12 bg-white/[0.045] p-5 shadow-2xl shadow-black/20 backdrop-blur-2xl before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-white/25 sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold tracking-[0.16em] text-blue-300 uppercase">
                        Minha jornada
                      </p>
                      <h2 className="mt-2 font-heading text-xl font-bold sm:text-2xl">
                        Horário definido pela empresa
                      </h2>
                      <p className="mt-2 text-sm text-white/45">
                        Este é o horário usado como referência para o seu
                        ponto.
                      </p>
                    </div>
                    <Clock className="hidden shrink-0 text-white/30 sm:block" size={22} />
                  </div>
                  <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {[
                      ["Entrada", employeeSchedule.start, ""],
                      ["Saída", employeeSchedule.end, ""],
                      ["Almoço", employeeSchedule.lunch, ""],
                      ["Carga diária", employeeSchedule.total, "text-[#5DCAA5]"],
                    ].map(([label, value, extraClass], index) => (
                      <FadeIn
                        key={label}
                        delay={index * 80}
                        className="rounded-lg border border-white/10 bg-white/[0.03] p-4"
                      >
                        <p className="text-xs text-white/40">{label}</p>
                        <p className={`mt-1 text-lg font-semibold ${extraClass}`}>
                          {value}
                        </p>
                      </FadeIn>
                    ))}
                  </div>
                </FadeIn>

                {/* Tabela de tarefas */}
                <FadeIn
                  delay={80}
                  className="relative overflow-hidden rounded-xl border border-white/12 bg-white/[0.045] shadow-2xl shadow-black/20 backdrop-blur-2xl before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-white/25"
                >
                  {/* Cabeçalho — apenas telas grandes */}
                  <div className="hidden grid-cols-[1.1fr_1.6fr_1.1fr_1fr] gap-4 border-b border-white/10 px-6 py-4 text-xs font-semibold tracking-[0.1em] text-white/40 uppercase lg:grid">
                    <span>O que fazer</span>
                    <span>Descrição</span>
                    <span>Anexo</span>
                    <span>Status</span>
                  </div>

                  <div className="divide-y divide-white/10">
                    {tasks.map((task, taskIndex) => {
                      const expanded = expandedTaskId === task.id
                      const status = statusStyles[task.status]
                      return (
                        <FadeIn
                          key={task.id}
                          delay={taskIndex * 90}
                          className="px-4 py-4 sm:px-6"
                        >
                          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.1fr_1.6fr_1.1fr_1fr] lg:items-start">
                            {/* O que fazer */}
                            <button
                              type="button"
                              onClick={() => toggleTaskExpanded(task.id)}
                              className="flex items-start gap-2 text-left"
                            >
                              <ChevronDown
                                size={16}
                                className={`mt-1 shrink-0 text-white/40 transition-transform ${expanded ? "rotate-0" : "-rotate-90"}`}
                              />
                              <span>
                                <span className="block font-semibold text-white">
                                  {task.title}
                                </span>
                                <span className="mt-1 block text-xs font-semibold text-white/40">
                                  {task.deadline}
                                </span>
                              </span>
                            </button>

                            {/* Descrição / passos */}
                            {expanded ? (
                              <ol className="space-y-2 text-sm leading-6 text-white/55">
                                {task.steps.map((step, index) => (
                                  <li key={step} className="flex gap-2">
                                    <span className="shrink-0 text-white/35">
                                      {index + 1}.
                                    </span>
                                    <span>{step}</span>
                                  </li>
                                ))}
                              </ol>
                            ) : (
                              <span className="hidden text-sm text-white/30 lg:block">
                                —
                              </span>
                            )}

                            {/* Anexo */}
                            <div className="flex flex-col gap-2">
                              {expanded && (
                                <label className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-lg border border-blue-400/30 bg-blue-500/10 px-3 py-2 text-xs font-semibold text-blue-200 hover:bg-blue-500/20">
                                  <Paperclip size={13} />
                                  {task.attachment ? "Anexar novo" : "Anexar arquivo"}
                                  <input
                                    type="file"
                                    className="hidden"
                                    onChange={(event) =>
                                      attachTaskFile(
                                        task.id,
                                        event.target.files?.[0]
                                      )
                                    }
                                  />
                                </label>
                              )}
                              <div className="flex items-center gap-2 rounded-lg border border-dashed border-white/15 bg-white/[0.02] px-3 py-2 text-xs text-white/40">
                                <FileUp size={14} className="shrink-0" />
                                <span className="truncate">
                                  {task.attachment ?? "Nenhum arquivo"}
                                </span>
                              </div>
                            </div>

                            {/* Status */}
                            <div className="flex flex-col items-start gap-2 lg:items-end">
                              <span
                                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${status.className}`}
                              >
                                {task.status === "verificado" && (
                                  <ShieldCheck size={13} />
                                )}
                                {status.label}
                              </span>
                              {task.status === "verificado" &&
                                task.verifiedBy && (
                                  <span className="text-[11px] text-white/35">
                                    Verificado por {task.verifiedBy}
                                  </span>
                                )}
                              {task.status !== "verificado" &&
                                task.attachment && (
                                  <button
                                    type="button"
                                    onClick={() => toggleTaskStatus(task.id)}
                                    className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold ${
                                      task.status === "concluido"
                                        ? "border border-white/15 text-white/50 hover:bg-white/5"
                                        : "bg-[#5DCAA5] text-[#070B14] hover:bg-[#4fb996]"
                                    }`}
                                  >
                                    <Check size={13} />
                                    {task.status === "concluido"
                                      ? "Reabrir"
                                      : "Concluído"}
                                  </button>
                                )}
                            </div>
                          </div>
                        </FadeIn>
                      )
                    })}
                  </div>
                </FadeIn>
              </section>
            )}
            {employeeTab === "time" && (
              <section className="mt-4 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <FadeIn className="relative overflow-hidden rounded-xl border border-white/12 bg-white/[0.045] p-5 shadow-2xl shadow-black/20 backdrop-blur-2xl before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-white/25 sm:p-6">
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
                  </FadeIn>
                  <FadeIn
                    delay={100}
                    className="relative overflow-hidden rounded-xl border border-white/12 bg-white/[0.045] p-5 shadow-2xl shadow-black/20 backdrop-blur-2xl before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-white/25 sm:p-6"
                  >
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
                  </FadeIn>
                </div>
              </section>
            )}
            {employeeTab === "calendar" && (
              <FadeIn className="relative mt-4 overflow-hidden rounded-xl border border-white/12 bg-white/[0.045] p-5 shadow-2xl shadow-black/20 backdrop-blur-2xl before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-white/25 sm:p-6">
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
                  <FadeIn className="mt-6 rounded-lg border border-blue-400/20 bg-blue-500/5 p-4">
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
                  </FadeIn>
                )}
                <p className="mt-5 text-xs text-white/45">
                  Clique em um dia útil para solicitar folga ou registrar uma
                  falta.
                </p>
              </FadeIn>
            )}
            {employeeTab === "report" && (
              <section className="mt-4 grid gap-4 sm:grid-cols-2">
                <FadeIn
                  as="form"
                  onSubmit={(event: React.FormEvent) => {
                    event.preventDefault()
                    setNotice("Relatório enviado para a gestão.")
                    setReport("")
                  }}
                  className="relative overflow-hidden rounded-xl border border-white/12 bg-white/[0.045] p-5 shadow-2xl shadow-black/20 backdrop-blur-2xl before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-white/25 sm:p-6"
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
                </FadeIn>
                <FadeIn
                  as="form"
                  delay={100}
                  onSubmit={(event: React.FormEvent) => {
                    event.preventDefault()
                    setNotice("Problema enviado para a gestão.")
                    setProblem("")
                  }}
                  className="relative overflow-hidden rounded-xl border border-red-400/20 bg-white/[0.045] p-5 shadow-2xl shadow-black/20 backdrop-blur-2xl before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-red-300/25 sm:p-6"
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
                </FadeIn>
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