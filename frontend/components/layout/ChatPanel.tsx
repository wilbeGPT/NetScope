"use client"

import { AiChatPanel } from "@/components/chat/ai-chat-panel"

/**
 * ChatPanel — panel izquierdo colapsible con el chat IA (Gemini).
 * Wrapper canónico que delega al componente de implementación.
 */
export function ChatPanel({
  collapsed,
  onToggle,
  activeInvId,
}: {
  collapsed: boolean
  onToggle: () => void
  activeInvId: number
}) {
  return (
    <AiChatPanel
      collapsed={collapsed}
      onToggle={onToggle}
      activeInvId={activeInvId}
    />
  )
}
