import { Button } from "@/components/ui/button"
import RotatingText from "@/components/RotatingText"
import VariableProximity from '../../components/ui/Varibleproximity/VariableProximity';
import ScrollExpand from "@/components/ScrollExpand"
import BlurText from "@/components/BlurText";
import TextType from "@/components/TextType/TextType";
import CRTWarp from '@/components/CrtWarp/CrtWarp';
import SpotlightCard from "@/components/Spotlight Card/SpotlightCard"
import heroBg from "@/assets/hero-bg.svg"
import { useRef } from 'react';
import PixelCard from '@/components/PixelCard';



import NavbarPreset from "@/components/navbar_preset"

export function Home() {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div className="relative bg-black">

      
      <NavbarPreset />
      {/* Background rays — visible around the frame before it expands to fullscreen */}
      

      {/* CRTWarp como background fixo cobrindo o site inteiro — opacidade reduzida para não competir com o conteúdo */}
      <div className="pointer-events-none fixed inset-0 z-0 opacity-30" style={{ width: '100%', height: '100%' }}>
        <CRTWarp
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

      <div id="inicio">
        
        <ScrollExpand
          src={heroBg}
          mediaType="image"
          alt="EasySell"
          title={
            <span>
              Bem-vindo à{' '}
              <TextType
                text="EasySell"
                as="span"
                typingSpeed={280}
                initialDelay={500}
                pauseDuration={1800}
                loop
                textColors={["#60a5fa"]}
                cursorClassName="text-blue-400"
                startOnVisible={false}
              />
            </span>
          }
          scrollHint="role para continuar"
          useWindowScroll
          startWidth={40}
          startHeight={56}
          startRadius={28}
          endRadius={0}
          mediaZoom={1.3}
          scrollDistance={1.2}
          holdDistance={0.4}
          overlayScrim={0.65}
          
        >
          

        <div className="flex max-w-xl flex-col items-center gap-6 px-6">
          <span className="rounded-full border border-blue-400/30 bg-blue-500/10 px-4 py-1 text-xs tracking-[0.2em] text-blue-300 uppercase">
            EasySell  
          </span>

          



          <h2 className="flex flex-wrap items-center justify-center gap-2 text-3xl font-bold text-white sm:text-4xl">
            Vender ficou
            <RotatingText
              texts={["fácil.", "rápido.", "seguro.", "prático."]}
              mainClassName="rounded-lg bg-blue-500 px-3 py-1 text-white"
              staggerFrom="last"
              staggerDuration={0.02}
              rotationInterval={2200}
              splitBy="characters"
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
            />
          </h2>

          <p className="text-base text-white/70 sm:text-lg">
            A EasySell conecta quem quer vender a quem quer comprar, tudo em
            poucos toques. Simples assim.
          </p>

          <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
            <Button id="comecar" size="lg" className="bg-blue-600 hover:bg-blue-500">
              Começar agora
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/20 text-white"
              onClick={() => document.getElementById("como-funciona")?.scrollIntoView({ behavior: "smooth" })}
            >
              Saiba mais
            </Button>
          </div>
        </div>
        </ScrollExpand>
      </div>

      

      <section  className="relative">
        <div className="relative overflow-hidden border-y border-white/10 bg-[radial-gradient(circle_at_12%_35%,rgba(37,99,235,0.22),transparent_34%),linear-gradient(115deg,#030712_0%,#07152f_48%,#020617_100%)] px-4 py-16 sm:px-8 sm:py-20 lg:py-24">
          <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.2fr_0.8fr] lg:gap-20">
            <div className="relative pl-5 sm:pl-8">
              <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-blue-400 to-transparent" />
              <span className="text-xs font-semibold tracking-[0.24em] text-blue-300 uppercase">
                Um alerta para o seu negócio
              </span>
              <BlurText
                text="Você sabia que pode estar perdendo dinheiro sem perceber?"
                delay={200}
                animateBy="words"
                direction="top"
                className="mt-5 max-w-3xl text-4xl font-bold leading-[1.05] text-white sm:text-5xl lg:text-6xl"
              />
              <BlurText
                text="Cerca de 60% das micro e pequenas empresas brasileiras encerram as atividades em até cinco anos devido à falta de planejamento e falhas de gestão."
                delay={200}
                animateBy="words"
                direction="top"
                className="mt-6 max-w-2xl text-base leading-7 text-white/65 sm:text-lg sm:leading-8"
              />
            </div>

            <div className="rounded-2xl p-7 backdrop-blur-sm sm:p-9">
              <span className="text-sm font-medium text-blue-200">Um dado para ficar de olho</span>
              <div className="mt-4 flex items-end gap-3">
                <span className="font-heading text-7xl leading-none font-bold tracking-tight text-white sm:text-8xl">
                  60<span className="text-blue-400">%</span>
                </span>
                <span className="mb-2 max-w-32 text-sm leading-5 text-white/55">
                  das empresas não chegam ao quinto ano
                </span>
              </div>
              <p className="mt-6 text-lg font-semibold text-blue-200 sm:text-xl">
                Você pode ser uma delas.
              </p>
              <span className="mt-3 block text-xs text-white/40">
                Fonte: Sebrae
              </span>
            </div>
          </div>
        </div>

        <div className="mx-auto flex max-w-6xl flex-col gap-12 px-4 pb-20 pt-24 sm:px-8 sm:pb-28 sm:pt-32">
          <div
            ref={containerRef}
            className="flex w-full flex-col items-center justify-center text-center"
            style={{ position: "relative" }}
          >
            <span className="mb-5 text-xs font-semibold tracking-[0.24em] text-blue-300 uppercase">
              Venda com mais liberdade
            </span>
              <VariableProximity
                label={'Porque a EasySell é a melhor opção para sua empresa?'}
                className="max-w-3xl text-3xl font-bold leading-tight text-white md:text-4xl lg:text-5xl"
                fromFontVariationSettings="'wght' 400, 'opsz' 9"
                toFontVariationSettings="'wght' 1000, 'opsz' 40"
                containerRef={containerRef}
                radius={100}
                falloff="linear"
              />
          </div>

          

          <div className="grid gap-5 md:grid-cols-3">
            {[
              ["01", "Criação rápida", "Cadastre seu produto em poucos segundos."],
              ["02", "Comunicação", "Converse diretamente com pessoas interessadas."],
              ["03", "Venda", "Finalize suas vendas com praticidade e segurança."],
              ["04", "Gerencie", "Controle todas as suas vendas em um só lugar."],
              ["05", "Otimize", "Aumente suas vendas com estratégias eficazes."],
              ["06", "Chat", "Converse com seus clientes em tempo real."],
              ["07", "Bot de WhatsApp", "Automatize sua comunicação com bots."],
              ["08", "Selo de Easy Partner", "Destaque sua empresa como parceira confiável."],
              ["09", "Sistemas de equipes", "Gerencie sua equipe inteira em um só lugar."],
            ].map(([number, title, description]) => (
              <SpotlightCard key={number} className="group border border-white/10 bg-white/[0.045] p-7 transition-colors duration-300 hover:border-blue-400/40 hover:bg-blue-950/30" spotlightColor="rgba(0, 229, 255, 0.16)">
                <div className="flex items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full border border-blue-400/30 bg-blue-500/10 text-sm font-semibold text-blue-300">
                    {number}
                  </span>
                  <span className="h-px w-12 bg-gradient-to-r from-blue-400/60 to-transparent" />
                </div>
                <h3 className="mt-8 text-xl font-semibold text-white">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-white/60">{description}</p>
              </SpotlightCard>
            ))
          }
          </div>
        </div>
      </section>

      

      <section id="planos" className="relative z-10 mt-24 text-white sm:mt-32">
        <div className="relative overflow-hidden bg-black px-4 py-10 text-center sm:px-8 sm:py-14">
          <h2 className="text-3xl font-bold text-white md:text-4xl lg:text-5xl">
            Planos
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-white/60">
            Escolha o plano ideal para começar a vender com a EasySell.
          </p>

          <div className="mx-auto mt-12 grid max-w-6xl gap-6 md:grid-cols-2">
            <PixelCard variant="default" className="mx-auto w-full max-w-[360px] [--pixel-card-background:rgba(3,7,18,0.92)]">
              <div className="relative z-10 flex w-full flex-col items-center px-6 text-center">
                <h3 className="text-2xl font-bold">Grátis</h3>
                <p className="mt-3 text-4xl font-bold">R$ 0</p>
                <p className="mt-1 text-sm text-white/60">para começar</p>
                <ul className="mt-6 space-y-2 text-sm text-white/75">
                  <li>Até 5 anúncios ativos</li>
                  <li>Perfil de vendedor</li> 
                  <li>Chat com compradores</li>
                </ul>
                <Button className="mt-8 bg-blue-600 hover:bg-blue-500">Começar grátis</Button>
              </div>
            </PixelCard>

            <PixelCard variant="blue" className="mx-auto w-full max-w-[360px] [--pixel-card-background:rgb(3, 7, 18)]">
              <div className="relative z-10 flex w-full flex-col items-center px-6 text-center">
                <span className="mb-2 rounded-full bg-blue-500/20 px-3 py-1 text-xs font-semibold text-blue-300">Mais escolhido</span>
                <h3 className="text-2xl font-bold">Profissional</h3>
                <p className="mt-3 text-4xl font-bold">R$ 49,90</p>
                <p className="mt-1 text-sm text-white/60">por mês</p>
                <ul className="mt-6 space-y-2 text-sm text-white/75">
                  <li>Anúncios ilimitados</li>
                  <li>Mais destaque nos resultados</li>
                  <li>Relatórios de vendas</li>
                  <li>Bot de whatsapp</li>
                  <li>Selo de Easy partner</li>
                  <li>Sistema de funcionarios Completo</li>
                </ul>
                <Button className="mt-8 bg-blue-600 hover:bg-blue-500">Escolher plano</Button>
              </div>
            </PixelCard>

            
          
          </div>
        </div>

      </section> 


      <section id="comecar" className="relative bg-background px-4 py-20 text-center  sm:px-8 sm:py-28">
        <div className="relative mx-auto max-w-3xl">
          <span className="text-xs font-semibold tracking-[0.28em] text-emerald-300 uppercase">
            Seu próximo passo começa aqui
          </span>
          <h2 className="mt-5 text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
            Venha facilitar sua empresa{' '}
            <span className="bg-gradient-to-r from-emerald-300 via-green-400 to-lime-300 bg-clip-text text-transparent">
              com a gente.
            </span>
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-white/65 sm:text-lg">
            Tenha as ferramentas certas para vender melhor, organizar sua operação e crescer com mais tranquilidade.
          </p>
          <Button
            size="lg"
            className="mt-8 bg-gradient-to-r from-emerald-500 to-green-500 px-7 text-white shadow-[0_0_28px_rgba(16,185,129,0.28)] hover:from-emerald-400 hover:to-lime-400"
            onClick={() => document.getElementById("planos")?.scrollIntoView({ behavior: "smooth" })}
          >
            Comece agora
          </Button>
        </div>
      </section> 
    </div>
  )
}

export default Home