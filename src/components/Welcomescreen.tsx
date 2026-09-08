"use client";

import { useEffect, useState } from "react";

type WelcomeScreenProps = {
  name: string;
  onDone: () => void;
  /** tempo em ms antes de avançar automaticamente pro dashboard */
  duration?: number;
};

export default function WelcomeScreen({
  name,
  onDone,
  duration = 2200,
}: WelcomeScreenProps) {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const finish = () => {
    setLeaving(true);
    window.setTimeout(onDone, 350);
  };

  useEffect(() => {
    const showTimer = requestAnimationFrame(() => setVisible(true));
    const leaveTimer = setTimeout(() => setLeaving(true), duration);
    const doneTimer = setTimeout(finish, duration);

    return () => {
      cancelAnimationFrame(showTimer);
      clearTimeout(leaveTimer);
      clearTimeout(doneTimer);
    };
  }, [duration]);

  return (
    <div
      onClick={finish}
      className={`relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#070B14] px-6 text-center transition-opacity duration-400 ${
        leaving ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(37,99,235,0.2),transparent_28%),radial-gradient(circle_at_50%_100%,rgba(14,165,233,0.08),transparent_38%)]" />
      <div className="relative flex flex-col items-center">
      <span
        className={`font-heading text-xl font-bold tracking-tight text-white transition-all duration-500 ${
          visible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
        }`}
      >
        EasySell<span className="text-blue-400">.</span>
      </span>

      <h1
        className={`mt-6 font-heading text-4xl leading-none font-bold text-white transition-all delay-150 duration-500 sm:text-5xl ${
          visible ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
        }`}
      >
        Bem-vindo, {name}
      </h1>

      <p className="mt-4 text-sm text-white/50">Preparando seu painel de controle.</p>

      <div
        className={`mt-8 h-1 overflow-hidden rounded-full bg-white/10 transition-all delay-500 duration-700 ${
          visible ? "w-16" : "w-0"
        }`}
      >
        <div className="h-full w-2/3 rounded-full bg-blue-500" />
      </div>
      </div>
    </div>
  );
}