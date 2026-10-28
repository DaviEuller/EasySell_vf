import { useState } from "react"
import type { FormEvent } from "react"
import { Link } from "react-router-dom"
import NavbarPreset from "@/components/navbar_preset"

const field = "mt-2 w-full rounded-md border border-border bg-foreground/[0.06] px-4 py-3 text-sm text-foreground outline-none focus:border-blue-400"

export function RecuperarSenha() {
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [password, setPassword] = useState("")
  const [sent, setSent] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const apiUrl = import.meta.env.VITE_API_URL?.trim().replace(/\/+$/, "")
    if (!apiUrl) { setError("A API não está configurada."); return }
    setBusy(true); setError(""); setMessage("")
    try {
      const endpoint = sent ? "reset-password" : "forgot-password"
      const body = sent ? { email: email.trim(), code, password } : { email: email.trim() }
      const response = await fetch(`${apiUrl}/auth/${endpoint}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      const result = await response.json()
      if (!response.ok) throw new Error(typeof result.message === "string" ? result.message : "Não foi possível concluir a solicitação.")
      if (!sent) { setSent(true); setMessage("Se este e-mail estiver cadastrado, enviaremos um código válido por 10 minutos.") }
      else { setMessage("Senha redefinida com sucesso. Você já pode entrar."); setSent(false); setCode(""); setPassword("") }
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Ocorreu um erro. Tente novamente.") }
    finally { setBusy(false) }
  }

  return <main className="min-h-screen bg-background pt-20 text-foreground"><NavbarPreset /><div className="mx-auto grid min-h-[calc(100vh-88px)] max-w-5xl items-center gap-12 px-5 pb-12 sm:px-10 lg:grid-cols-2"><section><p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600 dark:text-blue-300">Acesso à conta</p><h1 className="mt-5 font-heading text-5xl font-bold">Recupere sua senha.</h1><p className="mt-6 leading-7 text-foreground/55">Vamos enviar um código de segurança para o e-mail da sua conta.</p></section><section className="app-panel rounded-md px-6 py-8 sm:px-10 sm:py-10"><h2 className="font-heading text-3xl font-bold">{sent ? "Verifique seu e-mail" : "Esqueceu a senha?"}</h2><p className="mt-2 text-sm text-foreground/50">{sent ? "Informe o código recebido e escolha uma nova senha." : "Digite o e-mail usado no cadastro."}</p><form className="mt-8" onSubmit={submit}><label className="block text-sm font-medium">E-mail<input className={field} type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" required /></label>{sent && <><label className="mt-5 block text-sm font-medium">Código de 6 dígitos<input className={field} inputMode="numeric" autoComplete="one-time-code" value={code} onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} minLength={6} maxLength={6} required /></label><label className="mt-5 block text-sm font-medium">Nova senha<input className={field} type="password" autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} minLength={8} required /></label></>}{message && <p role="status" className="mt-4 text-sm text-emerald-600 dark:text-emerald-300">{message}</p>}{error && <p role="alert" className="mt-4 text-sm text-red-600">{error}</p>}<button disabled={busy} className="mt-7 h-11 w-full rounded-md bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60">{busy ? "Aguarde..." : sent ? "Redefinir senha" : "Enviar código"}</button></form><p className="mt-6 text-center text-sm"><Link to="/login" className="font-semibold text-blue-600 dark:text-blue-300">Voltar para o login</Link></p></section></div></main>
}

export default RecuperarSenha
