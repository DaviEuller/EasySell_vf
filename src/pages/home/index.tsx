import { Button } from "@/components/ui/button"
import LightRays from "@/components/LightRays"
import RotatingText from "@/components/RotatingText"
import ScrollExpand from "@/components/ScrollExpand"
import heroBg from "@/assets/hero-bg.svg"

export function Home() {
  return (
    <div className="relative bg-black">
      {/* Background rays — visible around the frame before it expands to fullscreen */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <LightRays
          raysOrigin="top-center"
          raysColor="#3b82f6"
          raysSpeed={1.1}
          lightSpread={0.75}
          rayLength={1.6}
          fadeDistance={1.1}
          saturation={1}
          pulsating
          followMouse
          mouseInfluence={0.12}
          noiseAmount={0.06}
          distortion={0.05}
          className="opacity-80"
        />
      </div>

      <ScrollExpand
        src={heroBg}
        mediaType="image"
        alt="EasySell"
        title="EasySell"
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
        className="relative z-10"
      >
        <div className="flex max-w-xl flex-col items-center gap-6 px-6">
          <span className="rounded-full border border-blue-400/30 bg-blue-500/10 px-4 py-1 text-xs tracking-[0.2em] text-blue-300 uppercase">
            EasySell
          </span>

          <h2 className="flex flex-wrap items-center justify-center gap-2 text-3xl font-bold text-white sm:text-4xl">
            Vender ficou
            <RotatingText
              texts={["fácil.", "rápido.", "seguro.", "sem complicação."]}
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
            <Button size="lg" className="bg-blue-600 hover:bg-blue-500">
              Começar agora
            </Button>
            <Button size="lg" variant="outline" className="border-white/20 text-white">
              Saiba mais
            </Button>
          </div>
        </div>
        
      </ScrollExpand>
    </div>
  )
}

export default Home
