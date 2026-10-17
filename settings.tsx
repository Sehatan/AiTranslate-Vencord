/*
 * Vencord, a modification for Discord's desktop app
 * Copyright (c) 2023 Vendicated and contributors
 * Modified for AiTranslate by Sehatan
 */

import { definePluginSettings } from "@api/Settings";
import { Button } from "@components/Button";
import { OptionType } from "@utils/types";
import { showToast, useState } from "@webpack/common";

import { ProviderOptions } from "./providers";
import { openTranslateModal } from "./TranslateModal";
import { testConnection } from "./utils";

function TestConnectionButton() {
    const [testing, setTesting] = useState(false);

    async function test() {
        setTesting(true);
        try {
            const reply = await testConnection();
            const summary = reply.length > 120 ? `${reply.slice(0, 120)}...` : reply;
            showToast({ text: `Connection OK - the model replied: ${summary}`, variant: "success" });
        } catch (e) {
            showToast({ text: e instanceof Error ? e.message : String(e), variant: "critical" });
        } finally {
            setTesting(false);
        }
    }

    return (
        <Button
            disabled={testing}
            onClick={test}
        >
            {testing ? "Testing..." : "Test API connection"}
        </Button>
    );
}

export const settings = definePluginSettings({
    receivedInput: {
        type: OptionType.STRING,
        description: "Language incoming messages are translated from",
        default: "auto",
        hidden: true
    },
    receivedOutput: {
        type: OptionType.STRING,
        description: "Language incoming messages are translated to",
        default: "en",
        hidden: true
    },
    sentInput: {
        type: OptionType.STRING,
        description: "Language your messages are translated from",
        default: "auto",
        hidden: true
    },
    sentOutput: {
        type: OptionType.STRING,
        description: "Language your messages are translated to",
        default: "en",
        hidden: true
    },
    provider: {
        type: OptionType.SELECT,
        displayName: "API provider",
        description: "Pick a preset, or Other / custom URL for a compatible endpoint on a supported provider host or localhost",
        options: ProviderOptions
    },
    apiUrl: {
        type: OptionType.STRING,
        displayName: "API base URL",
        description: "Leave empty to use the selected provider's default URL. For custom providers, use a known provider host or localhost/127.0.0.1; arbitrary remote hosts are blocked by the native bridge",
        placeholder: "Leave empty for the provider default",
        default: ""
    },
    apiKey: {
        type: OptionType.STRING,
        displayName: "API key",
        description: "Sent as a Bearer token. Leave empty for local servers that do not require authentication",
        placeholder: "sk-...",
        default: "",
        componentProps: { type: "password", autoComplete: "off" }
    },
    model: {
        type: OptionType.STRING,
        displayName: "Model",
        description: "Leave empty to use the selected provider's default model. For custom APIs, enter the exact model id the server expects",
        placeholder: "Leave empty for the provider default",
        default: ""
    },
    disableThinking: {
        type: OptionType.BOOLEAN,
        displayName: "Disable thinking",
        description: "Ask reasoning models not to think before translating. Uses the provider's native switch where available and a direct prompt instruction otherwise",
        default: false
    },
    testConnection: {
        type: OptionType.COMPONENT,
        component: () => <TestConnectionButton />
    },
    temperature: {
        type: OptionType.SLIDER,
        displayName: "Temperature",
        description: "Lower values are more accurate and less creative",
        default: 0.2,
        markers: [0, 0.1, 0.2, 0.3, 0.5, 0.7, 1.0],
        stickToMarkers: false
    },
    maxTokens: {
        type: OptionType.NUMBER,
        displayName: "Max tokens",
        description: "Maximum number of tokens to generate for a translation",
        default: 1024,
        componentProps: { min: 64, max: 4096 }
    },
    showTokenUsage: {
        type: OptionType.BOOLEAN,
        displayName: "Show token usage",
        description: "Show how many tokens were used under translated messages",
        default: true
    },
    autoTranslate: {
        type: OptionType.BOOLEAN,
        displayName: "Auto Translate",
        description: "Automatically translate your messages before sending when the channel name contains a supported flag, ISO/country code, or language name, or when the optional AI check finds one. Channels with no recognizable language are left unchanged. You can also Shift+click or right-click the translate button to toggle this",
        default: false
    },
    aiChannelNameDetection: {
        type: OptionType.BOOLEAN,
        displayName: "AI channel name detection",
        description: "Ask your AI provider to identify the language of a channel name that has no flag, ISO code, or language name (for example ogólny -> Polish). This uses provider tokens. Off: only flags, codes and language names are used",
        default: false
    },
    serverLanguageFallback: {
        type: OptionType.BOOLEAN,
        displayName: "Use server language as fallback",
        description: "When the AI check is inconclusive, use the server's preferred language as the target, including English. Only applies when AI channel name detection is on",
        default: true
    },
    showChannelNameDetectionTokens: {
        type: OptionType.BOOLEAN,
        displayName: "Show detection token usage",
        description: "Show how many provider tokens the AI channel-name check used in the translate button tooltip",
        default: true
    },
    translateOutgoing: {
        type: OptionType.BOOLEAN,
        displayName: "Translate outgoing messages",
        description: "Translate messages you send from your set language to the outgoing language you choose. If Auto Translate is also on and the channel name contains a language, that channel language is used instead",
        default: false
    },
    showAutoTranslateTooltip: {
        type: OptionType.BOOLEAN,
        displayName: "Auto Translate tooltip",
        description: "Show a tooltip on the chat bar button when a message is auto-translated",
        default: true
    },
    showChannelLanguageIndicator: {
        type: OptionType.BOOLEAN,
        displayName: "Channel language indicator",
        description: "While Auto Translate is on, show the language detected in the current channel name on the chat bar button before you send. A dash means no language was detected and the channel name will not be used",
        default: true
    },
    manageTranslateSettings: {
        type: OptionType.COMPONENT,
        component: () => (
            <Button onClick={openTranslateModal}>
                Customize translation languages & Auto-Translate
            </Button>
        )
    }
}, {
    aiChannelNameDetection: {
        hidden() { return !this.store.autoTranslate; }
    },
    serverLanguageFallback: {
        hidden() { return !this.store.autoTranslate || !this.store.aiChannelNameDetection; }
    },
    showChannelNameDetectionTokens: {
        hidden() { return !this.store.autoTranslate || !this.store.aiChannelNameDetection; }
    }
}).withPrivateSettings<{
    dismissedAutoTranslateAlert?: boolean;
    dismissedVisibleTranslateWarning?: boolean;
    dismissedAutoVisibleTranslateWarning?: boolean;
    dismissedLiveTranslateWarning?: boolean;
}>();
