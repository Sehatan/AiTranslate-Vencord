## Disclaimer

AiTranslate sends the text you choose to translate, and optionally the channel, server, and category names used for language detection, to the external AI provider you configure. Those requests are subject to that provider's terms and privacy policy and may incur charges. AiTranslate is not affiliated with any provider. Use a restricted API key and avoid translating sensitive content.

# AiTranslate

AI-powered message translation for Vencord, using any OpenAI-compatible chat API. Translate incoming messages, your own outgoing messages, visible chat text, or new messages as they arrive.

> AiTranslate is a **Vencord userplugin**. It is not a BetterDiscord plugin and cannot be installed through the normal Vencord installer.

## Features

- **Incoming translation** — translate a message from its right-click menu or the message popover button.
- **Auto Translate** — translate your outgoing messages automatically using the language found in the channel name.
  - Flags, ISO/country codes, and language names are detected locally with no token cost (`🇯🇵_japanese`, `ES_español`, `general-pl`, `polish-chat`).
  - Optional **AI channel name detection** (off by default) recognizes names written in their own language, such as `ogólny` or `allgemein`. The server and category names are used as context and results are cached per channel.
  - **Server language fallback** uses the server's preferred language, including English, when the channel name is inconclusive.
  - A language badge on the chat bar button previews the target language; Shift-click or right-click the button to toggle Auto Translate.
- **Translate outgoing messages** — optional setting that translates messages you send to your chosen outgoing target; when Auto Translate is on, a channel language takes priority.
- **Three quick-translation chat bar buttons**
  - **Eye** — translate the currently visible messages once. The same one-shot action is also in the message context menu.
  - **Circular arrow** — keep translating messages that become visible while scrolling.
  - **Lightning** — translate new incoming messages in the current channel as they arrive.
  - Each of these buttons has a first-use warning with **Don't show this warning again**.
- **Token controls** — per-message token usage, prompt/completion/reasoning details on hover, and running token totals on the three chat bar buttons. The scrolling and live modes update their totals as messages are translated.
- **Provider presets** — KoboldCPP, OpenAI, OpenRouter, Groq, Together AI, Mistral AI, DeepSeek, xAI, Cerebras, Fireworks AI, Ollama, LM Studio, or any custom OpenAI-compatible URL.
- **Useful settings** — model, temperature, max tokens, **Disable thinking**, **Test API connection**, and a choice of incoming/outgoing source and target languages.

## Installation

1. Set up Vencord from source by following the [official guide](https://docs.vencord.dev/installing/).
2. Open a terminal in your Vencord folder and go to the userplugins directory:

   ```sh
   cd src/userplugins
   ```

3. Clone this repository:

   ```sh
   git clone https://github.com/Sehatan/AiTranslate-Vencord.git
   ```

   This creates `src/userplugins/AiTranslate-Vencord/` with `index.tsx` at its root.

4. Return to the Vencord folder and build:

   ```sh
   cd ../..
   pnpm install --frozen-lockfile
   pnpm build
   pnpm inject
   ```

5. Fully restart Discord.
6. Open **Settings → Vencord → Plugins** and enable **AiTranslate**.

If you previously installed by copying the folder, remove the old copy first so only one copy of the plugin exists in `userplugins`. To update later, run `git pull` inside the cloned folder and rebuild.

More information: [Vencord custom plugins](https://docs.vencord.dev/installing/custom-plugins/).

## Setup

1. Open AiTranslate's plugin settings.
2. Choose an **API provider**, or use **Other / custom URL**.
3. Enter the **API key** if the provider requires one. Local servers can usually leave it empty.
4. Leave **Model** empty to use the preset default, or enter the exact model ID.
5. Click **Test API connection** to verify the endpoint.

The API URL and key are stored in your local Vencord settings. Translation requests go directly from your client to the provider you configure.

## Usage

- Open the **AI Translate** modal from the chat bar button or from the plugin settings to choose incoming/outgoing languages and Auto Translate options.
- Translate a single incoming message from its context menu or popover button.
- Use the three chat bar buttons for visible, scrolling, and live translation.
- When **Show token usage** is enabled, translated messages show their token counts; the chat bar buttons show running totals whenever the provider reports usage.

## Notes

- AI features use provider tokens. Local detection (flags, codes, and language names) is free.
- AI channel name detection is off by default and only runs when enabled.
- Translation quality and supported languages depend on the selected model.
- The scrolling and live chat bar modes are session-only: they turn off when the plugin stops or Discord restarts.

## Credits

Built by **Sehatan**. Made with **DeepSeek Harness**.

License: GPL-3.0-or-later. See [LICENSE](LICENSE).
