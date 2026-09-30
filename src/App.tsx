
import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import { Cadastro } from "@/pages/Cadastro";
import { Home } from "@/pages/home";
import { Login } from "@/pages/Login";
import { Equipe } from "@/pages/Equipe";
import { Empresa } from "@/pages/Empresa";
import ResumoCards from "@/pages/resumo";
import Estoque from "@/pages/estoque";
import AdminPage from "@/pages/dashboard";
import Financias from "@/pages/Financias";
import Clientes from "@/pages/clientes";
import Produtos from "@/pages/Produto";
import Sellia from "@/pages/sellia";

export function App() {
  const [darkMode, setDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem("theme");

    if (savedTheme === "light") {
      return false;
    }

    return true;
  });

  // Salva o tema
  useEffect(() => {
    localStorage.setItem(
      "theme",
      darkMode ? "dark" : "light"
    );
  }, [darkMode]);

  // Tecla T muda o tema
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;

      // Não muda enquanto estiver digitando
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      if (event.key.toLowerCase() === "t") {
        setDarkMode((current) => !current);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <BrowserRouter>
      <div
        className={
          darkMode
            ? "min-h-screen bg-[#0B1220] text-white transition-colors duration-300"
            : "min-h-screen bg-[#F3F6FA] text-[#111827] transition-colors duration-300"
        }
      >
        {/* Botão global de tema */}
        <button
          type="button"
          onClick={() => setDarkMode((current) => !current)}
          className={
            darkMode
              ? "fixed right-5 top-5 z-[9999] flex h-10 w-10 items-center justify-center rounded-md border border-white/10 bg-[#111B2E] text-white shadow-lg transition-all hover:scale-105"
              : "fixed right-5 top-5 z-[9999] flex h-10 w-10 items-center justify-center rounded-md border border-black/10 bg-white text-black shadow-lg transition-all hover:scale-105"
          }
          aria-label={
            darkMode
              ? "Ativar tema claro"
              : "Ativar tema escuro"
          }
        >
          {darkMode ? "☀️" : "🌙"}
        </button>

        <Routes>
          <Route path="/" element={<Home />} />

          <Route path="/login" element={<Login />} />

          <Route path="/cadastro" element={<Cadastro />} />

          <Route path="/equipe" element={<Equipe />} />

          <Route path="/empresa" element={<Empresa />} />

          {/* Dashboard recebe o estado do tema */}
          <Route
            path="/dashboard"
            element={
              <AdminPage
                darkMode={darkMode}
                setDarkMode={setDarkMode}
              />
            }
          />

          <Route path="/financias" element={<Financias />} />

          <Route path="/resumo" element={<ResumoCards />} />

          <Route path="/estoque" element={<Estoque />} />

          <Route path="/clientes" element={<Clientes />} />

          <Route path="/produtos" element={<Produtos />} />

          <Route path="/sell" element={<Sellia />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
