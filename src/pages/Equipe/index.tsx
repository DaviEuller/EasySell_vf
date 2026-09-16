import { useState } from "react"
import {
  Download,
  Plus,
  Search,
  UserPlus,
  UserRoundCheck,
  UserRoundMinus,
  Pencil,
  Check,
  Clock3,
} from "lucide-react"
import NavbarPreset from "@/components/navbar_preset"
import { AppDock } from "@/components/Dock"

type Employee = {
  id: number
  name: string
  age: number
  role: string
  cpf: string
  productivity: number
  activity: string
  tasks: string[]
  schedule: { start: string; end: string; lunch: string; workDays: string[] }
  status: "Ativo" | "Demitido"
}

const initialEmployees: Employee[] = [
  {
    id: 1,
    name: "Ana Souza",
    age: 28,
    role: "Vendedora",
    cpf: "123.456.789-00",
    productivity: 92,
    activity: "42 vendas concluídas e 18 clientes atendidos nesta semana.",
    tasks: ["Revisar metas da semana", "Retornar clientes pendentes"],
    schedule: { start: "08:00", end: "18:00", lunch: "01:00", workDays: ["Seg", "Ter", "Qua", "Qui", "Sex"] },
    status: "Ativo",
  },
  {
    id: 2,
    name: "Lucas Martins",
    age: 34,
    role: "Gerente de loja",
    cpf: "234.567.890-11",
    productivity: 86,
    activity: "Revisou 24 pedidos, atualizou o estoque e acompanhou 6 metas.",
    tasks: ["Validar inventário", "Enviar relatório mensal"],
    schedule: { start: "08:00", end: "17:00", lunch: "01:00", workDays: ["Seg", "Ter", "Qua", "Qui", "Sex"] },
    status: "Ativo",
  },
  {
    id: 3,
    name: "Beatriz Lima",
    age: 25,
    role: "Atendimento",
    cpf: "345.678.901-22",
    productivity: 78,
    activity: "Atendeu 56 chamados e manteve 96% de satisfação dos clientes.",
    tasks: ["Acompanhar chamados abertos"],
    schedule: { start: "09:00", end: "18:00", lunch: "01:00", workDays: ["Seg", "Ter", "Qua", "Qui", "Sex"] },
    status: "Ativo",
  },
  {
    id: 4,
    name: "Rafael Alves",
    age: 31,
    role: "Estoquista",
    cpf: "456.789.012-33",
    productivity: 71,
    activity: "Conferiu 184 produtos e sinalizou 18 itens com estoque baixo.",
    tasks: ["Separar produtos para reposição"],
    schedule: { start: "07:00", end: "16:00", lunch: "01:00", workDays: ["Seg", "Ter", "Qua", "Qui", "Sex"] },
    status: "Ativo",
  },
]

const weekDays = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"]

const chartData = [
  { label: "Ana", value: 92, color: "#3B82F6" },
  { label: "Lucas", value: 86, color: "#60A5FA" },
  { label: "Beatriz", value: 78, color: "#5DCAA5" },
  { label: "Rafael", value: 71, color: "#F59E0B" },
]

function maskCpf(cpf: string) {
  return `${cpf.slice(0, 3)}.***.***-${cpf.slice(-2)}`
}

function exportEmployees(employees: Employee[]) {
  const header = "Nome,Idade,Funcao,CPF,Produtividade,Status"
  const rows = employees.map((employee) =>
    [
      employee.name,
      employee.age,
      employee.role,
      employee.cpf,
      `${employee.productivity}%`,
      employee.status,
    ]
      .map((value) => `"${value}"`)
      .join(",")
  )
  const blob = new Blob([[header, ...rows].join("\n")], {
    type: "text/csv;charset=utf-8",
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = "funcionarios-easysell.csv"
  link.click()
  URL.revokeObjectURL(url)
}

export function Equipe() {
  const [employees, setEmployees] = useState(initialEmployees)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [query, setQuery] = useState("")
  const [activeTab, setActiveTab] = useState<
    "todos" | "adicionar" | "easycrew"
  >("todos")
  const [notice, setNotice] = useState("")
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editDraft, setEditDraft] = useState({
    name: "",
    age: "",
    role: "",
    cpf: "",
  })
  const [taskDrafts, setTaskDrafts] = useState<Record<number, string>>({})
  const [scheduleDrafts, setScheduleDrafts] = useState<
    Record<number, Employee["schedule"]>
  >({})

  const filteredEmployees = employees.filter((employee) =>
    `${employee.name} ${employee.role}`
      .toLowerCase()
      .includes(query.toLowerCase())
  )

  const addEmployee = () => {
    const nextId = Math.max(...employees.map((employee) => employee.id), 0) + 1
    setEmployees((current) => [
      ...current,
      {
        id: nextId,
        name: "Novo funcionário",
        age: 0,
        role: "Nova função",
        cpf: "000.000.000-00",
        productivity: 0,
        activity: "Nenhuma atividade registrada.",
        tasks: [],
        schedule: { start: "08:00", end: "18:00", lunch: "01:00", workDays: ["Seg", "Ter", "Qua", "Qui", "Sex"] },
        status: "Ativo",
      },
    ])
    setActiveTab("todos")
    setNotice("Funcionário adicionado. Edite os dados na linha criada.")
  }

  const dismissEmployee = (id: number) => {
    setEmployees((current) =>
      current.map((employee) =>
        employee.id === id ? { ...employee, status: "Demitido" } : employee
      )
    )
    setNotice("Funcionário marcado como demitido.")
  }

  const startEditing = (employee: Employee) => {
    setExpandedId(employee.id)
    setEditingId(employee.id)
    setEditDraft({
      name: employee.name,
      age: String(employee.age || ""),
      role: employee.role,
      cpf: employee.cpf,
    })
    setScheduleDrafts((current) => ({
      ...current,
      [employee.id]: { ...employee.schedule },
    }))
  }

  const saveSchedule = (employee: Employee) => {
    const draft = scheduleDrafts[employee.id] || employee.schedule
    setEmployees((current) =>
      current.map((item) =>
        item.id === employee.id ? { ...item, schedule: draft } : item
      )
    )
    setNotice(`Horário de ${employee.name} atualizado.`)
  }

  const saveEditing = (id: number) => {
    setEmployees((current) =>
      current.map((employee) =>
        employee.id === id
          ? {
              ...employee,
              name: editDraft.name || employee.name,
              age: Number(editDraft.age) || 0,
              role: editDraft.role || employee.role,
              cpf: editDraft.cpf || employee.cpf,
            }
          : employee
      )
    )
    setEditingId(null)
    setNotice("Dados do funcionário atualizados.")
  }

  const addTask = (id: number) => {
    const task = taskDrafts[id]?.trim()
    if (!task) return
    setEmployees((current) =>
      current.map((employee) =>
        employee.id === id
          ? { ...employee, tasks: [...employee.tasks, task] }
          : employee
      )
    )
    setTaskDrafts((current) => ({ ...current, [id]: "" }))
  }

  const toggleTask = (id: number, taskIndex: number) => {
    setEmployees((current) =>
      current.map((employee) =>
        employee.id === id
          ? {
              ...employee,
              tasks: employee.tasks.map((task, index) =>
                index === taskIndex && !task.startsWith("✓ ")
                  ? `✓ ${task}`
                  : task
              ),
            }
          : employee
      )
    )
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#070B14] px-4 pt-20 pb-16 text-white sm:px-8">
      <NavbarPreset />
      <AppDock />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_85%_8%,rgba(37,99,235,0.16),transparent_28%),radial-gradient(circle_at_10%_90%,rgba(14,165,233,0.08),transparent_30%)]" />
      <div className="relative z-10 mx-auto max-w-7xl">
        <section className="flex flex-col justify-between gap-6 py-10 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold tracking-[0.24em] text-blue-300 uppercase">
              Gestão interna
            </p>
            <h1 className="mt-4 font-heading text-4xl font-bold sm:text-5xl">
              Sua equipe.
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-white/50">
              Acompanhe pessoas, atividades e produtividade em um só lugar.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => exportEmployees(employees)}
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-4 text-sm font-semibold text-white/75 transition hover:bg-white/10 hover:text-white"
            >
              <Download size={16} /> Exportar
            </button>
            <button
              onClick={addEmployee}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-500"
            >
              <Plus size={17} /> Adicionar
            </button>
          </div>
        </section>

        <section className="grid gap-3 border-y border-white/10 py-6 sm:grid-cols-3">
          <div>
            <p className="text-xs text-white/45">Funcionários ativos</p>
            <strong className="mt-2 block font-heading text-3xl">
              {
                employees.filter((employee) => employee.status === "Ativo")
                  .length
              }
            </strong>
          </div>
          <div>
            <p className="text-xs text-white/45">Produtividade média</p>
            <strong className="mt-2 block font-heading text-3xl">
              {Math.round(
                employees.reduce(
                  (total, employee) => total + employee.productivity,
                  0
                ) / employees.length
              )}
              %
            </strong>
          </div>
          <div>
            <p className="text-xs text-white/45">Atividades esta semana</p>
            <strong className="mt-2 block font-heading text-3xl">128</strong>
          </div>
        </section>

        <section className="mt-8 grid gap-4 lg:grid-cols-[1fr_0.8fr]">
          <div className="app-panel rounded-xl p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold tracking-[0.16em] text-blue-300 uppercase">
                  Performance
                </p>
                <h2 className="mt-2 font-heading text-2xl font-bold">
                  Produtividade da equipe
                </h2>
              </div>
              <UserRoundCheck className="text-blue-300" size={21} />
            </div>
            <div className="mt-8 space-y-5">
              {chartData.map((item) => (
                <div key={item.label}>
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="text-white/60">{item.label}</span>
                    <strong>{item.value}%</strong>
                  </div>
                  <div className="h-2 rounded-full bg-white/10">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{
                        width: `${item.value}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="app-panel rounded-xl p-5 sm:p-6">
            <p className="text-xs font-semibold tracking-[0.16em] text-blue-300 uppercase">
              EasyCrew
            </p>
            <h2 className="mt-2 font-heading text-2xl font-bold">
              Encontre seu próximo talento.
            </h2>
            <p className="mt-4 text-sm leading-6 text-white/50">
              Busque candidatos qualificados e conecte novas pessoas à sua
              equipe.
            </p>
            <button
              onClick={() => setActiveTab("easycrew")}
              className="mt-6 inline-flex items-center gap-2 rounded-lg border border-blue-400/30 bg-blue-500/10 px-4 py-2 text-sm font-semibold text-blue-200 transition hover:bg-blue-500/20"
            >
              <UserPlus size={16} /> Encontrar no EasyCrew
            </button>
          </div>
        </section>

        <section className="app-panel mt-8 rounded-xl">
          <div className="flex flex-col gap-4 border-b border-white/10 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div>
              <p className="text-xs font-semibold tracking-[0.16em] text-blue-300 uppercase">
                Pessoas
              </p>
              <h2 className="mt-2 font-heading text-2xl font-bold">
                Funcionários
              </h2>
            </div>
            <div className="relative">
              <Search
                className="absolute top-1/2 left-3 -translate-y-1/2 text-white/35"
                size={16}
              />
              <input
                aria-label="Buscar funcionário"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar funcionário"
                className="h-10 w-full rounded-lg border border-white/10 bg-white/[0.04] pr-3 pl-9 text-sm outline-none placeholder:text-white/35 focus:border-blue-400/50 sm:w-64"
              />
            </div>
          </div>
          <div className="flex gap-5 overflow-x-auto border-b border-white/10 px-5 sm:px-6">
            <button
              onClick={() => setActiveTab("todos")}
              className={`border-b-2 py-4 text-sm font-semibold ${activeTab === "todos" ? "border-blue-400 text-white" : "border-transparent text-white/45"}`}
            >
              Todos
            </button>
            <button
              onClick={addEmployee}
              className="border-b-2 border-transparent py-4 text-sm font-semibold text-white/45 hover:text-white"
            >
              <Plus size={15} className="mr-1 inline" /> Adicionar
            </button>
            <button
              onClick={() => setActiveTab("easycrew")}
              className={`border-b-2 py-4 text-sm font-semibold ${activeTab === "easycrew" ? "border-blue-400 text-white" : "border-transparent text-white/45"}`}
            >
              Encontrar no EasyCrew
            </button>
          </div>
          {notice && (
            <p className="border-b border-blue-400/15 bg-blue-400/5 px-5 py-3 text-sm text-blue-200 sm:px-6">
              {notice}
            </p>
          )}
          {activeTab === "easycrew" ? (
            <div className="p-8 text-center">
              <UserPlus className="mx-auto text-blue-300" size={28} />
              <h3 className="mt-4 font-heading text-xl font-bold">
                Busca no EasyCrew
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/50">
                A integração está pronta para receber candidatos do EasyCrew. Em
                breve você poderá convidar uma pessoa diretamente para sua
                equipe.
              </p>
              <button
                onClick={() => setActiveTab("todos")}
                className="mt-5 text-sm font-semibold text-blue-300 hover:text-white"
              >
                Voltar para funcionários
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="text-xs tracking-[0.12em] text-white/40 uppercase">
                  <tr>
                    <th className="px-5 py-4 font-medium sm:px-6">Nome</th>
                    <th className="px-5 py-4 font-medium">Idade</th>
                    <th className="px-5 py-4 font-medium">Função</th>
                    <th className="px-5 py-4 font-medium">CPF</th>
                    <th className="px-5 py-4 font-medium">Status</th>
                    <th className="px-5 py-4 font-medium">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.map((employee) => (
                    <tr className="border-t border-white/10" key={employee.id}>
                      <td className="px-5 py-4 sm:px-6">
                        <button
                          onClick={() =>
                            setExpandedId(
                              expandedId === employee.id ? null : employee.id
                            )
                          }
                          className="font-semibold text-white hover:text-blue-300"
                        >
                          {employee.name}
                        </button>
                        {expandedId === employee.id && (
                          <div className="mt-3 max-w-xl space-y-4">
                            <p className="text-xs leading-5 text-white/45">
                              {employee.activity}
                            </p>
                            {editingId === employee.id && (
                              <div className="grid gap-2 rounded-lg border border-blue-400/20 bg-blue-400/5 p-3 sm:grid-cols-2">
                                {(["name", "age", "role", "cpf"] as const).map(
                                  (field) => (
                                    <label
                                      className="text-xs text-white/50"
                                      key={field}
                                    >
                                      {field === "name"
                                        ? "Nome"
                                        : field === "age"
                                          ? "Idade"
                                          : field === "role"
                                            ? "Função"
                                            : "CPF"}
                                      <input
                                        className="mt-1 h-9 w-full rounded-md border border-white/10 bg-[#070B14] px-2 text-sm text-white outline-none focus:border-blue-400/60"
                                        type={
                                          field === "age" ? "number" : "text"
                                        }
                                        value={editDraft[field]}
                                        onChange={(event) =>
                                          setEditDraft((current) => ({
                                            ...current,
                                            [field]: event.target.value,
                                          }))
                                        }
                                      />
                                    </label>
                                  )
                                )}
                                <button
                                  className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-blue-600 px-3 text-xs font-semibold text-white hover:bg-blue-500"
                                  onClick={() => saveEditing(employee.id)}
                                >
                                  <Check size={14} /> Salvar alterações
                                </button>
                              </div>
                            )}
                            <div className="rounded-lg border border-blue-400/20 bg-blue-500/5 p-3">
                              <div className="flex items-center gap-2">
                                <Clock3 className="text-blue-300" size={16} />
                                <p className="text-xs font-semibold tracking-[0.12em] text-blue-300 uppercase">
                                  Horário deste funcionário
                                </p>
                              </div>
                              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                                {(["start", "end", "lunch"] as const).map(
                                  (field) => {
                                    const schedule =
                                      scheduleDrafts[employee.id] ||
                                      employee.schedule
                                    return (
                                      <label
                                        className="text-xs text-white/50"
                                        key={field}
                                      >
                                        {field === "start"
                                          ? "Entrada"
                                          : field === "end"
                                            ? "Saída"
                                            : "Almoço"}
                                        <input
                                          type="time"
                                          value={schedule[field]}
                                          onChange={(event) =>
                                            setScheduleDrafts((current) => ({
                                              ...current,
                                              [employee.id]: {
                                                ...schedule,
                                                [field]: event.target.value,
                                              },
                                            }))
                                          }
                                          className="mt-1 h-9 w-full rounded-md border border-white/10 bg-[#070B14] px-2 text-sm text-white outline-none focus:border-blue-400/60"
                                        />
                                      </label>
                                    )
                                  }
                                )}
                              </div>
                              <div className="mt-4">
                                <p className="text-xs text-white/50">Dias de trabalho</p>
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {weekDays.map((day) => {
                                    const schedule = scheduleDrafts[employee.id] || employee.schedule
                                    const selected = schedule.workDays.includes(day)
                                    return <button type="button" key={day} onClick={() => setScheduleDrafts((current) => ({ ...current, [employee.id]: { ...schedule, workDays: selected ? schedule.workDays.filter((item) => item !== day) : [...schedule.workDays, day] } }))} className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition ${selected ? "border-blue-400/50 bg-blue-500/20 text-blue-200" : "border-white/10 text-white/35 hover:text-white"}`}>{day}</button>
                                  })}
                                </div>
                              </div>
                              <button
                                onClick={() => saveSchedule(employee)}
                                className="mt-3 inline-flex h-9 items-center gap-2 rounded-md bg-blue-600 px-3 text-xs font-semibold text-white hover:bg-blue-500"
                              >
                                <Check size={14} /> Salvar horário
                              </button>
                            </div>
                            <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
                              <p className="text-xs font-semibold tracking-[0.12em] text-blue-300 uppercase">
                                Tarefas
                              </p>
                              <div className="mt-3 space-y-2">
                                {employee.tasks.map((task, index) => (
                                  <button
                                    className={`flex w-full items-center gap-2 text-left text-xs ${task.startsWith("✓") ? "text-[#5DCAA5] line-through" : "text-white/65"}`}
                                    key={`${task}-${index}`}
                                    onClick={() =>
                                      toggleTask(employee.id, index)
                                    }
                                  >
                                    <span className="flex size-4 shrink-0 items-center justify-center rounded border border-white/20">
                                      <Check size={11} />
                                    </span>
                                    {task}
                                  </button>
                                ))}
                              </div>
                              <div className="mt-3 flex gap-2">
                                <input
                                  aria-label={`Nova tarefa para ${employee.name}`}
                                  value={taskDrafts[employee.id] || ""}
                                  onChange={(event) =>
                                    setTaskDrafts((current) => ({
                                      ...current,
                                      [employee.id]: event.target.value,
                                    }))
                                  }
                                  onKeyDown={(event) => {
                                    if (event.key === "Enter")
                                      addTask(employee.id)
                                  }}
                                  placeholder="Adicionar tarefa"
                                  className="h-9 min-w-0 flex-1 rounded-md border border-white/10 bg-[#070B14] px-3 text-xs text-white outline-none placeholder:text-white/35 focus:border-blue-400/60"
                                />
                                <button
                                  onClick={() => addTask(employee.id)}
                                  className="inline-flex h-9 items-center gap-1 rounded-md border border-blue-400/30 px-3 text-xs font-semibold text-blue-200 hover:bg-blue-500/10"
                                >
                                  <Plus size={14} /> Adicionar
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4 text-white/60">
                        {employee.age || "-"}
                      </td>
                      <td className="px-5 py-4 text-white/60">
                        {employee.role}
                      </td>
                      <td className="px-5 py-4 font-mono text-xs text-white/50">
                        {maskCpf(employee.cpf)}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={
                            employee.status === "Ativo"
                              ? "text-[#5DCAA5]"
                              : "text-red-300"
                          }
                        >
                          {employee.status}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <button
                            aria-label={`Editar ${employee.name}`}
                            onClick={() => startEditing(employee)}
                            className="text-white/45 hover:text-white"
                          >
                            <Pencil size={17} />
                          </button>
                          {employee.status === "Ativo" && (
                            <button
                              aria-label={`Demitir ${employee.name}`}
                              onClick={() => dismissEmployee(employee.id)}
                              className="text-white/45 hover:text-red-300"
                            >
                              <UserRoundMinus size={17} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
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
