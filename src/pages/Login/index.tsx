import { useState } from "react"
import type { FormEvent } from "react"
import { useNavigate } from "react-router-dom"
import NavbarPreset from "@/components/navbar_preset"

const inputClassName =
	"mt-2 w-full rounded-md border border-border bg-foreground/[0.06] px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-foreground/30 focus:border-blue-400 focus:bg-foreground/[0.09]"

type ApiRecord = Record<string, unknown>

function isApiRecord(value: unknown): value is ApiRecord {
	return typeof value === "object" && value !== null && !Array.isArray(value)
}

function getUserId(user: ApiRecord): string | undefined {
	for (const key of ["id", "_id", "userId", "user_id"]) {
		const value = user[key]
		if (typeof value === "string" && value.trim()) return value.trim()
		if (typeof value === "number") return String(value)
	}
	return undefined
}

function getResponsibleId(company: ApiRecord): string | undefined {
	for (const key of [
		"responsavelId",
		"responsavel_id",
		"responsavel",
		"responsible",
		"responsibleId",
		"responsible_id",
		"owner",
		"ownerId",
	]) {
		const value = company[key]
		if (typeof value === "string" && value.trim()) return value.trim()
		if (typeof value === "number") return String(value)
		if (isApiRecord(value)) {
			const id = getUserId(value)
			if (id) return id
		}
	}
	return undefined
}

export function Login() {
	const navigate = useNavigate()
	const [email, setEmail] = useState("")
	const [password, setPassword] = useState("")
	const [error, setError] = useState("")
	const [isSubmitting, setIsSubmitting] = useState(false)

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault()

		if (!email.includes("@") || password.length < 6) {
			setError("Digite um e-mail válido e uma senha com pelo menos 6 caracteres.")
			return
		}

		const apiUrl = import.meta.env.VITE_API_URL?.trim().replace(/\/+$/, "")
		if (!apiUrl) {
			setError("A API não está configurada. Defina VITE_API_URL para continuar.")
			return
		}

		sessionStorage.removeItem("easysell:has-company")
		localStorage.removeItem("userId")
		setIsSubmitting(true)
		setError("")

		try {
			const response = await fetch(`${apiUrl}/auth/login`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					email: email.trim(),
					password,
				}),
			})

			if (!response.ok) {
				const responseText = await response.text()
				let message = `Não foi possível entrar (erro ${response.status}).`

				if (responseText) {
					try {
						const body: unknown = JSON.parse(responseText)
						if (typeof body === "object" && body !== null) {
							const errorBody = body as Record<string, unknown>
							if (typeof errorBody.message === "string") {
								message = errorBody.message
							} else if (
								Array.isArray(errorBody.message) &&
								errorBody.message.every((item) => typeof item === "string")
							) {
								message = errorBody.message.join(" ")
							} else if (typeof errorBody.error === "string") {
								message = errorBody.error
							}
						}
					} catch {
						message = responseText
					}
				}

				throw new Error(message)
			}

			const responseText = await response.text()
			let responseBody: unknown = null
			if (responseText) {
				try {
					responseBody = JSON.parse(responseText)
				} catch {
					throw new Error("A resposta da API de login está em um formato inválido.")
				}
			}

			const root = isApiRecord(responseBody) ? responseBody : {}
			const data = isApiRecord(root.data) ? root.data : root
			const user = isApiRecord(data.user) ? data.user : data
			const sub =
				getUserId(user) ??
				(typeof data.sub === "string" && data.sub.trim()
					? data.sub.trim()
					: undefined)
			if (sub) {
				localStorage.setItem("sub", sub)
				localStorage.setItem("userId", sub)
				localStorage.setItem("userEmail", email.trim())
				localStorage.setItem("userName", typeof user.name === "string" ? user.name : "")
			}
			const token =
				typeof data.access_token === "string"
					? data.access_token
					: typeof data.accessToken === "string"
						? data.accessToken
						: typeof data.token === "string"
							? data.token
							: undefined

			let hasCompany = false
			if (sub && token) {
				const companyResponse = await fetch(
					`${apiUrl}/company?responsibleId=${encodeURIComponent(sub)}`,
					{
						headers: token
							? { Authorization: ["Bearer", token].join(" ") }
							: undefined,
					},
				)
				if (!companyResponse.ok && companyResponse.status !== 404) {
					throw new Error(`Não foi possível consultar a empresa (erro ${companyResponse.status}).`)
				}

				if (companyResponse.ok) {
					const companyText = await companyResponse.text()
					let companyBody: unknown = null
					if (companyText) {
						try {
							companyBody = JSON.parse(companyText)
						} catch {
							throw new Error("A resposta da API de empresa está em um formato inválido.")
						}
					}

					const companyRoot = isApiRecord(companyBody) ? companyBody : {}
					const companiesPayload =
						companyRoot.data !== undefined ? companyRoot.data : companyBody
					const companies = Array.isArray(companiesPayload)
						? companiesPayload
						: isApiRecord(companiesPayload)
							? [companiesPayload]
							: []
					hasCompany = companies.some(
						(company) =>
							isApiRecord(company) &&
							getResponsibleId(company) === sub,
					)
				}
			}

			sessionStorage.setItem("easysell:has-company", String(hasCompany))
			navigate(hasCompany ? "/resumo" : "/empresa?mode=create", {
				replace: true,
			})
		} catch (submitError) {
			setError(
				submitError instanceof Error
					? submitError.message
					: "Ocorreu um erro ao entrar. Tente novamente.",
			)
		} finally {
			setIsSubmitting(false)
		}
	}

	return (
		<main className="min-h-screen overflow-hidden bg-background pt-20 text-foreground">
			<NavbarPreset />
			<header className="relative z-10 flex items-center justify-end px-5 py-6 sm:px-10">
				<a href="/" className="text-sm text-foreground/55 transition hover:text-foreground">
					Voltar para a home
				</a>
			</header>

			<div className="relative z-10 mx-auto grid min-h-[calc(100vh-88px)] max-w-5xl items-center gap-12 px-5 pb-12 sm:px-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
				<section className="max-w-md">
					<p className="text-xs font-semibold tracking-[0.24em] text-blue-600 dark:text-blue-300 uppercase">
						Bem-vindo de volta
					</p>
					<h1 className="mt-5 font-heading text-5xl leading-[0.98] font-bold sm:text-6xl">
						Entre e retome o controle.
					</h1>
					<p className="mt-6 leading-7 text-foreground/55">
						Acompanhe seu estoque, financeiro, clientes e equipe em um só lugar.
					</p>
				</section>

				<section className="app-panel rounded-md px-6 py-8 sm:px-10 sm:py-10">
					<p className="text-xs font-semibold tracking-[0.2em] text-blue-600 dark:text-blue-300 uppercase">
						Acessar conta
					</p>
					<h2 className="mt-3 font-heading text-3xl font-bold">Faça seu login.</h2>
					<p className="mt-2 text-sm leading-6 text-foreground/50">
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
								required
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
								minLength={6}
								required
							/>
						</label>
						{error && (
							<p role="alert" className="mt-3 text-sm text-red-600 dark:text-red-300">
								{error}
							</p>
						)}
						<button
							type="submit"
							disabled={isSubmitting}
							className="mt-7 flex h-11 w-full items-center justify-center rounded-md border border-blue-400/30 bg-blue-600 px-5 text-sm font-semibold text-white shadow-lg shadow-blue-950/30 transition-all hover:-translate-y-0.5 hover:bg-blue-500 hover:shadow-blue-900/50 focus-visible:ring-2 focus-visible:ring-blue-300/70 active:translate-y-0"
						>
							{isSubmitting ? "Entrando..." : "Entrar"}
						</button>
					</form>

					<p className="mt-7 text-center text-sm text-foreground/45">
						Ainda não tem uma conta?{" "}
						<a href="/cadastro" className="font-semibold text-blue-600 dark:text-blue-300 hover:text-blue-700 dark:hover:text-blue-200">
							Criar cadastro
						</a>
					</p>
				</section>
			</div>
		</main>
	)
}

export default Login
