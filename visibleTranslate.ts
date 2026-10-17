/*
 * Vencord, a modification for Discord's desktop app
 * Copyright (c) 2023 Vendicated and contributors
 * Modified for AiTranslate by Sehatan
 */

import { SelectedChannelStore, showToast } from "@webpack/common";

import { settings } from "./settings";
import { getTranslation, handleTranslate } from "./TranslationAccessory";
import { finishTranslation, isTranslationInFlight, tryStartTranslation } from "./translationInFlight";
import { getTokenCount, translate } from "./utils";
import { getMessageContent, getVisibleMessages, MESSAGE_ITEM_SELECTOR } from "./visibleMessages";

const TRANSLATION_CONCURRENCY = 2;
const AUTO_TRANSLATE_DEBOUNCE_MS = 300;

let translatingVisible = false;
let pendingQuietRun = false;

let autoVisibleEnabled = false;
const AutoVisibleListeners = new Set<() => void>();
let autoTranslateTimer: ReturnType<typeof setTimeout> | undefined;
let autoTranslateObserver: MutationObserver | null = null;

async function mapWithConcurrency<T>(items: T[], limit: number, worker: (item: T) => Promise<void>) {
    let index = 0;

    const workers = Array.from(
        { length: Math.min(limit, items.length) },
        async () => {
            while (index < items.length) {
                const item = items[index++];
                await worker(item);
            }
        }
    );

    await Promise.all(workers);
}

export function isAutoVisibleTranslateEnabled() {
    return autoVisibleEnabled;
}

export function subscribeToAutoVisibleTranslate(listener: () => void) {
    AutoVisibleListeners.add(listener);

    return () => {
        AutoVisibleListeners.delete(listener);
    };
}

function notifyAutoVisible() {
    AutoVisibleListeners.forEach(listener => listener());
}

function scheduleAutoTranslation(delay = AUTO_TRANSLATE_DEBOUNCE_MS) {
    if (!autoVisibleEnabled) return;

    clearTimeout(autoTranslateTimer);
    autoTranslateTimer = setTimeout(() => {
        translateVisibleMessages({ quiet: true });
    }, delay);
}

function handleAutoScroll() {
    scheduleAutoTranslation();
}

function handleAutoChannelChange() {
    scheduleAutoTranslation();
}

function handleAutoMutations(mutations: MutationRecord[]) {
    for (const mutation of mutations) {
        for (const node of Array.from(mutation.addedNodes)) {
            if (node instanceof HTMLElement && (node.matches(MESSAGE_ITEM_SELECTOR) || node.querySelector(MESSAGE_ITEM_SELECTOR))) {
                scheduleAutoTranslation();
                return;
            }
        }
    }
}

export function setAutoVisibleTranslateEnabled(enabled: boolean) {
    if (autoVisibleEnabled === enabled) return;

    autoVisibleEnabled = enabled;
    notifyAutoVisible();

    if (enabled) {
        document.addEventListener("scroll", handleAutoScroll, true);
        SelectedChannelStore.addChangeListener(handleAutoChannelChange);

        autoTranslateObserver = new MutationObserver(handleAutoMutations);
        autoTranslateObserver.observe(document.body, { childList: true, subtree: true });

        translateVisibleMessages({ quiet: true });
        return;
    }

    document.removeEventListener("scroll", handleAutoScroll, true);
    SelectedChannelStore.removeChangeListener(handleAutoChannelChange);

    autoTranslateObserver?.disconnect();
    autoTranslateObserver = null;

    clearTimeout(autoTranslateTimer);
    pendingQuietRun = false;
}

/**
 * One-shot translation of the messages currently visible in the selected
 * channel, plus the scroll-driven variant. Uses the incoming-message language
 * setting as the target, caches results so the same message is not translated
 * twice, and reports the total token usage when Show token usage is enabled.
 */
export async function translateVisibleMessages(options?: { quiet?: boolean; }) {
    if (options?.quiet && !autoVisibleEnabled) return;

    if (translatingVisible) {
        if (options?.quiet) {
            pendingQuietRun = true;
            return;
        }

        showToast({ text: "Visible messages are already being translated.", variant: "default" });
        return;
    }

    const channelId = SelectedChannelStore.getChannelId();
    if (!channelId) return;

    const messages = getVisibleMessages(channelId).filter(message => {
        const content = getMessageContent(message);
        return content && !getTranslation(message.id) && !isTranslationInFlight(message.id);
    });

    if (!messages.length) {
        if (!options?.quiet)
            showToast({ text: "No untranslated visible messages.", variant: "default" });
        return;
    }

    translatingVisible = true;

    let translated = 0;
    let failed = 0;
    let tokens = 0;

    try {
        await mapWithConcurrency(messages, TRANSLATION_CONCURRENCY, async message => {
            if (!tryStartTranslation(message.id)) return;

            try {
                const result = await translate(
                    "received",
                    getMessageContent(message),
                    undefined,
                    { silent: true }
                );

                handleTranslate(message.id, result);
                translated++;
                tokens += getTokenCount(result.usage);
            } catch {
                failed++;
            } finally {
                finishTranslation(message.id);
            }
        });
    } finally {
        translatingVisible = false;

        if (pendingQuietRun) {
            pendingQuietRun = false;
            scheduleAutoTranslation(250);
        }
    }

    if (options?.quiet) return;

    const summary = [`Translated ${translated} visible message${translated === 1 ? "" : "s"}`];

    if (failed)
        summary.push(`${failed} failed`);

    if (settings.store.showTokenUsage && tokens)
        summary.push(`${tokens} token${tokens === 1 ? "" : "s"}`);

    showToast({
        text: summary.join(" · "),
        variant: translated ? (failed ? "default" : "success") : "critical"
    });
}
