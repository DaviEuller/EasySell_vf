"use client";

import { cn } from "@/lib/utils";
import AIArtifact from "@/components/smoothui/ai-artifact";
import AIContextMeter from "@/components/smoothui/ai-context-meter";
import AIConversation from "@/components/smoothui/ai-conversation";
import type { AIState } from "@/components/smoothui/ai-core";
import AIDiff from "@/components/smoothui/ai-diff";
import AILoader from "@/components/smoothui/ai-loader";
import AIMessage from "@/components/smoothui/ai-message";
import AIApproval from "@/components/smoothui/ai-approval";
import AIPromptInput from "@/components/smoothui/ai-prompt-input";
import AIReasoning from "@/components/smoothui/ai-reasoning";
import AIResponse from "@/components/smoothui/ai-response";
import AISources from "@/components/smoothui/ai-sources";
import AISuggestions from "@/components/smoothui/ai-suggestions";
import AITaskList from "@/components/smoothui/ai-task-list";
import AIToolCall from "@/components/smoothui/ai-tool-call";
import SiriOrb from "@/components/smoothui/siri-orb";
import { PanelLeftOpen, Paperclip } from "lucide-react";
import { useMemo, useState } from "react";
import { type ChatConversation, type ChatTurn, CONTEXT_LIMIT } from "./chat-data";

const formatClock = (date: Date) =>
  `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;

export type ChatThreadProps = {
  className?: string;
  conversationId?: string;
  errorMessage?: string;
  isLoadingConversations?: boolean;
  onAction: (conversationId: string, actionId: string, confirm: boolean) => Promise<void>;
  onRetry: () => void;
  onSend: (
    message: string,
    conversationId: string | undefined
  ) => Promise<ChatConversation>;
  onOpenSidebar?: () => void;
  title: string;
  turns: ChatTurn[];
};

export const ChatThread = ({
  className,
  conversationId,
  errorMessage,
  isLoadingConversations = false,
  onAction,
  onRetry,
  onSend,
  onOpenSidebar,
  title,
  turns,
}: ChatThreadProps) => {
  const [localTurns, setLocalTurns] = useState<ChatTurn[]>([]);
  const [phase, setPhase] = useState<"idle" | "thinking">("idle");
  const [actionError, setActionError] = useState("");
  const [activeActionId, setActiveActionId] = useState<string | null>(null);

  const send = async (value: string) => {
    const draft = value.trim();
    if (!draft || phase !== "idle") {
      return;
    }

    const optimisticId = `local-${crypto.randomUUID()}`;
    setLocalTurns((current) => [
      ...current,
      {
        from: "user",
        id: optimisticId,
        text: draft,
        timestamp: formatClock(new Date()),
      },
    ]);
    setPhase("thinking");
    setActionError("");
    try {
      await onSend(draft, conversationId);
      setLocalTurns([]);
    } catch (error) {
      setLocalTurns((current) => [
        ...current,
        {
          from: "assistant",
          id: `error-${crypto.randomUUID()}`,
          text:
            error instanceof Error
              ? error.message
              : "Não foi possível obter uma resposta da Sellia.",
          timestamp: formatClock(new Date()),
        },
      ]);
    } finally {
      setPhase("idle");
    }
  };

  const decideAction = async (turn: ChatTurn, optionId: string) => {
    if (
      turn.from !== "assistant" ||
      !conversationId ||
      !turn.pendingAction ||
      activeActionId
    ) {
      return;
    }
    setActiveActionId(turn.pendingAction.id);
    setActionError("");
    try {
      await onAction(
        conversationId,
        turn.pendingAction.id,
        optionId === "confirm"
      );
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Não foi possível processar a ação."
      );
    } finally {
      setActiveActionId(null);
    }
  };

  // Memoised because the token breakdown below depends on it; a fresh array each
  // render would make that memo pointless.
  const allTurns = useMemo(
    () => [...turns, ...localTurns],
    [turns, localTurns]
  );
  const isBusy = phase !== "idle";
  const hasPendingAction = allTurns.some(
    (turn) => turn.from === "assistant" && Boolean(turn.pendingAction)
  );
  const isComposerDisabled =
    isBusy || isLoadingConversations || hasPendingAction;
  const state: AIState = isBusy ? "thinking" : "idle";
  // Derived from what is actually on screen, so an empty chat reads as empty
  // instead of inheriting a fixture's 67k. A fixed number here was a lie the
  // moment a new conversation starts.
  const breakdown = useMemo(() => {
    // Everything the model would actually have been sent, not just the prose:
    // a reasoning trace and an artifact's source are the bulk of a real turn.
    const transcript =
      allTurns.reduce(
        (total, turn) =>
          total +
          (turn.from === "user" ? turn.text.length : turn.text?.length ?? 0),
        0
      ) / 4;

    return [
      { label: "Sistema", tokens: 350 },
      {
        label: "Transcript",
        tokens: Math.round(transcript),
      },
    ];
  }, [allTurns]);

  const used = breakdown.reduce((total, item) => total + item.tokens, 0);

  return (
    <section className={cn("flex min-w-0 flex-1 flex-col", className)}>
      <header className="flex items-center gap-3 border-border/60 border-b px-4 py-2.5">
        {/* The only way into the conversation list on a phone, where the sidebar
            has no column of its own. */}
        {onOpenSidebar ? (
          <button
            aria-label="Abrir conversas"
            className="-ml-1 flex cursor-pointer items-center rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:hidden"
            onClick={onOpenSidebar}
            type="button"
          >
            <PanelLeftOpen aria-hidden="true" size={16} />
          </button>
        ) : null}
        <h2 className="min-w-0 flex-1 truncate font-medium text-sm">{title}</h2>
        <AIContextMeter
          breakdown={breakdown}
          limit={CONTEXT_LIMIT}
          used={used}
        />
      </header>

      {errorMessage || actionError ? (
        <div className="flex items-center justify-center gap-3 border-b border-destructive/20 bg-destructive/5 px-4 py-2 text-destructive text-xs">
          <p role="alert">{actionError || errorMessage}</p>
          {errorMessage ? (
            <button
              className="font-semibold underline underline-offset-2"
              onClick={onRetry}
              type="button"
            >
              Tentar novamente
            </button>
          ) : null}
        </div>
      ) : null}

      <AIConversation
        className="flex-1 px-4"
        contentKey={`${allTurns.length}-${phase}`}
      >
        {/* `px-2`, not decoration: the scroller clips at its padding box, and the
              orb avatar sat flush against that edge — its glow extends past its
              own 26px box, so the left of it was being shaved off. */}
        <div className="mx-auto flex min-h-full w-full max-w-2xl flex-col gap-5 px-2 py-5">
          {allTurns.length === 0 && isLoadingConversations ? (
            <div
              aria-live="polite"
              className="flex flex-1 flex-col items-center justify-center gap-3 py-10 text-center"
              role="status"
            >
              <SiriOrb size="48px" state="thinking" />
              <p className="text-muted-foreground text-sm">
                Conectando à Sellia...
              </p>
            </div>
          ) : null}

          {allTurns.length === 0 && !isLoadingConversations && (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 py-10 text-center">
              <SiriOrb size="64px" state="idle" />
              <div>
                <h3 className="font-medium text-foreground">Olá! Eu sou a Sellia.</h3>
                <p className="mt-1 text-muted-foreground text-sm">
                  Pergunte sobre seus produtos, estoque ou vendas.
                </p>
              </div>
              <AISuggestions
                onSelect={(suggestion) => void send(suggestion.label)}
                suggestions={[
                  { id: "stock", label: "Quais produtos estão com estoque baixo?" },
                  { id: "sales", label: "Resuma as vendas recentes." },
                  { id: "product", label: "Quero cadastrar um produto." },
                ]}
              />
            </div>
          )}

          {allTurns.map((turn) => (
            <ChatTurnView
              actionError={actionError}
              key={turn.id}
              onAction={(optionId) => void decideAction(turn, optionId)}
              onSuggestion={(value) => void send(value)}
              turn={turn}
            />
          ))}

          {isBusy && (
            <AIMessage
              avatar={<SiriOrb size="26px" state={state} />}
              bubble={false}
              from="assistant"
            >
              <AILoader label="Sellia está pensando" showElapsed variant="dots" />
            </AIMessage>
          )}
        </div>
      </AIConversation>

      <div className="border-border/60 border-t px-4 py-3">
        <div className="mx-auto w-full max-w-2xl">
          <AIPromptInput
            disabled={isComposerDisabled}
            maxLength={2000}
            onSubmit={(value) => void send(value)}
            placeholder={
              hasPendingAction
                ? "Confirme ou recuse a ação para continuar..."
                : isBusy
                  ? "Sellia está respondendo..."
                  : "Pergunte à Sellia..."
            }
            state={isBusy ? "thinking" : "idle"}
          />
          <p className="pt-2 text-center text-muted-foreground text-xs">
            Suas mensagens são enviadas com segurança. Alterações só são feitas após confirmação.
          </p>
        </div>
      </div>
    </section>
  );
};

/**
 * One transcript turn.
 *
 * Every assistant part is optional and rendered in the order an agent produces
 * it: thinking, tools, plan, changes, artifact, prose, then what it read. New AI
 * components slot in as one more branch here.
 */
const ChatTurnView = ({
  actionError,
  onAction,
  onSuggestion,
  turn,
}: {
  actionError: string;
  onAction: (optionId: string) => void;
  onSuggestion: (value: string) => void;
  turn: ChatTurn;
}) => {
  if (turn.from === "user") {
    return (
      <AIMessage copyText={turn.text} from="user" timestamp={turn.timestamp}>
        <span className="flex flex-col gap-2">
          {turn.text}
          {turn.attachments && turn.attachments.length > 0 && (
            <span className="flex flex-wrap justify-end gap-1.5">
              {turn.attachments.map((file) => (
                <span
                  className="flex items-center gap-1.5 rounded-lg bg-background/15 px-2 py-1 text-xs"
                  key={file.id}
                >
                  <Paperclip aria-hidden="true" size={11} />
                  {file.name}
                  <span className="opacity-70">{formatBytes(file.size)}</span>
                </span>
              ))}
            </span>
          )}
        </span>
      </AIMessage>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <AIMessage
        avatar={<SiriOrb size="26px" state="done" />}
        bubble={false}
        copyText={turn.text}
        from="assistant"
        onRetry={() => {
          // A replayed transcript has nothing to retry against.
        }}
        onVote={() => {
          // Demo only — no telemetry leaves the page.
        }}
        timestamp={turn.timestamp}
      >
        <div className="flex flex-col gap-3">
          {turn.reasoning ? (
            <AIReasoning collapseWhenDone duration={4}>
              {turn.reasoning}
            </AIReasoning>
          ) : null}

          {turn.tool ? (
            <AIToolCall
              args={<code>{turn.tool.args}</code>}
              name={turn.tool.name}
              result={<span>{turn.tool.result}</span>}
              status="success"
              summary={turn.tool.summary}
            />
          ) : null}

          {turn.tasks ? (
            <AITaskList label={turn.tasks.label} tasks={turn.tasks.tasks} />
          ) : null}

          {turn.diff ? (
            <AIDiff lines={turn.diff.lines} title={turn.diff.title} />
          ) : null}

          {turn.artifact ? (
            <AIArtifact
              code={
                <pre className="whitespace-pre-wrap">{turn.artifact.code}</pre>
              }
              copyText={turn.artifact.code}
              preview={<SummerBannerPreview />}
              title={turn.artifact.title}
            />
          ) : null}

          {turn.text ? (
            <AIResponse citations={turn.citations} text={turn.text} />
          ) : null}

          {turn.sources ? <AISources sources={turn.sources} /> : null}
        </div>
      </AIMessage>

      {turn.approval ? (
        <AIApproval
          onDecide={(option) => onAction(option.id)}
          options={turn.approval.options}
          question={turn.approval.question}
          key={`${turn.pendingAction?.id ?? turn.id}-${actionError}`}
        >
          {turn.pendingAction ? (
            <pre className="mt-2 max-h-40 overflow-auto rounded-lg bg-muted p-2 text-xs">
              {JSON.stringify(turn.pendingAction.arguments, null, 2)}
            </pre>
          ) : null}
        </AIApproval>
      ) : null}

      {turn.suggestions ? (
        <AISuggestions
          label="Follow-ups"
          onSelect={(suggestion) => onSuggestion(suggestion.label)}
          suggestions={turn.suggestions}
        />
      ) : null}
    </div>
  );
};

const KIB = 1024;
const MIB = KIB * KIB;

const formatBytes = (size?: number) => {
  if (!size) {
    return "";
  }
  return size >= MIB
    ? `${(size / MIB).toFixed(1)} MB`
    : `${Math.round(size / KIB)} KB`;
};

/** The artifact's rendered pane — the real banner, not a grey box. */
const SummerBannerPreview = () => (
  <section className="rounded-2xl bg-gradient-to-br from-pink-200 to-sky-200 p-6 text-neutral-900">
    <p className="text-[0.65rem] uppercase tracking-widest">Summer 2026</p>
    <h3 className="mt-1.5 font-semibold text-2xl">Two scoops, one price</h3>
    <p className="mt-2 max-w-sm text-sm">
      Every weekday before 5pm, all summer.
    </p>
  </section>
);

export default ChatThread;
