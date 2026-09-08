import { Cadastro } from "@/pages/Cadastro"
import { Home } from "@/pages/home"
import { Login } from "@/pages/Login"
import { Equipe } from "@/pages/Equipe"
import { Empresa } from "@/pages/Empresa"
import AdminPage from "@/pages/dashboard"

export function App() {
  if (window.location.pathname === "/cadastro") return <Cadastro />
  if (window.location.pathname === "/login") return <Login />
  if (window.location.pathname === "/equipe") return <Equipe />
  if (window.location.pathname === "/empresa") return <Empresa />
  if (window.location.pathname === "/dashboard") return <AdminPage />
  return <Home />
}

export default App
