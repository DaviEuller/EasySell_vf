
import ChatTemplate from "@/components/smoothui/chat-template";
import NavbarPreset from "@/components/navbar_preset";

export default function Sellia() {
  return (
    <div className="h-dvh overflow-hidden">

      <header className="fixed top-0 left-0 right-0 z-[100]">
        <NavbarPreset />
      </header>

      <main className="h-full pt-[65px]">
        <ChatTemplate />
      </main>

    </div>
  );
}