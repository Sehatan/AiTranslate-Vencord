/*
 * Vencord, a modification for Discord's desktop app
 * Copyright (c) 2023 Vendicated and contributors
 * Modified for AiTranslate by Sehatan
 */

import { Message } from "@vencord/discord-types";
import { FluxDispatcher, SelectedChannelStore, UserStore } from "@webpack/common";

import { getTranslation, handleTranslate } from "./TranslationAccessory";
import { finishTranslation, isTranslationInFlight, tryStartTranslation } from "./translationInFlight";
import { hasTranslatableText, translate } from "./utils";
import { getMessageContent } from "./visibleMessages";

const MAX_CONCURRENT_TRANSLATIONS = 2;

let liveEnabled = false;
let listening = false;
let activeTranslations = 0;
let messageQueue: Message[] = [];
const queuedIds = new Set<string>();
const LiveListeners = new Set<() => void>();

export function isLiveTranslateEnabled() {
    return liveEnabled;
}

export function subscribeToLiveTranslate(listener: () => void) {
    LiveListeners.add(listener);

    return () => {
        LiveListeners.delete(listener);
    };
}

function notifyLiveTranslate() {
    LiveListeners.forEach(listener => listener());
}

export function setLiveTranslateEnabled(enabled: boolean) {
    if (liveEnabled === enabled) return;

    liveEnabled = enabled;

    if (!enabled) {
        messageQueue = [];
        queuedIds.clear();
    }

    notifyLiveTranslate();
}

function pumpQueue() {
    while (liveEnabled && activeTranslations < MAX_CONCURRENT_TRANSLATIONS && messageQueue.length) {
        const message = messageQueue.shift();
        if (!message) return;

        queuedIds.delete(message.id);

        if (!tryStartTranslation(message.id)) continue;

        activeTranslations++;

        translate("received", getMessageContent(message), undefined, { silent: true })
            .then(result => handleTranslate(message.id, result))
            .catch(() => { /* live failures are silent; the next message still translates */ })
            .finally(() => {
                finishTranslation(message.id);
                activeTranslations--;
                pumpQueue();
            });
    }
}

function enqueueMessage(message: Message) {
    if (!liveEnabled) return;
    if (getTranslation(message.id) || isTranslationInFlight(message.id) || queuedIds.has(message.id)) return;

    const content = getMessageContent(message);
    if (!content || !hasTranslatableText(content)) return;

    queuedIds.add(message.id);
    messageQueue.push(message);
    pumpQueue();
}

function handleMessageCreate(event: { message?: Message; }) {
    if (!liveEnabled) return;

    const message = event?.message;
    if (!message || !message.author) return;

    if (message.channel_id !== SelectedChannelStore.getChannelId()) return;
    if (message.author.id === UserStore.getCurrentUser()?.id) return;

    enqueueMessage(message);
}

export function startLiveMessageListener() {
    if (listening) return;

    FluxDispatcher.subscribe("MESSAGE_CREATE", handleMessageCreate);
    listening = true;
}

export function stopLiveMessageListener() {
    if (listening) {
        FluxDispatcher.unsubscribe("MESSAGE_CREATE", handleMessageCreate);
        listening = false;
    }

    liveEnabled = false;
    messageQueue = [];
    queuedIds.clear();
    notifyLiveTranslate();
}
