import { Link } from "react-router-dom"
import { ArrowLeft, Home } from "lucide-react"

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
      <section className="app-panel w-full max-w-xl rounded-md p-8 text-center sm:p-12">
        <p className="text-sm font-semibold tracking-[0.24em] text-blue-600 uppercase dark:text-blue-300">
          Erro 404
        </p>
        <h1 className="mt-5 font-heading text-5xl font-bold sm:text-6xl">
          Página não encontrada
        </h1>
        <p className="mt-5 text-sm leading-6 text-foreground/55">
          O endereço pode estar incorreto ou a página não está mais disponível.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center gap-2 rounded-md border border-border px-5 py-3 text-sm font-semibold transition-colors hover:bg-foreground/[0.05]"
          >
            <ArrowLeft size={17} />
            Voltar
          </button>
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-500"
          >
            <Home size={17} />
            Ir para o início
          </Link>
        </div>
      </section>
    </main>
  )
}
