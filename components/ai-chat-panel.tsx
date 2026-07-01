"use client"

import { useRef, useState } from "react"
import {
  Sparkles,
  Send,
  Bot,
  User,
  Cpu,
  PanelLeftClose,
  PanelLeftOpen,
  Paperclip,
  ImageIcon,
  X,
  FileText,
  MessageSquarePlus,
  History,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { sendChatMessage, createInvestigation } from "@/lib/api-client"

type Attachment = {
  id: string
  name: string
  size: number
  kind: "image" | "file"
  previewUrl?: string
}

type Message = {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: string
  attachments?: Attachment[]
}

const initialMessages: Message[] = [
  {
    id: "1",
    role: "assistant",
    content:
      "Hola, soy Gemini. Estoy listo para analizar tus mediciones de RIPE Atlas y ayudarte a interpretar los gráficos.",
    timestamp: "10:24",
  },
]

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

type AiChatPanelProps = {
  collapsed?: boolean
  onToggle?: () => void
  activeInvId?: number
}

export function AiChatPanel({ collapsed = false, onToggle, activeInvId = 1 }: AiChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState("")
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)

  const handleSend = async () => {
    if (!input.trim() && attachments.length === 0) return
    const text = input.trim()
    const newMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }),
      attachments: attachments.length > 0 ? attachments : undefined,
    }
    setMessages((prev) => [...prev, newMessage])
    setInput("")
    setAttachments([])
    
    setLoading(true)
    try {
      const replyText = await sendChatMessage(activeInvId, text)
      const replyMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: replyText,
        timestamp: new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }),
      }
      setMessages((prev) => [...prev, replyMessage])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleFiles = async (files: FileList | null, kind: "image" | "file") => {
    if (!files) return
    
    // Auto-process JSON uploads for investigation creation
    const file = files[0]
    if (file && file.name.endsWith(".json")) {
      setLoading(true)
      try {
        const { id } = await createInvestigation(file)
        window.location.href = `/?id=${id}`
        return
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }

    const next: Attachment[] = Array.from(files).map((f) => ({
      id: `${Date.now()}-${f.name}`,
      name: f.name,
      size: f.size,
      kind: kind === "image" || f.type.startsWith("image/") ? "image" : "file",
      previewUrl: f.type.startsWith("image/") ? URL.createObjectURL(f) : undefined,
    }))
    setAttachments((prev) => [...prev, ...next])
  }

  const removeAttachment = (id: string) => {
    setAttachments((prev) => {
      const target = prev.find((a) => a.id === id)
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl)
      return prev.filter((a) => a.id !== id)
    })
  }

  // Collapsed rail view
  if (collapsed) {
    return (
      <aside className="flex h-full w-full flex-col items-center border-r border-border bg-sidebar py-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="h-9 w-9 text-muted-foreground hover:text-foreground"
          title="Expandir el panel"
          aria-label="Expandir el panel del asistente"
        >
          <PanelLeftOpen className="h-4 w-4" aria-hidden="true" />
        </Button>

        <div className="my-2 h-px w-8 bg-border" aria-hidden="true" />

        <div
          className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground"
          title="Asistente Gemma 4"
          aria-label="Asistente Gemma 4"
        >
          <Sparkles className="h-4 w-4" aria-hidden="true" />
        </div>

        <div className="mt-3 flex flex-col items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-muted-foreground hover:text-foreground"
            title="Nuevo chat"
            aria-label="Nuevo chat"
          >
            <MessageSquarePlus className="h-4 w-4" aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-muted-foreground hover:text-foreground"
            title="Historial"
            aria-label="Historial de conversaciones"
          >
            <History className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>

        <div className="mt-auto flex flex-col items-center gap-2 pb-1">
          <span
            className="h-1.5 w-1.5 rounded-full bg-chart-3"
            title="En línea"
            aria-label="En línea"
          />
        </div>
      </aside>
    )
  }

  return (
    <aside className="flex h-full w-full flex-col border-r border-border bg-sidebar">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border px-5 py-4">
        <div className="flex items-center gap-3">
          {onToggle ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
              className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
              title="Contraer el panel"
              aria-label="Contraer el panel del asistente"
            >
              <PanelLeftClose className="h-4 w-4" aria-hidden="true" />
            </Button>
          ) : null}
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold leading-tight">Asistente Gemini 1.5</span>
            <span className="text-xs text-muted-foreground">Análisis RIPE Atlas</span>
          </div>
        </div>
        <Badge
          variant="secondary"
          className="gap-1.5 border border-border bg-background font-mono text-[10px] uppercase tracking-wider"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-chart-3" aria-hidden="true" />
          Online
        </Badge>
      </header>

      {/* Messages */}
      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col gap-5 px-5 py-6">
          {messages.map((message) => (
            <ChatBubble key={message.id} message={message} />
          ))}
        </div>
      </ScrollArea>

      {/* Composer */}
      <div className="shrink-0 border-t border-border bg-card p-3">
        <div className="rounded-lg border border-border bg-background focus-within:ring-2 focus-within:ring-ring/40">
          {/* Attachment previews */}
          {attachments.length > 0 ? (
            <div className="flex flex-wrap gap-2 border-b border-border px-3 py-2">
              {attachments.map((att) => (
                <AttachmentChip
                  key={att.id}
                  attachment={att}
                  onRemove={() => removeAttachment(att.id)}
                />
              ))}
            </div>
          ) : null}

          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            placeholder="Pídele a Gemma 4 que analice las mediciones..."
            className="min-h-[60px] resize-none border-0 bg-transparent text-sm shadow-none focus-visible:ring-0"
          />

          <div className="flex items-center justify-between border-t border-border px-2 py-2">
            <div className="flex items-center gap-0.5">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".json,.csv,.txt,.md,.pdf,application/json,text/csv,text/plain,text/markdown,application/pdf"
                className="hidden"
                onChange={(e) => {
                  handleFiles(e.target.files, "file")
                  if (fileInputRef.current) fileInputRef.current.value = ""
                }}
              />
              <input
                ref={imageInputRef}
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  handleFiles(e.target.files, "image")
                  if (imageInputRef.current) imageInputRef.current.value = ""
                }}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                title="Adjuntar archivo"
                aria-label="Adjuntar archivo"
              >
                <Paperclip className="h-4 w-4" aria-hidden="true" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => imageInputRef.current?.click()}
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                title="Adjuntar imagen"
                aria-label="Adjuntar imagen"
              >
                <ImageIcon className="h-4 w-4" aria-hidden="true" />
              </Button>
              <div className="ml-2 hidden items-center gap-1.5 text-[11px] text-muted-foreground sm:flex">
                <Cpu className="h-3 w-3" aria-hidden="true" />
                <span className="font-mono">gemini-1.5-flash</span>
              </div>
            </div>
            <Button
              size="sm"
              onClick={handleSend}
              disabled={loading || (!input.trim() && attachments.length === 0)}
              className="h-8 gap-1.5 px-3"
            >
              <Send className="h-3.5 w-3.5" aria-hidden="true" />
              Enviar
            </Button>
          </div>
        </div>
        <p className="mt-2 px-1 text-[10px] text-muted-foreground">
          Adjunta JSON de RIPE Atlas, CSV procesados, gráficas o capturas para enriquecer el análisis.
        </p>
      </div>
    </aside>
  )
}

function AttachmentChip({
  attachment,
  onRemove,
}: {
  attachment: Attachment
  onRemove: () => void
}) {
  const isImage = attachment.kind === "image" && attachment.previewUrl

  return (
    <div className="group relative flex items-center gap-2 rounded-md border border-border bg-card py-1 pl-1 pr-7 text-xs">
      {isImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={attachment.previewUrl || "/placeholder.svg"}
          alt={attachment.name}
          className="h-7 w-7 rounded object-cover"
        />
      ) : (
        <div className="flex h-7 w-7 items-center justify-center rounded bg-muted text-muted-foreground">
          <FileText className="h-3.5 w-3.5" aria-hidden="true" />
        </div>
      )}
      <div className="flex max-w-[140px] flex-col">
        <span className="truncate font-medium leading-tight">{attachment.name}</span>
        <span className="font-mono text-[10px] text-muted-foreground">
          {formatBytes(attachment.size)}
        </span>
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
        aria-label={`Quitar ${attachment.name}`}
      >
        <X className="h-3 w-3" aria-hidden="true" />
      </button>
    </div>
  )
}

function ChatBubble({ message }: { message: Message }) {
  const isUser = message.role === "user"

  return (
    <div className={cn("flex gap-3", isUser && "flex-row-reverse")}>
      <div
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-md border",
          isUser
            ? "border-border bg-secondary text-secondary-foreground"
            : "border-primary/20 bg-primary/10 text-primary",
        )}
        aria-hidden="true"
      >
        {isUser ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
      </div>
      <div className={cn("flex max-w-[85%] flex-col gap-1", isUser && "items-end")}>
        {message.attachments && message.attachments.length > 0 ? (
          <div className={cn("flex flex-wrap gap-1.5", isUser && "justify-end")}>
            {message.attachments.map((att) => (
              <div
                key={att.id}
                className="flex items-center gap-1.5 rounded-md border border-border bg-card px-2 py-1 text-[11px]"
              >
                {att.kind === "image" && att.previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={att.previewUrl || "/placeholder.svg"}
                    alt={att.name}
                    className="h-5 w-5 rounded object-cover"
                  />
                ) : (
                  <FileText className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
                )}
                <span className="max-w-[140px] truncate">{att.name}</span>
                <span className="font-mono text-[10px] text-muted-foreground">
                  {formatBytes(att.size)}
                </span>
              </div>
            ))}
          </div>
        ) : null}
        {message.content ? (
          <div
            className={cn(
              "rounded-lg px-3.5 py-2.5 text-sm leading-relaxed",
              isUser
                ? "bg-primary text-primary-foreground"
                : "border border-border bg-card text-card-foreground",
            )}
          >
            {message.content}
          </div>
        ) : null}
        <span className="px-1 font-mono text-[10px] text-muted-foreground">
          {isUser ? "Tú" : "Gemini 1.5"} · {message.timestamp}
        </span>
      </div>
    </div>
  )
}
