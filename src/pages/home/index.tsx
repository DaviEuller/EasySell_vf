import { useState } from "react"
import { Button } from "@/components/ui/button"
import CrtWarp from "@/components/CrtWarp/CrtWarp"
import BorderGlow from "@/components/BorderGlow"
import SpotlightCard from "@/components/Spotlight Card/SpotlightCard"
import RotatingText from "@/components/RotatingText"
import SplitText from "@/components/SplitText"
import TiltedCard from "@/components/TiltedCard"
import heroBg from "@/assets/hero-bg.svg"

const coreFeatures = [
  ["01", "Estoque", "Controle tudo em tempo real, sem contar na mao."],
  ["02", "Financeiro", "Fluxo de caixa, contas a pagar e receber organizados."],
  ["03", "CRM", "Historico de compras e relacionamento em um so lugar."],
  [
    "04",
    "Funcionarios",
    "Permissoes, escalas e equipe sob controle dentro da EasySell.",
  ],
]

const faqs = [
  [
    "Preciso saber usar sistema pra usar a EasySell?",
    "Nao. A EasySell foi feita para ser simples desde o primeiro cadastro, mesmo para quem nunca usou um sistema de gestao.",
  ],
  [
    "O que e o Easy Market e como funciona?",
    "E o marketplace integrado da EasySell. Voce anuncia seus produtos e alcanca novos compradores sem sair da plataforma.",
  ],
  [
    "Qual a diferenca entre Funcionarios e Easy Crew?",
    "Funcionarios gerencia quem ja faz parte da sua empresa. Easy Crew ajuda voce a encontrar e contratar novos talentos.",
  ],
  [
    "Meus dados financeiros e de estoque ficam seguros?",
    "Sim. Seus dados ficam protegidos em uma plataforma com acesso controlado por usuario e permissao.",
  ],
  [
    "Da pra usar no celular ou so no computador?",
    "A EasySell funciona no navegador, em qualquer dispositivo conectado a internet.",
  ],
  [
    "Posso cancelar o plano quando quiser?",
    "Sim. Nao existe fidelidade e voce pode cancelar quando quiser.",
  ],
]

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })
}

export function Home() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <div className="min-h-screen overflow-hidden bg-[#070B14] text-white">
      <div className="pointer-events-none fixed inset-0 z-0 opacity-25">
        <CrtWarp
          color="#3b82f6"
          backgroundColor="#05010a"
          speed={0.5}
          curvature={0.25}
          scanlineStrength={0.25}
          scanlineFrequency={200}
          waveAmplitude={0.3}
          waveFrequency={2.5}
          bloom={1}
          bloomRadius={1}
          noise={0.08}
          vignette={0}
          brightness={0.8}
          pixelation={1}
          rgbShift={0.015}
          mouseReact
          mouseStrength={0.5}
          dpr={1}
          fps={30}
          paused={false}
        />
      </div>
      <header className="fixed inset-x-0 top-0 z-50 px-4 pt-5 sm:px-6">
        <div className="mx-auto max-w-6xl rounded-2xl border border-white/15 bg-[#060A12]/80 shadow-2xl shadow-black/30 backdrop-blur-xl">
          <div className="flex items-center justify-between px-4 py-3 sm:px-6">
            <a
              href="#inicio"
              className="font-heading text-lg font-bold tracking-tight"
            >
              EasySell<span className="text-blue-400">.</span>
            </a>
            <nav className="hidden items-center gap-6 text-sm text-white/60 md:flex">
              <a
                href="#como-funciona"
                className="transition-colors hover:text-white"
              >
                Como funciona
              </a>
              <a
                href="#solucoes"
                className="transition-colors hover:text-white"
              >
                Solucoes
              </a>
              <a href="#planos" className="transition-colors hover:text-white">
                Planos
              </a>
              <a href="#faq" className="transition-colors hover:text-white">
                FAQ
              </a>
            </nav>
            <div className="flex items-center gap-2">
              <a
                href="#entrar"
                className="hidden px-3 py-2 text-sm text-white/70 hover:text-white sm:block"
              >
                Entrar
              </a>
              <Button
                onClick={() => scrollTo("planos")}
                className="bg-blue-600 text-white hover:bg-blue-500"
              >
                Comecar gratis
              </Button>
            </div>
          </div>
        </div>
      </header>
      <main className="relative z-10">
        <section
          id="inicio"
          className="mx-auto flex min-h-[760px] max-w-6xl items-center px-4 pt-40 pb-24 sm:px-8 lg:min-h-[820px]"
        >
          <div className="max-w-4xl animate-[fade-in_0.8s_ease-out]">
            <span className="inline-flex rounded-full border border-blue-400/30 bg-blue-500/10 px-4 py-2 text-xs font-semibold tracking-[0.2em] text-blue-300 uppercase">
              EASYSELL · TUDO PRA GERENCIAR SUA EMPRESA
            </span>
            <h1 className="mt-7 max-w-4xl font-heading text-5xl leading-[0.98] font-bold tracking-tight sm:text-7xl lg:text-8xl">
              Estoque, financeiro, clientes e equipe. Tudo fica{" "}
              <RotatingText
                texts={["pratico.", "rapido.", "simples."]}
                mainClassName="inline-flex overflow-hidden rounded-lg bg-blue-500/15 px-3 py-1 text-blue-400"
                rotationInterval={2200}
                staggerDuration={0.03}
                staggerFrom="last"
                splitBy="characters"
              />
            </h1>
            <p className="mt-7 max-w-2xl text-base leading-7 text-white/60 sm:text-lg sm:leading-8">
              A EasySell reune controle de estoque, financeiro, CRM e gestao de
              funcionarios, com o Easy Market pra vender mais e o Easy Crew pra
              encontrar as pessoas certas.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Button
                size="lg"
                onClick={() => scrollTo("planos")}
                className="bg-blue-600 px-6 text-white hover:bg-blue-500"
              >
                Comecar gratis
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => scrollTo("como-funciona")}
                className="border-white/20 bg-transparent px-6 text-white hover:bg-white/10 hover:text-white"
              >
                Ver como funciona
              </Button>
            </div>
            <p className="mt-7 text-sm text-white/40">
              +X microempresas ja usam a EasySell
            </p>
          </div>
        </section>
        <section className="border-y border-white/10 bg-[#0B1120] px-4 py-20 sm:px-8 sm:py-28">
          <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="border-l border-blue-400 pl-5 sm:pl-8">
              <span className="text-xs font-semibold tracking-[0.24em] text-blue-300 uppercase">
                Um alerta para o seu negocio
              </span>
              <SplitText
                text="Voce sabia que pode estar perdendo dinheiro sem perceber?"
                tag="h2"
                splitType="words"
                className="mt-5 max-w-3xl font-heading text-4xl leading-tight font-bold sm:text-6xl"
                textAlign="left"
              />
              <p className="mt-6 max-w-2xl text-base leading-7 text-white/60 sm:text-lg">
                Cerca de 60% das micro e pequenas empresas brasileiras encerram
                as atividades em ate cinco anos, muitas vezes por falta de
                controle de estoque, fluxo de caixa desorganizado e processos
                manuais.
              </p>
            </div>
            <div className="border border-white/10 bg-[#0E1426]/70 p-7 backdrop-blur-sm sm:p-9">
              <span className="text-sm text-blue-200">
                Um dado para ficar de olho
              </span>
              <div className="mt-4 flex items-end gap-3">
                <strong className="font-heading text-8xl leading-none">
                  60<span className="text-blue-400">%</span>
                </strong>
                <span className="mb-2 max-w-32 text-sm leading-5 text-white/50">
                  das empresas nao chegam ao quinto ano
                </span>
              </div>
              <p className="mt-6 text-lg font-semibold text-blue-200">
                A EasySell existe pra resolver isso.
              </p>
              <span className="mt-3 block text-xs text-white/40">
                Fonte: Sebrae
              </span>
            </div>
          </div>
        </section>
        <section
          id="como-funciona"
          className="mx-auto max-w-6xl px-4 py-24 sm:px-8 sm:py-32"
        >
          <div className="max-w-2xl">
            <span className="text-xs font-semibold tracking-[0.24em] text-blue-300 uppercase">
              Como funciona
            </span>
            <SplitText
              text="Sua empresa organizada em 3 passos."
              tag="h2"
              splitType="words"
              className="mt-4 font-heading text-4xl font-bold sm:text-6xl"
              textAlign="left"
            />
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {[
              [
                "01",
                "Cadastre",
                "Produtos, estoque e sua equipe em poucos minutos.",
              ],
              [
                "02",
                "Opere",
                "Registre vendas, controle o financeiro e acompanhe clientes pelo CRM.",
              ],
              [
                "03",
                "Cresca",
                "Venda mais no Easy Market e contrate pelo Easy Crew.",
              ],
            ].map(([number, title, description]) => (
              <SpotlightCard
                key={number}
                className="border border-white/10 bg-white/[0.045] p-7"
                spotlightColor="rgba(59, 130, 246, 0.18)"
              >
                <span className="text-sm font-semibold text-blue-300">
                  {number}
                </span>
                <SplitText
                  text={title}
                  tag="h3"
                  splitType="words"
                  className="mt-12 font-heading text-2xl font-semibold"
                  textAlign="left"
                />
                <p className="mt-3 leading-7 text-white/55">{description}</p>
              </SpotlightCard>
            ))}
          </div>
          <Button
            onClick={() => scrollTo("planos")}
            className="mt-8 bg-blue-600 hover:bg-blue-500"
          >
            Quero organizar minha empresa
          </Button>
        </section>
        <section
          id="solucoes"
          className="border-y border-white/10 bg-[#0B1120] px-4 py-24 sm:px-8 sm:py-32"
        >
          <div className="mx-auto max-w-6xl">
            <span className="text-xs font-semibold tracking-[0.24em] text-blue-300 uppercase">
              O core da sua gestao
            </span>
            <SplitText
              text="Tudo que sua operacao precisa, conectado."
              tag="h2"
              splitType="words"
              className="mt-4 max-w-3xl font-heading text-4xl font-bold sm:text-6xl"
              textAlign="left"
            />
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {coreFeatures.map(([number, title, description]) => (
                <SpotlightCard
                  key={number}
                  className="border border-white/10 bg-[#0E1426] p-6"
                  spotlightColor="rgba(59, 130, 246, 0.18)"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full border border-blue-400/30 bg-blue-500/10 text-sm text-blue-300">
                    {number}
                  </span>
                  <SplitText
                    text={title}
                    tag="h3"
                    splitType="words"
                    className="mt-8 font-heading text-xl font-semibold"
                    textAlign="left"
                  />
                  <p className="mt-3 text-sm leading-6 text-white/55">
                    {description}
                  </p>
                </SpotlightCard>
              ))}
            </div>
            <p className="mt-6 text-sm text-white/45">
              Ja tem equipe? Gerencie aqui. Precisa contratar? Conheca o{" "}
              <a href="#easy-crew" className="text-amber-300 hover:underline">
                Easy Crew
              </a>
              .
            </p>
          </div>
        </section>
        <section
          id="easy-crew"
          className="mx-auto grid max-w-6xl gap-5 px-4 py-24 sm:px-8 lg:grid-cols-2"
        >
          <SpotlightCard
            className="border border-violet-400/25 bg-violet-500/[0.08] p-8 sm:p-12"
            spotlightColor="rgba(139, 92, 246, 0.22)"
          >
            <span className="text-xs font-semibold tracking-[0.24em] text-violet-300">
              EASY MARKET
            </span>
            <SplitText
              text="Venda tambem para novos clientes, direto pela EasySell."
              tag="h2"
              splitType="words"
              className="mt-5 font-heading text-3xl font-bold sm:text-4xl"
              textAlign="left"
            />
            <p className="mt-5 leading-7 text-white/60">
              Anuncie seus produtos no marketplace integrado e alcance novos
              compradores sem sair da plataforma.
            </p>
            <Button className="mt-8 bg-violet-600 text-white hover:bg-violet-500">
              Conhecer o Easy Market
            </Button>
          </SpotlightCard>
          <SpotlightCard
            className="border border-amber-400/25 bg-amber-500/[0.08] p-8 sm:p-12"
            spotlightColor="rgba(245, 158, 11, 0.2)"
          >
            <span className="text-xs font-semibold tracking-[0.24em] text-amber-300">
              EASY CREW
            </span>
            <SplitText
              text="Encontre as pessoas certas para o seu time."
              tag="h2"
              splitType="words"
              className="mt-5 font-heading text-3xl font-bold sm:text-4xl"
              textAlign="left"
            />
            <p className="mt-5 leading-7 text-white/60">
              Publique vagas, receba candidaturas e contrate. Depois, gerencie
              sua equipe na aba Funcionarios.
            </p>
            <Button className="mt-8 bg-amber-500 text-black hover:bg-amber-400">
              Conhecer o Easy Crew
            </Button>
          </SpotlightCard>
        </section>
        <section className="border-y border-white/10 bg-[#0B1120] px-4 py-24 text-center sm:px-8">
          <span className="text-xs font-semibold tracking-[0.24em] text-blue-300 uppercase">
            Quem ja gerencia com a EasySell
          </span>
          <SplitText
            text="Menos improviso. Mais negocio."
            tag="h2"
            splitType="words"
            className="mx-auto mt-4 max-w-3xl font-heading text-4xl font-bold sm:text-5xl"
          />
          <div className="mx-auto mt-12 grid max-w-6xl gap-5 text-left md:grid-cols-3">
            {[
              [
                "Estoque e financeiro",
                "Agora eu sei exatamente o que entra, o que sai e onde minha empresa pode crescer.",
              ],
              [
                "Easy Market",
                "Colocar meus produtos no marketplace abriu uma porta para clientes que eu ainda nao alcancava.",
              ],
              [
                "Easy Crew",
                "Encontrei uma pessoa excelente para o time e continuo gerenciando tudo no mesmo lugar.",
              ],
            ].map(([title, quote]) => (
              <BorderGlow
                key={title}
                className="min-h-[220px] rounded-[10px] bg-[#070A12] p-7"
                backgroundColor="#070A12"
                borderRadius={10}
                glowColor="210 90 65"
                glowRadius={24}
                glowIntensity={0.7}
              >
                <span className="text-sm text-blue-300">{title}</span>
                <p className="mt-6 text-lg leading-7 text-white/80">
                  &quot;{quote}&quot;
                </p>
                <p className="mt-6 text-sm text-white/40">Cliente EasySell</p>
              </BorderGlow>
            ))}
          </div>
        </section>
        <section
          id="planos"
          className="mx-auto max-w-6xl px-4 py-24 sm:px-8 sm:py-32"
        >
          <div className="text-center">
            <span className="text-xs font-semibold tracking-[0.24em] text-blue-300 uppercase">
              Planos
            </span>
            <SplitText
              text="Comece no seu ritmo."
              tag="h2"
              splitType="words"
              className="mt-4 font-heading text-4xl font-bold sm:text-6xl"
            />
          </div>
          <div className="mx-auto mt-12 grid w-full max-w-6xl items-stretch gap-14 md:grid-cols-2 lg:gap-20">
            <TiltedCard
              imageSrc={heroBg}
              altText="Fundo azul da EasySell"
              captionText="Plano Gratis"
              containerHeight="520px"
              containerWidth="100%"
              imageHeight="100%"
              imageWidth="100%"
              showImage={false}
              rotateAmplitude={7}
              scaleOnHover={1.03}
              showMobileWarning={false}
              displayOverlayContent
              overlayContent={
                <div className="h-full w-full rounded-[10px] bg-[#03050A]/98">
                  <Plan
                    title="Gratis"
                    description="Pra quem esta comecando a organizar o negocio."
                    price="R$ 0"
                    features={[
                      "Ate 5 produtos cadastrados",
                      "Controle basico de estoque",
                      "Perfil no Easy Market",
                      "1 usuario",
                    ]}
                  />
                </div>
              }
            />
            <TiltedCard
              imageSrc={heroBg}
              altText="Fundo azul da EasySell"
              captionText="Plano Profissional"
              containerHeight="520px"
              containerWidth="100%"
              imageHeight="100%"
              imageWidth="100%"
              showImage={false}
              rotateAmplitude={7}
              scaleOnHover={1.03}
              showMobileWarning={false}
              displayOverlayContent
              overlayContent={
                <div className="h-full w-full rounded-[10px] bg-[#03050A]/98">
                  <Plan
                    title="Profissional"
                    description="Pra quem vende todo dia e precisa de controle total."
                    price="R$ 49,90"
                    features={[
                      "Estoque e produtos ilimitados",
                      "Financeiro e CRM completos",
                      "Funcionarios com permissoes ilimitadas",
                      "Destaque no Easy Market",
                      "Acesso ao Easy Crew",
                      "Bot de WhatsApp + selo Easy Partner",
                    ]}
                    featured
                  />
                </div>
              }
            />
          </div>
          <p className="mt-8 text-center text-sm text-white/45">
            Cancele quando quiser · Sem fidelidade · 7 dias de garantia
          </p>
        </section>
        <section
          id="faq"
          className="border-y border-white/10 bg-[#0B1120] px-4 py-24 sm:px-8"
        >
          <div className="mx-auto max-w-4xl">
            <span className="text-xs font-semibold tracking-[0.24em] text-blue-300 uppercase">
              FAQ
            </span>
            <SplitText
              text="Perguntas frequentes."
              tag="h2"
              splitType="words"
              className="mt-4 font-heading text-4xl font-bold sm:text-6xl"
              textAlign="left"
            />
            <div className="mt-10 border-t border-white/10">
              {faqs.map(([question, answer], index) => (
                <div key={question} className="border-b border-white/10">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    className="flex w-full items-center justify-between gap-5 py-5 text-left text-base font-semibold text-white"
                  >
                    <span>{question}</span>
                    <span className="text-2xl font-normal text-blue-300">
                      {openFaq === index ? "-" : "+"}
                    </span>
                  </button>
                  {openFaq === index && (
                    <p className="max-w-3xl pb-5 leading-7 text-white/55">
                      {answer}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
        <section
          id="comecar"
          className="px-4 py-24 text-center sm:px-8 sm:py-32"
        >
          <div className="mx-auto max-w-3xl">
            <span className="text-xs font-semibold tracking-[0.28em] text-blue-300 uppercase">
              Seu proximo passo comeca aqui
            </span>
            <SplitText
              text="Venha facilitar sua empresa com a gente."
              tag="h2"
              splitType="words"
              className="mt-5 font-heading text-4xl leading-tight font-bold sm:text-6xl"
            />
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-7 text-white/60">
              Tenha as ferramentas certas para vender melhor, organizar sua
              operacao e crescer com mais tranquilidade.
            </p>
            <Button
              size="lg"
              onClick={() => scrollTo("planos")}
              className="mt-8 bg-blue-600 px-7 text-white shadow-[0_0_28px_rgba(59,130,246,0.28)] hover:bg-blue-500"
            >
              Comecar gratis
            </Button>
          </div>
        </section>
      </main>
      <footer className="relative z-10 border-t border-white/10 bg-[#060A12] px-4 py-12 sm:px-8">
        <div className="mx-auto grid max-w-6xl gap-10 sm:grid-cols-3">
          <div>
            <span className="font-heading text-xl font-bold">
              EasySell<span className="text-blue-400">.</span>
            </span>
            <p className="mt-3 max-w-xs text-sm leading-6 text-white/45">
              Tudo para gerenciar sua empresa em um so lugar.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Produtos</h3>
            <div className="mt-4 flex flex-col gap-2 text-sm text-white/50">
              <a href="#solucoes" className="hover:text-white">
                EasySell
              </a>
              <a href="#solucoes" className="hover:text-violet-300">
                Easy Market
              </a>
              <a href="#easy-crew" className="hover:text-amber-300">
                Easy Crew
              </a>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Empresa</h3>
            <div className="mt-4 flex flex-col gap-2 text-sm text-white/50">
              <a href="#como-funciona" className="hover:text-white">
                Como funciona
              </a>
              <a href="#planos" className="hover:text-white">
                Planos
              </a>
              <a href="#faq" className="hover:text-white">
                FAQ
              </a>
              <a href="#comecar" className="hover:text-white">
                Contato
              </a>
            </div>
          </div>
        </div>
        <div className="mx-auto mt-10 flex max-w-6xl flex-wrap gap-4 border-t border-white/10 pt-6 text-xs text-white/35">
          <span>© 2026 EasySell</span>
          <span>CNPJ: em breve</span>
          <span>Politica de Privacidade</span>
          <span>Termos de Uso</span>
        </div>
      </footer>
    </div>
  )
}

function Plan({
  title,
  description,
  price,
  features,
  featured = false,
}: {
  title: string
  description: string
  price: string
  features: string[]
  featured?: boolean
}) {
  return (
    <div className="relative z-10 flex h-full min-h-[460px] flex-col px-6 py-7">
      <div className="flex items-center justify-between">
        <SplitText
          text={title}
          tag="h3"
          splitType="words"
          className="font-heading text-2xl font-bold"
          textAlign="left"
        />
        {featured && (
          <span className="rounded-full bg-blue-500/20 px-3 py-1 text-xs font-semibold text-blue-300">
            Mais escolhido
          </span>
        )}
      </div>
      <p className="mt-3 text-sm leading-6 text-white/55">{description}</p>
      <p className="mt-7 font-heading text-4xl font-bold">
        {price}
        <span className="text-sm font-normal text-white/45">
          {price !== "R$ 0" && "/mes"}
        </span>
      </p>
      <ul className="mt-7 space-y-3 text-sm text-white/70">
        {features.map((feature) => (
          <li key={feature} className="flex gap-2">
            <span className="text-green-400">+</span>
            {feature}
          </li>
        ))}
      </ul>
      <Button
        onClick={() => scrollTo("comecar")}
        className="mt-auto bg-blue-600 text-white hover:bg-blue-500"
      >
        {featured ? "Escolher plano" : "Comecar gratis"}
      </Button>
    </div>
  )
}

export default Home
