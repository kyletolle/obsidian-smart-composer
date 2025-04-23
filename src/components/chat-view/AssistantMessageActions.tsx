import * as Tooltip from '@radix-ui/react-tooltip'
import { Check, CopyIcon } from 'lucide-react'
import { Platform } from 'obsidian'
import { useMemo, useState } from 'react'

import { ChatAssistantMessage } from '../../types/chat'
import { calculateLLMCost } from '../../utils/llm/price-calculator'

import LLMResponseInfoPopover from './LLMResponseInfoPopover'

// Add iOS-specific styles if on an iOS device
const isIPad = Platform.isMacOS && Platform.isTablet

function CopyButton({ message }: { message: ChatAssistantMessage }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => {
      setCopied(false)
    }, 1500)
  }

  return (
    <Tooltip.Provider delayDuration={0}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <button className={isIPad ? 'ipad-button' : ''}>
            {copied ? (
              <Check
                size={16}
                className="smtcmp-assistant-message-actions-icon--copied"
              />
            ) : (
              <CopyIcon onClick={handleCopy} size={16} />
            )}
          </button>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content className="smtcmp-tooltip-content">
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
          <div className={isIPad ? 'ipad-button' : ''}>
            <LLMResponseInfoPopover
              usage={message.metadata?.usage}
              estimatedPrice={cost}
              model={message.metadata?.model?.model}
            />
          </div>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content className="smtcmp-tooltip-content">
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
    <div
      className={`smtcmp-assistant-message-actions ${isIPad ? 'ios-actions' : ''}`}
    >
      <LLMResponesInfoButton message={message} />
      <CopyButton message={message} />
    </div>
  )
}
