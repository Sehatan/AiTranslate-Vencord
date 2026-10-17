/*
 * Vencord, a modification for Discord's desktop app
 * Copyright (c) 2023 Vendicated and contributors
 * Modified for AiTranslate by Sehatan
 */

import { Message } from "@vencord/discord-types";
import { MessageStore } from "@webpack/common";

export const MESSAGE_ITEM_SELECTOR = '[id^="chat-messages-"],[data-list-item-id^="chat-messages"]';
const MAX_VISIBLE_MESSAGES = 50;

function messageIdOf(element: HTMLElement) {
    const value = element.getAttribute("data-list-item-id") ?? element.id;
    return value.match(/(\d{17,20})$/)?.[1];
}

function scrollerOf(element: HTMLElement) {
    let parent = element.parentElement;

    while (parent) {
        const { overflowY } = getComputedStyle(parent);
        if (/(auto|scroll)/.test(overflowY) && parent.scrollHeight > parent.clientHeight)
            return parent;

        parent = parent.parentElement;
    }

    return null;
}

/**
 * The message list is virtualised, so "visible" means the message items that
 * are currently rendered and intersect the channel scroller's viewport.
 * Messages that are scrolled out of view are picked up on the next run.
 */
export function getVisibleMessages(channelId: string): Message[] {
    if (!channelId) return [];

    const elements = Array.from(document.querySelectorAll<HTMLElement>(MESSAGE_ITEM_SELECTOR));
    if (!elements.length) return [];

    const scroller = scrollerOf(elements[0]);
    const bounds = scroller
        ? scroller.getBoundingClientRect()
        : { top: 0, bottom: window.innerHeight };

    const seen = new Set<string>();
    const messages: Message[] = [];

    for (const element of elements) {
        if (messages.length >= MAX_VISIBLE_MESSAGES) break;

        const messageId = messageIdOf(element);
        if (!messageId || seen.has(messageId)) continue;

        const rect = element.getBoundingClientRect();
        if (rect.height <= 0 || rect.bottom <= bounds.top || rect.top >= bounds.bottom) continue;

        const message = MessageStore.getMessage(channelId, messageId);
        if (!message || (message as any).vencordEmbeddedBy) continue;

        seen.add(messageId);
        messages.push(message);
    }

    return messages;
}

export function getMessageContent(message: Message) {
    return message.content
        || message.messageSnapshots?.[0]?.message.content
        || message.embeds?.find(embed => embed.type === "auto_moderation_message")?.rawDescription
        || "";
}
