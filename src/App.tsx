import { Cadastro } from "@/pages/Cadastro"
import { Home } from "@/pages/home"
import { Login } from "@/pages/Login"
import { Equipe } from "@/pages/Equipe"
import ResumoCards from "@/pages/resumo"
import Estoque from "@/pages/estoque"
import { Empresa } from "@/pages/Empresa"
import AdminPage from "@/pages/dashboard"
import Financias from "@/pages/Financias"
import Clientes from "@/pages/clientes"
import Produtos from "@/pages/Produto"
import Sellia from "./pages/sellia"

export function App() {
  if (window.location.pathname === "/cadastro") return <Cadastro />
  if (window.location.pathname === "/login") return <Login />
  if (window.location.pathname === "/equipe") return <Equipe />
  if (window.location.pathname === "/empresa") return <Empresa />
  if (window.location.pathname === "/dashboard") return <AdminPage />
  if (window.location.pathname === "/financias") return <Financias />
  if (window.location.pathname === "/resumo") return <ResumoCards />
  if (window.location.pathname === "/estoque") return <Estoque />
  if (window.location.pathname === "/clientes") return <Clientes />
  if (window.location.pathname === "/produtos") return <Produtos />
  if (window.location.pathname === "/sellia") return <Sellia />

  return <Home />
}

export default App