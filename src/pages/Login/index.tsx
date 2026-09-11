import { useState } from "react"
import type { FormEvent } from "react"
import NavbarPreset from "@/components/navbar_preset"
import { AppDock } from "@/components/Dock"

const inputClassName =
	"mt-2 w-full rounded-xl border border-white/12 bg-white/[0.06] px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-blue-400 focus:bg-white/[0.09]"

export function Login() {
	const [email, setEmail] = useState("")
	const [password, setPassword] = useState("")
	const [error, setError] = useState("")
	const [loggedIn, setLoggedIn] = useState(false)

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault()

		if (!email.includes("@") || password.length < 6) {
			setError("Digite um e-mail válido e uma senha com pelo menos 6 caracteres.")
			return
		}

		setError("")
		setLoggedIn(true)
	}

	if (loggedIn) {
		return (
			<main className="flex min-h-screen items-center justify-center bg-[#070B14] px-4 pt-20 text-white">
				<NavbarPreset />
				<AppDock />
				<section className="app-panel w-full max-w-lg rounded-3xl p-8 text-center sm:p-12">
					<div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/15 text-3xl text-blue-300">
						✓
					</div>
					<p className="mt-7 text-xs font-semibold tracking-[0.24em] text-blue-300 uppercase">
						Acesso realizado
					</p>
					<h1 className="mt-4 font-heading text-4xl font-bold">Bem-vindo de volta.</h1>
					<p className="mt-4 leading-7 text-white/60">
						Seu painel EasySell está pronto para você.
					</p>
					<a
						href="/"
						className="mt-8 inline-flex rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
					>
						Ir para a home
					</a>
				</section>
			</main>
		)
	}

	return (
		<main className="min-h-screen overflow-hidden bg-[#070B14] pt-20 text-white">
			<NavbarPreset />
			<AppDock />
			<div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(37,99,235,0.18),transparent_32%),radial-gradient(circle_at_80%_80%,rgba(14,165,233,0.1),transparent_28%)]" />
			<header className="relative z-10 flex items-center justify-end px-5 py-6 sm:px-10">
				<a href="/" className="text-sm text-white/55 transition hover:text-white">
					Voltar para a home
				</a>
			</header>

			<div className="relative z-10 mx-auto grid min-h-[calc(100vh-88px)] max-w-5xl items-center gap-12 px-5 pb-12 sm:px-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
				<section className="max-w-md">
					<p className="text-xs font-semibold tracking-[0.24em] text-blue-300 uppercase">
						Bem-vindo de volta
					</p>
					<h1 className="mt-5 font-heading text-5xl leading-[0.98] font-bold sm:text-6xl">
						Entre e retome o controle.
					</h1>
					<p className="mt-6 leading-7 text-white/55">
						Acompanhe seu estoque, financeiro, clientes e equipe em um só lugar.
					</p>
				</section>

				<section className="app-panel rounded-3xl px-6 py-8 sm:px-10 sm:py-10">
					<p className="text-xs font-semibold tracking-[0.2em] text-blue-300 uppercase">
						Acessar conta
					</p>
					<h2 className="mt-3 font-heading text-3xl font-bold">Faça seu login.</h2>
					<p className="mt-2 text-sm leading-6 text-white/50">
						Informe seus dados para continuar.
					</p>

					<form className="mt-8" onSubmit={handleSubmit}>
						<label className="block text-sm font-medium">
							E-mail
							<input
								className={inputClassName}
								type="email"
								value={email}
								onChange={(event) => setEmail(event.target.value)}
								placeholder="voce@empresa.com"
								autoComplete="email"
							/>
						</label>
						<label className="mt-5 block text-sm font-medium">
							Senha
							<input
								className={inputClassName}
								type="password"
								value={password}
								onChange={(event) => setPassword(event.target.value)}
								placeholder="Digite sua senha"
								autoComplete="current-password"
							/>
						</label>
						{error && <p className="mt-3 text-sm text-red-300">{error}</p>}
						<button
							type="submit"
							onClick={() => (window.location.href = '/resumo')}
							className="mt-7 flex h-11 w-full items-center justify-center rounded-xl border border-blue-400/30 bg-blue-600 px-5 text-sm font-semibold text-white shadow-lg shadow-blue-950/30 transition-all hover:-translate-y-0.5 hover:bg-blue-500 hover:shadow-blue-900/50 focus-visible:ring-2 focus-visible:ring-blue-300/70 active:translate-y-0"
						>
							Entrar
						</button>
					</form>

					<p className="mt-7 text-center text-sm text-white/45">
						Ainda não tem uma conta?{" "}
						<a href="/cadastro" className="font-semibold text-blue-300 hover:text-blue-200">
							Criar cadastro
						</a>
					</p>
				</section>
			</div>
		</main>
	)
}

export default Login
