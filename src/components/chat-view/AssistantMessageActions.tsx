import * as Tooltip from '@radix-ui/react-tooltip'
import { Check, CopyIcon } from 'lucide-react'
import { useMemo, useState } from 'react'

import { ChatAssistantMessage } from '../../types/chat'
import { calculateLLMCost } from '../../utils/llm/price-calculator'

import LLMResponseInfoPopover from './LLMResponseInfoPopover'

function CopyButton({ message }: { message: ChatAssistantMessage }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content)
      setCopied(true)
      setTimeout(() => {
        setCopied(false)
      }, 1500)
    } catch (error) {
      console.error('Failed to copy message:', error)
      // Fallback approach for iOS (though this may not be supported in all contexts)
      const textArea = document.createElement('textarea')
      textArea.value = message.content
      textArea.style.position = 'fixed'  // Prevent scrolling to bottom of page
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      
      try {
        document.execCommand('copy')
        setCopied(true)
        setTimeout(() => {
          setCopied(false)
        }, 1500)
      } catch (err) {
        console.error('Fallback copy failed:', err)
      }
      
      document.body.removeChild(textArea)
    }
  }

  return (
    <Tooltip.Provider delayDuration={0}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <button onClick={handleCopy}>
            {copied ? (
              <Check
                size={18}
                className="smtcmp-assistant-message-actions-icon--copied"
              />
            ) : (
              <CopyIcon size={18} />
            )}
          </button>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content className="smtcmp-tooltip-content" sideOffset={5}>
            Copy message
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  )
}

function LLMResponesInfoButton({ message }: { message: ChatAssistantMessage }) {
  const cost = useMemo<number | null>(() => {
    if (!message.metadata?.model || !message.metadata?.usage) {
      return 0
    }
    return calculateLLMCost({
      model: message.metadata.model,
      usage: message.metadata.usage,
    })
  }, [message])

  return (
    <Tooltip.Provider delayDuration={0}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <div>
            <LLMResponseInfoPopover
              usage={message.metadata?.usage}
              estimatedPrice={cost}
              model={message.metadata?.model?.model}
            />
          </div>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content className="smtcmp-tooltip-content" sideOffset={5}>
            View details
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  )
}

export default function AssistantMessageActions({
  message,
}: {
  message: ChatAssistantMessage
}) {
  return (
    <div className="smtcmp-assistant-message-actions">
      <LLMResponesInfoButton message={message} />
      <CopyButton message={message} />
    </div>
  )
}
