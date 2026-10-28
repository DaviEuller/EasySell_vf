"use client"

import { cn } from "@/lib/utils"
import { motion, useReducedMotion } from "motion/react"
import { Fragment, useEffect, useState, type ReactNode } from "react"

const EASE_OUT = [0.23, 1, 0.32, 1] as const
/**
 * Hoisted and frozen. Motion restarts an animation whenever the transition it is
 * given changes, and this component re-renders on every token — so the object
 * has to be the same reference every time.
 */
const WORD_TRANSITION = { duration: 0.22, ease: EASE_OUT } as const
const WORD_BLUR_PX = 4
const TOKEN_SPLIT = /(\s+|\[\d+\])/
/** Anything without a letter or digit is punctuation and is not animated. */
const HAS_WORD_CHARACTER = /[\p{L}\p{N}]/u
const WHITESPACE_ONLY = /^\s+$/

export type AIResponseCitation = {
  id: string
  /** The number shown in the pill, matching the `[n]` marker in the text. */
  index: number
  title: string
  /**
   * Where the source lives, when it lives anywhere.
   *
   * Optional on purpose: most retrieval is over internal documents that have no
   * public URL, and a required field there just pushes people into inventing
   * `example.com` links that go nowhere. Without a url the pill renders as plain
   * text instead of a dead link.
   */
  url?: string
}

export type AIResponseProps = {
  /** Sources referenced by `[n]` markers in the text. */
  citations?: AIResponseCitation[]
  className?: string
  /** Shows a caret after the last word. */
  isStreaming?: boolean
  /** The response so far. Re-render it as it grows. */
  text: string
}

type ResponseBlock =
  | { type: "text"; text: string }
  | { type: "table"; headers: string[]; rows: string[][] }

type InlinePart =
  | { type: "text" | "code"; value: string }
  | { type: "citation"; value: string; citation: AIResponseCitation }
  | { type: "link"; value: string; href: string }
  | { type: "bold" | "italic" | "strike"; value: string }

type TextLineBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading"; level: number; text: string }
  | { type: "quote"; text: string }
  | { type: "divider" }
  | { type: "list"; ordered: boolean; items: string[] }

const parseInline = (
  text: string,
  citations: AIResponseCitation[]
): InlinePart[] => {
  const parts: InlinePart[] = []
  let plainText = ""
  const flushText = () => {
    if (plainText) {
      parts.push({ type: "text", value: plainText })
      plainText = ""
    }
  }

  for (let index = 0; index < text.length;) {
    const linkMatch = text
      .slice(index)
      .match(/^\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/)
    if (linkMatch) {
      flushText()
      parts.push({
        type: "link",
        value: linkMatch[1],
        href: linkMatch[2],
      })
      index += linkMatch[0].length
      continue
    }

    const citationMatch = text.slice(index).match(/^\[(\d+)\]/)
    if (citationMatch) {
      const citation = citations.find(
        (entry) => entry.index === Number(citationMatch[1])
      )
      if (citation) {
        flushText()
        parts.push({
          type: "citation",
          value: citationMatch[0],
          citation,
        })
        index += citationMatch[0].length
        continue
      }
    }

    const marker = ["**", "__", "~~", "`", "*", "_"].find((candidate) => {
      if (!text.startsWith(candidate, index)) return false
      if (
        (candidate === "*" || candidate === "_") &&
        text[index + 1] === candidate
      ) {
        return false
      }
      return true
    })
    if (!marker) {
      plainText += text[index]
      index += 1
      continue
    }

    const closingIndex = text.indexOf(marker, index + marker.length)
    if (closingIndex <= index + marker.length) {
      plainText += marker
      index += marker.length
      continue
    }
    if (
      (marker === "*" || marker === "_") &&
      text[closingIndex + 1] === marker
    ) {
      plainText += marker
      index += marker.length
      continue
    }

    flushText()
    const value = text.slice(index + marker.length, closingIndex)
    if (marker === "`") {
      parts.push({ type: "code", value })
    } else {
      parts.push({
        type:
          marker === "**" || marker === "__"
            ? "bold"
            : marker === "~~"
              ? "strike"
              : "italic",
        value,
      })
    }
    index = closingIndex + marker.length
  }

  flushText()
  return parts
}

const parseTextLineBlocks = (text: string): TextLineBlock[] => {
  const blocks: TextLineBlock[] = []
  let paragraph: string[] = []
  let list: { ordered: boolean; items: string[] } | null = null
  const flushParagraph = () => {
    if (paragraph.length) {
      blocks.push({ type: "paragraph", text: paragraph.join(" ") })
      paragraph = []
    }
  }
  const flushList = () => {
    if (list) {
      blocks.push({ type: "list", ...list })
      list = null
    }
  }

  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed) {
      flushParagraph()
      flushList()
      continue
    }

    if (/^(?:-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      flushParagraph()
      flushList()
      blocks.push({ type: "divider" })
      continue
    }

    const heading = trimmed.match(/^(#{1,6})\s+(.+)$/)
    if (heading) {
      flushParagraph()
      flushList()
      blocks.push({
        type: "heading",
        level: heading[1].length,
        text: heading[2],
      })
      continue
    }

    const listItem = trimmed.match(/^(?:([-+*])\s+|(\d+)[.)]\s+)(.+)$/)
    if (listItem) {
      flushParagraph()
      const ordered = listItem[2] !== undefined
      if (list && list.ordered !== ordered) flushList()
      if (!list) list = { ordered, items: [] }
      list.items.push(listItem[3])
      continue
    }

    const quote = trimmed.match(/^>\s?(.*)$/)
    if (quote) {
      flushParagraph()
      flushList()
      blocks.push({ type: "quote", text: quote[1] })
      continue
    }

    flushList()
    paragraph.push(trimmed)
  }

  flushParagraph()
  flushList()
  return blocks
}

const parsePipeRow = (line: string): string[] | null => {
  const trimmed = line.trim()
  if (!trimmed.includes("|")) return null

  const content = trimmed.replace(/^\|/, "").replace(/\|$/, "")
  const cells: string[] = []
  let cell = ""
  for (let index = 0; index < content.length; index += 1) {
    const character = content[index]
    if (character === "\\" && content[index + 1] === "|") {
      cell += "|"
      index += 1
    } else if (character === "|") {
      cells.push(cell.trim())
      cell = ""
    } else {
      cell += character
    }
  }
  cells.push(cell.trim())
  return cells
}

const parseResponseBlocks = (text: string): ResponseBlock[] => {
  const lines = text.split(/\r?\n/)
  const blocks: ResponseBlock[] = []
  let textLines: string[] = []
  const flushText = () => {
    if (textLines.length > 0) {
      blocks.push({ type: "text", text: textLines.join("\n") })
      textLines = []
    }
  }

  for (let index = 0; index < lines.length;) {
    const headers = parsePipeRow(lines[index])
    const separator = lines[index + 1] ? parsePipeRow(lines[index + 1]) : null
    if (
      !headers ||
      !separator ||
      separator.length !== headers.length ||
      !separator.every((cell) => /^:?-{3,}:?$/.test(cell))
    ) {
      textLines.push(lines[index])
      index += 1
      continue
    }

    flushText()
    index += 2
    const rows: string[][] = []
    while (index < lines.length) {
      const row = parsePipeRow(lines[index])
      if (!row || row.length !== headers.length) break
      rows.push(row)
      index += 1
    }
    blocks.push({ type: "table", headers, rows })
  }
  flushText()
  return blocks
}

/**
 * Streaming assistant text.
 *
 * Words animate in as they *arrive*, not on a fixed timer — the component
 * remembers how many tokens it had last render and only animates the new ones.
 * A timer-driven typewriter drifts out of step with the real stream and starts
 * lying about how fast the model is answering.
 */
const AIResponse = ({
  citations = [],
  className,
  isStreaming = false,
  text,
}: AIResponseProps) => {
  const shouldReduceMotion = useReducedMotion()
  const blocks = parseResponseBlocks(text)

  return (
    <div
      className={cn(
        "flex flex-col gap-3 text-sm leading-relaxed text-pretty text-foreground",
        className
      )}
    >
      {blocks.map((block, index) =>
        block.type === "table" ? (
          <div
            className="max-w-full overflow-x-auto rounded-xl border border-border/70"
            key={`table-${index}`}
          >
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-blue-600 text-white">
                <tr>
                  {block.headers.map((header, headerIndex) => (
                    <th
                      className="border-b border-blue-700 px-3 py-2 font-semibold whitespace-nowrap"
                      key={`${header}-${headerIndex}`}
                      scope="col"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.rows.map((row, rowIndex) => (
                  <tr
                    className="border-b border-border/50 last:border-0 odd:bg-muted/20"
                    key={rowIndex}
                  >
                    {block.headers.map((_, cellIndex) => (
                      <td className="px-3 py-2 align-top" key={cellIndex}>
                        {row[cellIndex] ?? ""}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <AIResponseTextBlock
            citations={citations}
            isStreaming={isStreaming && index === blocks.length - 1}
            key={`text-${index}`}
            shouldReduceMotion={Boolean(shouldReduceMotion)}
            text={block.text}
          />
        )
      )}
    </div>
  )
}

const AIResponseTextBlock = ({
  citations,
  isStreaming,
  shouldReduceMotion,
  text,
}: {
  citations: AIResponseCitation[]
  isStreaming: boolean
  shouldReduceMotion: boolean
  text: string
}) => {
  const blocks = parseTextLineBlocks(text)

  // How many tokens had already been painted before this render. Everything at
  // or after this index is new and gets the entrance.
  const [paintedCount, setPaintedCount] = useState(0)
  const firstNewIndex = paintedCount

  useEffect(() => {
    const frame = requestAnimationFrame(() => setPaintedCount(blocks.length))
    return () => cancelAnimationFrame(frame)
  }, [blocks.length])

  return (
    <div className="flex flex-col gap-2 text-sm leading-relaxed text-foreground">
      {blocks.map((block, index) => {
        const isNew = index >= firstNewIndex
        const key = `${block.type}-${index}`

        if (block.type === "heading") {
          const content = renderInlineMarkdown(
            block.text,
            citations,
            isNew,
            shouldReduceMotion
          )
          const className =
            block.level === 1
              ? "text-2xl font-bold"
              : block.level === 2
                ? "text-xl font-bold"
                : "text-lg font-semibold"
          const headingProps = { className, key }
          switch (block.level) {
            case 1:
              return <h1 {...headingProps}>{content}</h1>
            case 2:
              return <h2 {...headingProps}>{content}</h2>
            case 3:
              return <h3 {...headingProps}>{content}</h3>
            case 4:
              return <h4 {...headingProps}>{content}</h4>
            case 5:
              return <h5 {...headingProps}>{content}</h5>
            default:
              return <h6 {...headingProps}>{content}</h6>
          }
        }

        if (block.type === "quote") {
          const content = renderInlineMarkdown(
            block.text,
            citations,
            isNew,
            shouldReduceMotion
          )
          return (
            <blockquote
              className="border-l-2 border-border pl-3 text-muted-foreground"
              key={key}
            >
              {content}
            </blockquote>
          )
        }

        if (block.type === "divider") {
          return <hr className="border-border" key={key} />
        }

        if (block.type === "list") {
          const List = block.ordered ? "ol" : "ul"
          return (
            <List
              className={
                block.ordered
                  ? "list-inside list-decimal space-y-1"
                  : "list-inside list-disc space-y-1"
              }
              key={key}
            >
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>
                  {renderInlineMarkdown(
                    item,
                    citations,
                    isNew,
                    shouldReduceMotion
                  )}
                </li>
              ))}
            </List>
          )
        }

        return (
          <p className="text-pretty" key={key}>
            {renderInlineMarkdown(
              block.text,
              citations,
              isNew,
              shouldReduceMotion
            )}
          </p>
        )
      })}
      {isStreaming ? (
        <AIResponseCaret shouldReduceMotion={shouldReduceMotion} />
      ) : null}
    </div>
  )
}

const renderInlineMarkdown = (
  text: string,
  citations: AIResponseCitation[],
  isNew: boolean,
  shouldReduceMotion: boolean
): ReactNode => (
  <>
    {parseInline(text, citations).map((part, index) => {
      if (part.type === "citation") {
        return (
          <AIResponseCitationPill
            citation={part.citation}
            isNew={isNew}
            key={index}
            shouldReduceMotion={shouldReduceMotion}
          />
        )
      }

      if (part.type === "link") {
        return (
          <a
            className="text-primary underline underline-offset-2 hover:opacity-80"
            href={part.href}
            key={index}
            rel="noopener noreferrer"
            target="_blank"
          >
            {renderInlineMarkdown(
              part.value,
              citations,
              isNew,
              shouldReduceMotion
            )}
          </a>
        )
      }

      if (part.type === "text") {
        return part.value.split(TOKEN_SPLIT).map((value, tokenIndex) => {
          if (!value) return null
          if (WHITESPACE_ONLY.test(value) || !HAS_WORD_CHARACTER.test(value)) {
            return <Fragment key={`${index}-${tokenIndex}`}>{value}</Fragment>
          }
          return (
            <motion.span
              animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
              className="inline-block"
              initial={
                isNew && !shouldReduceMotion
                  ? { filter: `blur(${WORD_BLUR_PX}px)`, opacity: 0, y: 2 }
                  : false
              }
              key={`${index}-${tokenIndex}`}
              transition={
                shouldReduceMotion ? { duration: 0 } : WORD_TRANSITION
              }
            >
              {value}
            </motion.span>
          )
        })
      }

      if (part.type === "code") {
        return (
          <code
            className="rounded bg-muted px-1 py-0.5 font-mono text-[0.9em]"
            key={index}
          >
            {part.value}
          </code>
        )
      }

      const nested = renderInlineMarkdown(
        part.value,
        citations,
        isNew,
        shouldReduceMotion
      )
      if (part.type === "bold") return <strong key={index}>{nested}</strong>
      if (part.type === "italic") return <em key={index}>{nested}</em>
      return (
        <del className="text-muted-foreground" key={index}>
          {nested}
        </del>
      )
    })}
  </>
)

const AIResponseCaret = ({
  shouldReduceMotion,
}: {
  shouldReduceMotion: boolean | null
}) => (
  // Inline rather than absolutely positioned, so it rides the last glyph for
  // free and never has to be told where the text ended.
  <motion.span
    animate={shouldReduceMotion ? { opacity: 1 } : { opacity: [1, 0.15, 1] }}
    aria-hidden="true"
    className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[0.15em] rounded-full bg-current align-baseline"
    transition={
      shouldReduceMotion
        ? { duration: 0 }
        : { duration: 1, ease: "linear", repeat: Number.POSITIVE_INFINITY }
    }
  />
)

const AIResponseCitationPill = ({
  citation,
  isNew,
  shouldReduceMotion,
}: {
  citation: AIResponseCitation
  isNew: boolean
  shouldReduceMotion: boolean
}) => {
  const shared = {
    animate: { opacity: 1, scale: 1 },
    // No left margin: the marker is already preceded by a space in the text, so
    // adding one here doubles the gap.
    className:
      "mr-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full border border-border bg-muted px-1 align-super font-medium text-[10px] text-muted-foreground no-underline",
    initial:
      isNew && !shouldReduceMotion
        ? { opacity: 0, scale: 0.6 }
        : (false as const),
    title: citation.title,
    transition: shouldReduceMotion
      ? { duration: 0 }
      : { bounce: 0.1, duration: 0.25, type: "spring" as const },
  }

  // An internal document has nowhere to go, so it is not dressed up as a link —
  // no hover affordance, no pointer, nothing to click and be disappointed by.
  if (!citation.url) {
    return <motion.span {...shared}>{citation.index}</motion.span>
  }

  return (
    <motion.a
      {...shared}
      className={`${shared.className} transition-colors hover:border-foreground/30 hover:text-foreground`}
      href={citation.url}
      rel="noopener noreferrer"
      target="_blank"
    >
      {citation.index}
    </motion.a>
  )
}

export default AIResponse
