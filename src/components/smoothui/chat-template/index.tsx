"use client"

import { cn } from "@/lib/utils"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { useCallback, useEffect, useState } from "react"
import { type ChatConversation, type ChatTurn } from "./chat-data"
import ChatSidebar from "./chat-sidebar"
import ChatThread from "./chat-thread"

const NEW_CHAT_ID = "__new__"

/** No overshoot: a drawer that bounces past its edge reads as a bug. */
const DRAWER_SPRING = { bounce: 0, duration: 0.3, type: "spring" as const }
const SCRIM_FADE = { duration: 0.2 }

function apiBaseUrl() {
  const value = import.meta.env.VITE_API_URL?.trim().replace(/\/+$/, "")
  if (!value)
    throw new Error("A API não está configurada. Defina VITE_API_URL.")
  return value
}

async function apiRequest(path: string, init?: RequestInit): Promise<unknown> {
  const token = localStorage.getItem("accessToken")
  if (!token) throw new Error("Sua sessão expirou. Entre novamente.")
  const response = await fetch(`${apiBaseUrl()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  })
  const text = await response.text()
  let body: unknown = null
  if (text) {
    try {
      body = JSON.parse(text) as unknown
    } catch {
      if (response.ok) throw new Error("A API retornou uma resposta inválida.")
    }
  }
  if (!response.ok) {
    if (
      typeof body === "object" &&
      body !== null &&
      "message" in body &&
      (typeof body.message === "string" ||
        (Array.isArray(body.message) &&
          body.message.every((item) => typeof item === "string")))
    ) {
      throw new Error(
        Array.isArray(body.message) ? body.message.join(" ") : body.message
      )
    }
    throw new Error(
      `Não foi possível acessar a Sell IA (erro ${response.status}).`
    )
  }
  return body
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function formatTimestamp(value: unknown) {
  if (typeof value !== "string") return ""
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
}

function actionLabel(name: string) {
  const labels: Record<string, string> = {
    create_product: "Criar produto",
    update_product: "Editar produto",
    set_product_stock: "Atualizar estoque",
    create_sale: "Registrar venda",
    create_employee: "Cadastrar funcionário",
    update_customer: "Editar dados do cliente",
    update_sale: "Editar venda",
  }
  return labels[name] ?? "Alterar dados"
}

function mapConversation(value: unknown): ChatConversation {
  if (!isRecord(value) || typeof value.id !== "string") {
    throw new Error("A API retornou uma conversa inválida.")
  }
  const id = value.id
  const title = typeof value.title === "string" ? value.title : "Nova conversa"
  const messages = Array.isArray(value.messages) ? value.messages : []
  const turns: ChatTurn[] = []
  messages.forEach((item, index) => {
    if (!isRecord(item)) return
    const from =
      item.role === "user"
        ? "user"
        : item.role === "assistant"
          ? "assistant"
          : null
    if (!from) return
    const text = typeof item.content === "string" ? item.content : ""
    const timestamp = formatTimestamp(item.timestamp)
    const turnId = `${id}-${index}`
    if (from === "user") {
      turns.push({ from, id: turnId, text, timestamp })
      return
    }
    const pending = isRecord(item.pendingAction) ? item.pendingAction : null
    const pendingAction =
      pending &&
      typeof pending.id === "string" &&
      typeof pending.name === "string" &&
      isRecord(pending.arguments)
        ? {
            id: pending.id,
            name: pending.name,
            arguments: pending.arguments,
          }
        : undefined
    turns.push({
      from,
      id: turnId,
      text,
      timestamp,
      ...(pendingAction
        ? {
            pendingAction,
            approval: {
              question: `Confirma a ação: ${actionLabel(pendingAction.name)}?`,
              options: [
                { id: "confirm", label: "Confirmar e executar" },
                { id: "reject", label: "Recusar" },
              ],
            },
          }
        : {}),
    })
  })
  return {
    id,
    title,
    group: "Conversas",
    turns,
  }
}

export type ChatTemplateProps = {
  className?: string
  defaultConversationId?: string
  conversations?: ChatConversation[]
}

const ChatTemplate = ({
  className,
  conversations: initialConversations = [],
  defaultConversationId,
}: ChatTemplateProps) => {
  const [conversations, setConversations] = useState(initialConversations)
  const [activeId, setActiveId] = useState(defaultConversationId ?? NEW_CHAT_ID)
  const [errorMessage, setErrorMessage] = useState("")
  const [isLoadingConversations, setIsLoadingConversations] = useState(
    initialConversations.length === 0
  )
  const [retryCount, setRetryCount] = useState(0)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  // Narrow screens have no column for the list, so it arrives as a drawer.
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const shouldReduceMotion = useReducedMotion()

  const open = useCallback(async (id: string) => {
    setActiveId(id)
    setIsDrawerOpen(false)
    setErrorMessage("")
    if (id === NEW_CHAT_ID) {
      setIsLoadingConversations(false)
      return
    }
    setIsLoadingConversations(true)
    try {
      const detail = await apiRequest(
        `/ai/conversations/${encodeURIComponent(id)}`
      )
      const conversation = mapConversation(detail)
      setConversations((current) => [
        conversation,
        ...current.filter((item) => item.id !== conversation.id),
      ])
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível abrir a conversa."
      )
    } finally {
      setIsLoadingConversations(false)
    }
  }, [])

  useEffect(() => {
    if (initialConversations.length > 0) return
    let active = true
    void apiRequest("/ai/conversations")
      .then((response) => {
        if (!Array.isArray(response)) {
          throw new Error("A API retornou uma lista de conversas inválida.")
        }
        const summaries = response.flatMap((item): ChatConversation[] => {
          if (
            !isRecord(item) ||
            typeof item.id !== "string" ||
            typeof item.title !== "string"
          ) {
            return []
          }
          return [
            { id: item.id, title: item.title, group: "Conversas", turns: [] },
          ]
        })
        if (!active) return
        setConversations(summaries)
        const firstId = defaultConversationId ?? summaries[0]?.id
        if (firstId) return open(firstId)
      })
      .catch((error: unknown) => {
        if (active) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Não foi possível carregar as conversas."
          )
        }
      })
      .finally(() => {
        if (active) setIsLoadingConversations(false)
      })
    return () => {
      active = false
    }
  }, [defaultConversationId, initialConversations.length, open, retryCount])

  const retryLoadingConversations = useCallback(() => {
    setErrorMessage("")
    if (activeId !== NEW_CHAT_ID) {
      void open(activeId)
      return
    }
    setIsLoadingConversations(true)
    setRetryCount((count) => count + 1)
  }, [activeId, open])

  const sendMessage = useCallback(
    async (message: string, conversationId: string | undefined) => {
      const result = await apiRequest("/ai/chat", {
        method: "POST",
        body: JSON.stringify({
          message,
          ...(conversationId ? { conversationId } : {}),
        }),
      })
      if (!isRecord(result)) {
        throw new Error("A API retornou uma resposta inválida.")
      }
      const conversation = mapConversation(result.conversation)
      setConversations((current) => [
        conversation,
        ...current.filter((item) => item.id !== conversation.id),
      ])
      setActiveId(conversation.id)
      setErrorMessage("")
      return conversation
    },
    []
  )

  const decideAction = useCallback(
    async (conversationId: string, actionId: string, confirm: boolean) => {
      const action = confirm ? "confirm" : "reject"
      const result = await apiRequest(
        `/ai/conversations/${encodeURIComponent(conversationId)}/actions/${encodeURIComponent(actionId)}/${action}`,
        { method: "POST" }
      )
      if (!isRecord(result)) {
        throw new Error("A API retornou uma confirmação inválida.")
      }
      const conversation = mapConversation(result.conversation)
      setConversations((current) => [
        conversation,
        ...current.filter((item) => item.id !== conversation.id),
      ])
      setErrorMessage("")
    },
    []
  )

  const active = conversations.find(
    (conversation) => conversation.id === activeId
  )

  return (
    <div
      className={cn(
        "relative flex h-full min-h-0 w-full overflow-hidden bg-background text-foreground",
        className
      )}
    >
      {/* Collapses to an icon rail rather than disappearing, so navigation stays
          one click away. */}
      <ChatSidebar
        activeId={activeId}
        className="hidden md:flex"
        collapsed={!isSidebarOpen}
        conversations={conversations}
        onNewChat={() => open(NEW_CHAT_ID)}
        onSelect={open}
        onToggleCollapsed={() => setIsSidebarOpen((isOpen) => !isOpen)}
      />

      {/* Below `md` the same list slides over the thread. Without it there is no
          way to change conversation on a phone, which is most of what a chat
          app's navigation is for.

          Both children are keyed: `AnimatePresence` tracks its direct children by
          key, and without one it never runs the enter or the exit — the panel
          just sat parked off-screen. */}
      <AnimatePresence>
        {isDrawerOpen ? (
          <>
            <motion.button
              animate={{ opacity: 1 }}
              aria-label="Fechar conversas"
              className="absolute inset-0 z-20 cursor-default bg-foreground/20 md:hidden"
              exit={{ opacity: 0 }}
              initial={{ opacity: 0 }}
              key="chat-drawer-scrim"
              onClick={() => setIsDrawerOpen(false)}
              transition={shouldReduceMotion ? { duration: 0 } : SCRIM_FADE}
              type="button"
            />
            {/* Reduced motion keeps the fade and drops the travel, rather than
                removing the transition altogether. */}
            <motion.div
              animate={{ opacity: 1, x: 0 }}
              className="absolute inset-y-0 left-0 z-30 flex md:hidden"
              exit={
                shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: "-100%" }
              }
              initial={
                shouldReduceMotion ? { opacity: 0 } : { opacity: 1, x: "-100%" }
              }
              key="chat-drawer-panel"
              transition={shouldReduceMotion ? SCRIM_FADE : DRAWER_SPRING}
            >
              <ChatSidebar
                activeId={activeId}
                className="h-full bg-background shadow-xl shadow-black/10"
                collapsed={false}
                conversations={conversations}
                onNewChat={() => open(NEW_CHAT_ID)}
                onSelect={open}
                onToggleCollapsed={() => setIsDrawerOpen(false)}
              />
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>

      <ChatThread
        key={activeId}
        conversationId={activeId === NEW_CHAT_ID ? undefined : activeId}
        errorMessage={errorMessage}
        isLoadingConversations={isLoadingConversations}
        onAction={decideAction}
        onRetry={retryLoadingConversations}
        onSend={sendMessage}
        onOpenSidebar={() => setIsDrawerOpen(true)}
        title={active?.title ?? "Nova conversa"}
        turns={active?.turns ?? []}
      />
    </div>
  )
}

export default ChatTemplate
export type { ChatConversation, ChatTurn } from "./chat-data"
