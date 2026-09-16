import { BrowserRouter, Routes, Route } from "react-router-dom"

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

export function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Página inicial */}
        <Route path="/" element={<Home />} />

        {/* Autenticação */}
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />

        {/* Sistema */}
        <Route path="/equipe" element={<Equipe />} />
        <Route path="/empresa" element={<Empresa />} />
        <Route path="/dashboard" element={<AdminPage />} />
        <Route path="/financias" element={<Financias />} />
        <Route path="/resumo" element={<ResumoCards />} />
        <Route path="/estoque" element={<Estoque />} />
        <Route path="/clientes" element={<Clientes />} />
        <Route path="/produtos" element={<Produtos />} />

        {/* Sellia */}
        <Route path="/sell" element={<Sellia />} />

      </Routes>
    </BrowserRouter>
  )
}

export default App