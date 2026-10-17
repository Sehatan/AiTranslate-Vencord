/*
 * Vencord, a modification for Discord's desktop app
 * Copyright (c) 2023 Vendicated and contributors
 * Modified for AiTranslate by Sehatan
 */

const InFlight = new Set<string>();

export function isTranslationInFlight(messageId: string) {
    return InFlight.has(messageId);
}

export function tryStartTranslation(messageId: string) {
    if (InFlight.has(messageId)) return false;

    InFlight.add(messageId);
    return true;
}

export function finishTranslation(messageId: string) {
    InFlight.delete(messageId);
}
