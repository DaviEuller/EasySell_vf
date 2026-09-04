import { Button } from "@/components/ui/button"
import RotatingText from "@/components/RotatingText"
import VariableProximity from '../../components/ui/Varibleproximity/VariableProximity';
import ScrollExpand from "@/components/ScrollExpand"
import BlurText from "@/components/BlurText";
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
          title="Easy Sell"
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

      

      <section id="como-funciona" className="relative">
        {/* Grid + título "Porque Você pode estar" maiores e centralizados no topo */}
        <div className="relative h-[620px] overflow-hidden bg-gradient-to-b from-black via-black/80 to-transparent px-4 py-6 sm:px-8">
          <BlurText
            text="Sabia que você pode estar perdendo seu dinheiro sem perceber?"
            delay={200}
            animateBy="words"
            direction="top"
            className="absolute left-0 top-6 z-10 max-w-3xl px-6 text-left text-3xl font-bold text-white drop-shadow-[0_0_18px_rgba(59,130,246,0.75)] sm:text-4xl lg:text-5xl"
          />

          <BlurText
            text="Cerca de 60% das micro e pequenas empresas brasileiras encerram as atividades em até cinco anos devido à falta de planejamento e falhas de gestão, conforme dados do Sebrae."
            delay={200}
            animateBy="words"
            direction="top"
            className="absolute left-0 top-[220px] z-10 max-w-5xl px-6 text-left text-base leading-7 text-white/75 sm:text-lg sm:leading-8 lg:text-xl"
          />
          <p className="absolute left-0 top-[350px] z-10 px-6 text-xl font-semibold text-blue-300 drop-shadow-[0_0_14px_rgba(59,130,246,0.8)] sm:text-2xl">
            Você pode ser uma delas.
          </p>
          <span className="absolute left-0 top-[410px] z-10 px-6 text-sm text-white/50">
            Fonte: Sebrae
          </span> 
        </div>

        <div className="mx-auto flex max-w-5xl flex-col gap-12">
          
          <div
            ref={containerRef}
            className="flex w-full justify-center text-center"
            style={{ position: "relative" }}
          >
            
              <VariableProximity
                label={'Porque a EasySell é a melhor opção para sua empresa?'}
                className="text-2xl font-bold leading-tight md:text-3xl lg:text-5xl"
                fromFontVariationSettings="'wght' 400, 'opsz' 9"
                toFontVariationSettings="'wght' 1000, 'opsz' 40"
                containerRef={containerRef}
                radius={100}
                falloff="linear"
              />
          </div>

          

          <div className="grid gap-4 md:grid-cols-3">
            {[
              ["01", "Publique", "Cadastre seu produto em poucos segundos."],
              ["02", "Conecte-se", "Converse diretamente com pessoas interessadas."],
              ["03", "Venda", "Finalize suas vendas com praticidade e segurança."],
            ].map(([number, title, description]) => (
              <SpotlightCard key={number} className="border border-white/10 bg-white/[0.04] p-6" spotlightColor="rgba(0, 229, 255, 0.2)">
                <span className="text-sm text-blue-400">{number}</span>
                <h3 className="mt-12 text-xl font-semibold">{title}</h3>
                <div className="my-4 h-px w-full bg-white/10" />
                <p className="text-sm leading-6 text-white/60">{description}</p>
              </SpotlightCard>
            ))
          }
          </div>
        </div>
      </section>

      <section id="como-funciona" className="relative z-10 mt-24 text-white sm:mt-32">
        <div className="relative overflow-hidden bg-gradient-to-b from-blue-950/35 via-black/20 to-transparent px-4 py-10 text-center sm:px-8 sm:py-14">
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
                </ul>
                <Button className="mt-8 bg-blue-600 hover:bg-blue-500">Escolher plano</Button>
              </div>
            </PixelCard>

            
          
          </div>
        </div>

      </section>  
    </div>
  )
}

export default Home