import { App, Modal, Notice } from 'obsidian'
import { useState } from 'react'
import { createRoot } from 'react-dom/client'

import SmartComposerPlugin from '../../../../main'
import { ChatModel, chatModelSchema } from '../../../../types/chat-model.types'
import { ObsidianButton } from '../../../common/ObsidianButton'
import { ObsidianSetting } from '../../../common/ObsidianSetting'
import { ObsidianTextInput } from '../../../common/ObsidianTextInput'

type SettingsComponentProps = {
  model: ChatModel
  plugin: SmartComposerPlugin
  onClose: () => void
}

type ModelSettingsRegistry = {
  check: (model: ChatModel) => boolean
  SettingsComponent: React.FC<SettingsComponentProps>
}

// Registry of available model settings
const MODEL_SETTINGS_REGISTRY: ModelSettingsRegistry[] = [
  // OpenAI o1, o1-mini, o3-mini settings
  {
    check: (model) =>
      model.providerType === 'openai' &&
      ['o1', 'o1-mini', 'o3-mini'].includes(model.model ?? ''),

    SettingsComponent: (props: SettingsComponentProps) => {
      const { model, plugin, onClose } = props
      const typedModel = model as ChatModel & { providerType: 'openai' }
      const [reasoningEffort, setReasoningEffort] = useState<string>(
        typedModel.reasoning_effort ?? 'medium',
      )

      const handleSubmit = async () => {
        if (!['low', 'medium', 'high'].includes(reasoningEffort)) {
          new Notice('Reasoning effort must be one of "low", "medium", "high"')
          return
        }

        const updatedModel = {
          ...typedModel,
          reasoning_effort: reasoningEffort,
        }
        await plugin.setSettings({
          ...plugin.settings,
          chatModels: plugin.settings.chatModels.map((m) =>
            m.id === model.id ? updatedModel : m,
          ),
        })
        onClose()
      }

      return (
        <>
          <ObsidianSetting
            name="Reasoning Effort"
            desc={`Controls how much thinking the model does before responding. Must be one of "low", "medium", or "high".`}
          >
            <ObsidianTextInput
              value={reasoningEffort}
              placeholder="low, medium, or high"
              onChange={(value: string) => setReasoningEffort(value)}
            />
          </ObsidianSetting>

          <ObsidianSetting>
            <ObsidianButton text="Save" onClick={handleSubmit} cta />
            <ObsidianButton text="Cancel" onClick={onClose} />
          </ObsidianSetting>
        </>
      )
    },
  },

  // Claude 3.7 Sonnet Thinking settings
  {
    check: (model) =>
      model.providerType === 'anthropic' &&
      model.id === 'claude-3.7-sonnet-thinking',

    SettingsComponent: (props: SettingsComponentProps) => {
      const { model, plugin, onClose } = props
      const typedModel = model as ChatModel & { providerType: 'anthropic' }
      const [budgetTokens, setBudgetTokens] = useState(
        (typedModel.thinking?.budget_tokens ?? 8192).toString(),
      )

      const handleSubmit = async () => {
        const parsedTokens = parseInt(budgetTokens, 10)
        if (isNaN(parsedTokens)) {
          new Notice('Please enter a valid number')
          return
        }

        if (parsedTokens < 1024) {
          new Notice('Budget tokens must be at least 1024')
          return
        }

        const updatedModel = {
          ...typedModel,
          thinking: { budget_tokens: parsedTokens },
        }

        const validationResult = chatModelSchema.safeParse(updatedModel)
        if (!validationResult.success) {
          new Notice(
            validationResult.error.issues.map((v) => v.message).join('\n'),
          )
          return
        }

        await plugin.setSettings({
          ...plugin.settings,
          chatModels: plugin.settings.chatModels.map((m) =>
            m.id === model.id ? updatedModel : m,
          ),
        })
        onClose()
      }

      return (
        <>
          <ObsidianSetting
            name="Budget Tokens"
            desc="The maximum number of tokens that Claude can use for thinking. Must be at least 1024."
            required
          >
            <ObsidianTextInput
              value={budgetTokens}
              placeholder="Number of tokens"
              onChange={(value: string) => setBudgetTokens(value)}
            />
          </ObsidianSetting>

          <ObsidianSetting>
            <ObsidianButton text="Save" onClick={handleSubmit} cta />
            <ObsidianButton text="Cancel" onClick={onClose} />
          </ObsidianSetting>
        </>
      )
    },
  },
]

// Function to find settings for a specific model
function getModelSettings(model: ChatModel): ModelSettingsRegistry | undefined {
  return MODEL_SETTINGS_REGISTRY.find((registry) => registry.check(model))
}

// Check if a model has settings
export function hasChatModelSettings(model: ChatModel): boolean {
  return !!getModelSettings(model)
}

// Modal component for chat model settings
export class ChatModelSettingsModal extends Modal {
  private plugin: SmartComposerPlugin
  private model: ChatModel
  private root: ReturnType<typeof createRoot> | null = null

  constructor(model: ChatModel, app: App, plugin: SmartComposerPlugin) {
    super(app)
    this.plugin = plugin
    this.model = model
  }

  onOpen() {
    const { contentEl } = this
    contentEl.empty()
    this.titleEl.setText(`Edit Chat Model: ${this.model.id}`)

    this.root = createRoot(contentEl)

    const modelSettings = getModelSettings(this.model)
    if (!modelSettings) {
      contentEl.setText('No settings available for this model')
      return
    }

    const { SettingsComponent } = modelSettings
    this.root.render(
      <SettingsComponent
        model={this.model}
        plugin={this.plugin}
        onClose={() => this.close()}
      />,
    )
  }

  onClose() {
    if (this.root) {
      this.root.unmount()
      this.root = null
    }
    const { contentEl } = this
    contentEl.empty()
  }
}
