import { Cadastro } from "@/pages/Cadastro"
import { Home } from "@/pages/home"

export function App() {
  return window.location.pathname === "/cadastro" ? <Cadastro /> : <Home />
}

export default App
