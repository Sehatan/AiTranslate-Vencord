/*
 * Vencord, a modification for Discord's desktop app
 * Copyright (c) 2023 Vendicated and contributors
 * Modified for AiTranslate by Sehatan
 */

import { Message } from "@vencord/discord-types";
import { Parser, useEffect, useState } from "@webpack/common";

import { settings } from "./settings";
import { TranslateIcon } from "./TranslateIcon";
import { cl, getTokenCount, TokenUsage, TranslationValue } from "./utils";

export interface TranslationStats {
    count: number;
    tokens: number;
}

const Translations = new Map<string, TranslationValue>();
const TranslationListeners = new Map<string, Set<() => void>>();

let translationStats: TranslationStats = { count: 0, tokens: 0 };
const StatsListeners = new Set<() => void>();

function notifyStats() {
    StatsListeners.forEach(listener => listener());
}

export function getTranslationStats() {
    return translationStats;
}

function recordTranslation(usage?: TokenUsage) {
    translationStats = {
        count: translationStats.count + 1,
        tokens: translationStats.tokens + getTokenCount(usage)
    };

    notifyStats();
}

export function subscribeToTranslationStats(listener: () => void) {
    StatsListeners.add(listener);

    return () => {
        StatsListeners.delete(listener);
    };
}

export function useTranslationStats() {
    const [stats, setStats] = useState(getTranslationStats);

    useEffect(() => {
        setStats(getTranslationStats());
        return subscribeToTranslationStats(() => setStats(getTranslationStats()));
    }, []);

    return stats;
}

export function getTranslation(messageId: string) {
    return Translations.get(messageId);
}

export function handleTranslate(messageId: string, data: TranslationValue) {
    Translations.set(messageId, data);
    recordTranslation(data.usage);
    TranslationListeners.get(messageId)?.forEach(listener => listener());
}

export function dismissTranslation(messageId: string) {
    if (!Translations.delete(messageId)) return;

    TranslationListeners.get(messageId)?.forEach(listener => listener());
}

function subscribeToTranslation(messageId: string, listener: () => void) {
    let listeners = TranslationListeners.get(messageId);
    if (!listeners) {
        listeners = new Set();
        TranslationListeners.set(messageId, listeners);
    }

    listeners.add(listener);

    return () => {
        listeners!.delete(listener);
        if (!listeners!.size) TranslationListeners.delete(messageId);
    };
}

function Dismiss({ onDismiss }: { onDismiss: () => void; }) {
    return (
        <button
            onClick={onDismiss}
            className={cl("dismiss")}
        >
            Dismiss
        </button>
    );
}

function TokenUsageDisplay({ usage }: { usage?: TokenUsage; }) {
    const { showTokenUsage } = settings.use(["showTokenUsage"]);

    if (!showTokenUsage || !usage) return null;

    const tokenCount = usage.totalTokens ?? usage.completionTokens;
    if (tokenCount == null) return null;

    const title = `Prompt: ${usage.promptTokens ?? "?"} · Completion: ${usage.completionTokens ?? "?"}${usage.reasoningTokens != null ? ` · Reasoning: ${usage.reasoningTokens}` : ""}`;

    return (
        <> · <span className={cl("token-usage")} title={title}>{tokenCount} token{tokenCount === 1 ? "" : "s"}</span></>
    );
}

export function TranslationAccessory({ message }: { message: Message; }) {
    const [translation, setTranslation] = useState<TranslationValue | undefined>(() => getTranslation(message.id));

    useEffect(() => {
        // Ignore MessageLinkEmbeds messages
        if ((message as any).vencordEmbeddedBy) return;

        const update = () => setTranslation(getTranslation(message.id));
        update();

        return subscribeToTranslation(message.id, update);
    }, [message.id]);

    if (!translation) return null;

    return (
        <span className={cl("accessory")}>
            <TranslateIcon width={16} height={16} className={cl("accessory-icon")} />
            {Parser.parse(translation.text)}
            <br />
            (translated from {translation.sourceLanguage}
            <TokenUsageDisplay usage={translation.usage} />
            {" - "}
            <Dismiss onDismiss={() => dismissTranslation(message.id)} />)
        </span>
    );
}
