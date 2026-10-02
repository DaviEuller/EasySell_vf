import { useEffect, useState } from "react"
import { NavLink, Outlet, useLocation } from "react-router-dom"
import {
  Archive,
  Building2,
  Home,
  LayoutDashboard,
  Moon,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
  Sun,
  Users,
  UsersRound,
  Wallet,
  X,
} from "lucide-react"

import { useDarkMode } from "@/lib/use-dark-mode"

const STORAGE_KEY = "easysell-sidebar"
const SIDEBAR_WIDTH = 260

const sections = [
  {
    title: "Geral",
    items: [
      { to: "/resumo", label: "Resumo", icon: Home },
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    ],
  },
  {
    title: "Gestão",
    items: [
      { to: "/produtos", label: "Produtos", icon: Archive },
      { to: "/estoque", label: "Estoque", icon: Package },
      { to: "/clientes", label: "Clientes", icon: Users },
      { to: "/financias", label: "Financeiro", icon: Wallet },
    ],
  },
  {
    title: "Organização",
    items: [
      { to: "/equipe", label: "Equipe", icon: UsersRound },
      { to: "/empresa", label: "Empresa", icon: Building2 },
    ],
  },
  {
    title: "Inteligência",
    items: [{ to: "/sell", label: "Sellia", icon: Sparkles }],
  },
]

const allItems = sections.flatMap((section) => section.items)

function useIsDesktop() {
  const query = "(min-width: 1024px)"
  const [isDesktop, setIsDesktop] = useState(
    () => window.matchMedia(query).matches
  )

  useEffect(() => {
    const media = window.matchMedia(query)
    const onChange = () => setIsDesktop(media.matches)
    media.addEventListener("change", onChange)
    return () => media.removeEventListener("change", onChange)
  }, [])

  return isDesktop
}

export function AppLayout() {
  const { darkMode, setDarkMode } = useDarkMode()
  const { pathname } = useLocation()
  const isDesktop = useIsDesktop()

  // desktop: lembra se o menu está escondido; mobile: abre como gaveta
  const [hidden, setHidden] = useState(
    () => localStorage.getItem(STORAGE_KEY) === "hidden"
  )
  const [mobileOpen, setMobileOpen] = useState(false)

  const visible = isDesktop ? !hidden : mobileOpen
  const offset = isDesktop && !hidden ? SIDEBAR_WIDTH : 0
  const pageTitle =
    allItems.find((item) => pathname.startsWith(item.to))?.label ?? "EasySell"

  const toggleSidebar = () => {
    if (isDesktop) {
      setHidden((current) => {
        const next = !current
        localStorage.setItem(STORAGE_KEY, next ? "hidden" : "visible")
        return next
      })
    } else {
      setMobileOpen((current) => !current)
    }
  }

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  // atalho: tecla B mostra/esconde o menu
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat || event.metaKey || event.ctrlKey || event.altKey) return
      const target = event.target as HTMLElement | null
      if (
        target &&
        (target.isContentEditable ||
          target.closest("input, textarea, select, [contenteditable='true']"))
      ) {
        return
      }
      if (event.key.toLowerCase() === "b") toggleSidebar()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  })

  return (
    <div
      className="min-h-screen bg-background text-foreground"
      style={{ "--sidebar-w": `${offset}px` } as React.CSSProperties}
    >
      {/* fundo escurecido no mobile */}
      {!isDesktop && mobileOpen && (
        <button
          type="button"
          aria-label="Fechar menu"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/50"
        />
      )}

      {/* SIDEBAR */}
      <aside
        aria-hidden={!visible}
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-border bg-card transition-transform duration-300 ease-out ${
          visible ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ width: SIDEBAR_WIDTH }}
      >
        <div className="flex h-16 items-center justify-between border-b border-border px-5">
          <NavLink to="/resumo" className="text-lg font-bold tracking-tight">
            EasySell<span className="text-blue-500">.</span>
          </NavLink>

          <button
            type="button"
            onClick={toggleSidebar}
            title="Esconder menu (B)"
            aria-label="Esconder menu"
            className="flex size-8 items-center justify-center rounded-md text-foreground/50 transition-colors hover:bg-foreground/[0.06] hover:text-foreground"
          >
            {isDesktop ? <PanelLeftClose size={18} /> : <X size={18} />}
          </button>
        </div>

        <nav className="no-scrollbar flex-1 space-y-6 overflow-y-auto px-3 py-5">
          {sections.map((section) => (
            <div key={section.title}>
              <p className="px-3 text-[0.68rem] font-medium tracking-[0.16em] text-foreground/40 uppercase">
                {section.title}
              </p>

              <div className="mt-2 space-y-0.5">
                {section.items.map(({ to, label, icon: Icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                        isActive
                          ? "bg-blue-500/10 font-medium text-blue-600 dark:text-blue-300"
                          : "text-foreground/65 hover:bg-foreground/[0.05] hover:text-foreground"
                      }`
                    }
                  >
                    <Icon size={17} />
                    {label}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="space-y-2 border-t border-border p-3">
          <button
            type="button"
            onClick={() => setDarkMode((current) => !current)}
            className="flex w-full items-center justify-between rounded-md border border-border px-3 py-2.5 text-left text-sm transition-colors hover:bg-foreground/[0.05]"
          >
            <span>Tema {darkMode ? "escuro" : "claro"}</span>
            {darkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          <div className="flex items-center gap-3 rounded-md border border-border px-3 py-2.5">
            <div className="flex size-8 items-center justify-center rounded-full bg-blue-500/15 text-xs font-medium text-blue-600 dark:text-blue-300">
              D
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">Davi</p>
              <p className="text-xs text-foreground/40">Administrador</p>
            </div>
          </div>
        </div>
      </aside>

      {/* BARRA SUPERIOR */}
      <header
        className="fixed top-0 right-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-border bg-background/85 px-4 backdrop-blur-md transition-[left] duration-300 ease-out sm:px-6"
        style={{ left: offset }}
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleSidebar}
            title={visible ? "Esconder menu (B)" : "Mostrar menu (B)"}
            aria-label={visible ? "Esconder menu" : "Mostrar menu"}
            className="flex size-9 items-center justify-center rounded-md border border-border bg-card text-foreground/70 transition-colors hover:text-foreground"
          >
            {visible ? <PanelLeftClose size={17} /> : <PanelLeftOpen size={17} />}
          </button>
          <span className="text-sm font-medium">{pageTitle}</span>
        </div>

        <button
          type="button"
          onClick={() => setDarkMode((current) => !current)}
          aria-label={darkMode ? "Ativar tema claro" : "Ativar tema escuro"}
          title="Alternar tema (tecla D)"
          className="flex size-9 items-center justify-center rounded-md border border-border bg-card text-foreground/70 transition-colors hover:text-foreground"
        >
          {darkMode ? <Sun size={17} /> : <Moon size={17} />}
        </button>
      </header>

      {/* CONTEÚDO */}
      <div
        className="transition-[padding] duration-300 ease-out"
        style={{ paddingLeft: offset }}
      >
        <Outlet />
      </div>
    </div>
  )
}

export default AppLayout
