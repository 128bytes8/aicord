# AiCord

An [Equicord](https://github.com/Equicord/Equicord) userplugin that adds AI-powered message generation and replies to Discord using [OpenRouter](https://openrouter.ai/).

## Features

- **Chat Bar Button** — Click the sparkles icon in the message input to open a generation modal. Write what you want your message to be about, pick a tone, set word count, preview it, then send.
- **Reply with AI** — Right-click any message (or use the hover toolbar) to instantly generate a contextual AI reply.
- **Reply with AI+** — Right-click any message for the enhanced version — opens a modal where you customize the tone, length, and give the AI specific instructions on how to respond.
- **Image Understanding** — When replying to messages with image attachments or embeds, the images are sent to the LLM as multimodal input so the AI can see and react to them.
- **Video Understanding** — Video attachments get 5 frames extracted at evenly-spaced intervals and sent as images to the LLM for visual context.
- **Configurable Settings** — API key, model selection, custom system prompt, default tone, emoji/punctuation toggles, word count range, reply delay simulation, and more.

## Tones

Casual, Professional, Friendly, Enthusiastic, Formal, Humorous, Academic, Pro-Plus, Troll, Bully, Roasting

## Installation

### Prerequisites

- [Equicord](https://github.com/Equicord/Equicord) built from source ([guide](https://docs.equicord.org/plugins))
- An [OpenRouter](https://openrouter.ai/) API key
- A vision-capable model for image/video features (e.g. `openai/gpt-4o`, `anthropic/claude-sonnet-4`, `google/gemini-2.5-flash`)

### Steps

1. Clone this repo into your Equicord `src/userplugins/` directory:

```bash
cd /path/to/Equicord/src/userplugins
git clone https://github.com/128bytes8/aicord.git
```

2. Rebuild Equicord:

```bash
cd /path/to/Equicord
pnpm build
```

3. Restart Discord/Equibop.

4. Go to **Settings > Plugins**, search for **AiCord**, enable it.

5. Open AiCord's settings and paste your OpenRouter API key and configure your preferred model.

## Configuration

| Setting | Description | Default |
|---|---|---|
| API Key | Your OpenRouter API key | — |
| Model Name | OpenRouter model identifier | `openai/gpt-4o-mini` |
| Custom Prompt | System prompt prepended to every request | *(sensible default)* |
| Default Tone | Default writing style | Casual |
| Use Emojis | Include emojis in output | Off |
| Exclamation Marks | Allow `!` in output | On |
| Question Marks | Allow `?` in output | On |
| Word Count Range | Min/max words for generated messages | 5–50 |
| Default Text | Text to include in every generated message | — |
| Reply Delay | Simulated delay before sending | None |
| Typing Indicator | Show typing while generating | On |

## File Structure

```
aicord/
├── index.tsx              # Plugin entry — context menus, popover, chat bar button
├── api.ts                 # OpenRouter API integration (text + multimodal)
├── settings.ts            # Plugin settings definitions
├── style.css              # Modal and component styles
├── utils.ts               # Class name factory
├── videoFrames.ts         # Video frame extraction via canvas
└── components/
    ├── AiCordIcon.tsx         # Sparkles + sparkles-plus SVG icons
    ├── AiCordChatBarButton.tsx # Chat input bar button
    ├── GenerateModal.tsx       # "Generate Message" modal
    └── CustomReplyModal.tsx    # "Reply with AI+" modal
```

## License

GPL-3.0-or-later
