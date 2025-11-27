import { useState } from 'react'
import { useAppStore } from '@/shared/state/appStore'
import { streamSynthesis } from './api/agentsApi'

interface ChatMessage {
  id: string
  prompt: string
  response: string
  isStreaming?: boolean
}

export const SynthesisPanel = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const currentProjectId = useAppStore((state) => state.activeProjectId)

  const handleSubmit = async () => {
    if (!inputValue.trim() || !currentProjectId || isLoading) return

    const userPrompt = inputValue.trim()
    setInputValue('')
    setIsLoading(true)

    const messageId = `msg-${Date.now()}`
    const newMessage: ChatMessage = {
      id: messageId,
      prompt: userPrompt,
      response: '',
      isStreaming: true,
    }

    setMessages((prev) => [...prev, newMessage])

    try {
      const stream = await streamSynthesis({
        project_id: currentProjectId,
        query: userPrompt,
      })

      const reader = stream.getReader()
      const decoder = new TextDecoder()

      let accumulatedResponse = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        accumulatedResponse += chunk

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId
              ? { ...msg, response: accumulatedResponse }
              : msg
          )
        )
      }

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, isStreaming: false } : msg
        )
      )
    } catch (error) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? {
                ...msg,
                response: `Error: ${error instanceof Error ? error.message : 'Failed to get response'}`,
                isStreaming: false,
              }
            : msg
        )
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex h-full flex-col rounded-2xl border border-border-soft bg-surface-contrast p-4 overflow-hidden">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-text-muted flex-shrink-0">
        RAG Synthesis
      </p>
      <div className="mt-4 flex-1 space-y-3 overflow-y-auto text-sm min-h-0">
        {messages.length === 0 ? (
          <p className="text-xs text-text-muted">
            Ask questions about your project's documents...
          </p>
        ) : (
          messages.map((item) => (
            <article
              key={item.id}
              className="rounded-xl border border-border-soft bg-surface-panel p-3"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                Prompt
              </p>
              <p className="mt-1 font-semibold text-text-primary">{item.prompt}</p>
              <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-text-muted">
                Response
              </p>
              <p className="mt-1 whitespace-pre-wrap text-text-primary">
                {item.response}
                {item.isStreaming && <span className="animate-pulse">▋</span>}
              </p>
            </article>
          ))
        )}
      </div>
      <div className="mt-4 flex gap-2 flex-shrink-0">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSubmit()
            }
          }}
          placeholder="Ask about your documents..."
          disabled={isLoading || !currentProjectId}
          className="flex-1 rounded-full border border-border-soft bg-surface-panel px-4 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
        />
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isLoading || !currentProjectId || !inputValue.trim()}
          className="rounded-full bg-accent p-2 text-white shadow transition-colors hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Send message"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  )
}

