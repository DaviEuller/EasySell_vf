import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom"
import { Moon, Sun } from "lucide-react"

import AppLayout from "@/components/AppLayout"
import { useDarkMode } from "@/lib/use-dark-mode"
import { Cadastro } from "@/pages/Cadastro"
import { Home } from "@/pages/home"
import { Login } from "@/pages/Login"
import { Equipe } from "@/pages/Equipe"
import { Empresa } from "@/pages/Empresa"
import ResumoCards from "@/pages/resumo"
import Estoque from "@/pages/estoque"
import AdminPage from "@/pages/dashboard"
import Financias from "@/pages/Financias"
import Clientes from "@/pages/clientes"
import Produtos from "@/pages/Produto"
import Sellia from "@/pages/sellia"

// Páginas públicas (landing, login, cadastro): sem sidebar, com botão de tema.
function PublicLayout() {
  const { darkMode, setDarkMode } = useDarkMode()

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <button
        type="button"
        onClick={() => setDarkMode((current) => !current)}
        className="fixed top-5 right-5 z-[9999] flex h-10 w-10 items-center justify-center rounded-md border border-border bg-card text-foreground shadow-lg transition-transform hover:scale-105"
        aria-label={darkMode ? "Ativar tema claro" : "Ativar tema escuro"}
        title="Alternar tema (tecla D)"
      >
        {darkMode ? <Sun size={18} /> : <Moon size={18} />}
      </button>
      <Outlet />
    </div>
  )
}

function DashboardRoute() {
  const { darkMode, setDarkMode } = useDarkMode()
  return <AdminPage darkMode={darkMode} setDarkMode={setDarkMode} />
}

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Cadastro />} />
        </Route>

        {/* Todo o app: sidebar fixa (com opção de esconder) + tema único */}
        <Route element={<AppLayout />}>
          <Route path="/resumo" element={<ResumoCards />} />
          <Route path="/dashboard" element={<DashboardRoute />} />
          <Route path="/produtos" element={<Produtos />} />
          <Route path="/estoque" element={<Estoque />} />
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/financias" element={<Financias />} />
          <Route path="/equipe" element={<Equipe />} />
          <Route path="/empresa" element={<Empresa />} />
          <Route path="/sell" element={<Sellia />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
