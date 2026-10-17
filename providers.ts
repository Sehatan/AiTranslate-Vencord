/*
 * Provider presets for AiTranslate. Only OpenAI-compatible endpoints are listed;
 * "custom" is the fallback for anything not covered by a preset.
 */

export type Provider =
    | "kobold"
    | "openai"
    | "openrouter"
    | "groq"
    | "together"
    | "mistral"
    | "deepseek"
    | "xai"
    | "cerebras"
    | "fireworks"
    | "ollama"
    | "lmstudio"
    | "custom";

export interface ProviderPreset {
    label: string;
    baseUrl: string;
    model: string;
}

export const ProviderPresets: Record<Provider, ProviderPreset> = {
    kobold: {
        label: "KoboldCPP (local)",
        baseUrl: "http://localhost:5001",
        model: "koboldcpp"
    },
    openai: {
        label: "OpenAI",
        baseUrl: "https://api.openai.com/v1",
        model: "gpt-4o-mini"
    },
    openrouter: {
        label: "OpenRouter",
        baseUrl: "https://openrouter.ai/api/v1",
        model: "openai/gpt-4o-mini"
    },
    groq: {
        label: "Groq",
        baseUrl: "https://api.groq.com/openai/v1",
        model: "llama-3.3-70b-versatile"
    },
    together: {
        label: "Together AI",
        baseUrl: "https://api.together.xyz/v1",
        model: "meta-llama/Llama-3.3-70B-Instruct-Turbo"
    },
    mistral: {
        label: "Mistral AI",
        baseUrl: "https://api.mistral.ai/v1",
        model: "mistral-small-latest"
    },
    deepseek: {
        label: "DeepSeek",
        baseUrl: "https://api.deepseek.com/v1",
        model: "deepseek-chat"
    },
    xai: {
        label: "xAI (Grok)",
        baseUrl: "https://api.x.ai/v1",
        model: "grok-4.5"
    },
    cerebras: {
        label: "Cerebras",
        baseUrl: "https://api.cerebras.ai/v1",
        model: "llama-3.3-70b"
    },
    fireworks: {
        label: "Fireworks AI",
        baseUrl: "https://api.fireworks.ai/inference/v1",
        model: "accounts/fireworks/models/llama-v3p3-70b-instruct"
    },
    ollama: {
        label: "Ollama (local)",
        baseUrl: "http://localhost:11434/v1",
        model: "llama3.1"
    },
    lmstudio: {
        label: "LM Studio (local)",
        baseUrl: "http://localhost:1234/v1",
        model: "local-model"
    },
    custom: {
        label: "Other / custom URL",
        baseUrl: "",
        model: ""
    }
};

export const ProviderOptions = (Object.entries(ProviderPresets) as [Provider, ProviderPreset][])
    .map(([value, preset]) => ({
        label: preset.label,
        value,
        ...(value === "kobold" ? { default: true } : {})
    }));
