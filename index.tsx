/*
 * Vencord, a modification for Discord's desktop app
 * Copyright (c) 2023 Vendicated and contributors
 * Modified for AiTranslate by Sehatan
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import "./styles.css";

import { addChatBarButton, removeChatBarButton } from "@api/ChatButtons";
import { findGroupChildrenByChildId, NavContextMenuPatchCallback } from "@api/ContextMenu";
import definePlugin from "@utils/types";
import { Message } from "@vencord/discord-types";
import { ChannelStore, GuildStore, Menu } from "@webpack/common";

import { detectChannelLanguage, GoogleLanguages, normalizeLanguageCode } from "./languages";
import { settings } from "./settings";
import { setOutgoingTranslateTooltip, setShouldShowTranslateEnabledTooltip, TranslateChatBarIcon, TranslateIcon } from "./TranslateIcon";
import { handleTranslate, TranslationAccessory } from "./TranslationAccessory";
import { finishTranslation, tryStartTranslation } from "./translationInFlight";
import { detectChannelNameLanguage, hasTranslatableText, translate } from "./utils";
import { AutoVisibleTranslateButton, AutoVisibleTranslateIcon, LiveTranslateButton, LiveTranslateIcon, VisibleTranslateButton, VisibleTranslateIcon } from "./VisibleButtons";
import { getMessageContent } from "./visibleMessages";
import { setAutoVisibleTranslateEnabled, translateVisibleMessages } from "./visibleTranslate";
import { startLiveMessageListener, stopLiveMessageListener } from "./liveTranslate";

const messageCtxPatch: NavContextMenuPatchCallback = (children, { message }: { message: Message; }) => {
    const content = getMessageContent(message);
    const canTranslate = !!content && hasTranslatableText(content);

    const group = findGroupChildrenByChildId("copy-text", children);
    if (!group) return;

    const insertAt = group.findIndex(c => c?.props?.id === "copy-text") + 1;

    if (canTranslate) {
        group.splice(insertAt, 0, (
            <Menu.MenuItem
                id="vc-aitrans"
                label="AI Translate"
                icon={TranslateIcon}
                leadingAccessory={{ type: "icon", icon: TranslateIcon }}
                action={async () => {
                    if (!tryStartTranslation(message.id)) return;

                    try {
                        const trans = await translate("received", content);
                        handleTranslate(message.id, trans);
                    } finally {
                        finishTranslation(message.id);
                    }
                }}
            />
        ));
    }

    group.splice(insertAt + (canTranslate ? 1 : 0), 0, (
        <Menu.MenuItem
            id="vc-aitrans-visible"
            label="AI Translate visible messages"
            icon={TranslateIcon}
            leadingAccessory={{ type: "icon", icon: TranslateIcon }}
            action={() => translateVisibleMessages()}
        />
    ));
};

let tooltipTimeout: any;

export default definePlugin({
    name: "AiTranslate",
    description: "AI-powered translation for incoming and outgoing messages, with the provider and model you choose. Made with DeepSeek Harness.",
    tags: ["Chat", "Utility"],
    authors: [{ name: "Sehatan", id: 538413488146481166n }],
    settings,

    start() {
        addChatBarButton("AiTranslateVisible", VisibleTranslateButton, VisibleTranslateIcon);
        addChatBarButton("AiTranslateVisibleAuto", AutoVisibleTranslateButton, AutoVisibleTranslateIcon);
        addChatBarButton("AiTranslateLive", LiveTranslateButton, LiveTranslateIcon);
        startLiveMessageListener();
    },

    stop() {
        removeChatBarButton("AiTranslateVisible");
        removeChatBarButton("AiTranslateVisibleAuto");
        removeChatBarButton("AiTranslateLive");
        setAutoVisibleTranslateEnabled(false);
        stopLiveMessageListener();
    },

    contextMenus: {
        "message": messageCtxPatch
    },

    translate,

    renderMessageAccessory: props => <TranslationAccessory message={props.message} />,

    chatBarButton: {
        icon: TranslateIcon,
        render: TranslateChatBarIcon
    },

    messagePopoverButton: {
        icon: TranslateIcon,
        render(message: Message) {
            const content = getMessageContent(message);
            if (!content || !hasTranslatableText(content)) return null;

            return {
                label: "AI Translate",
                icon: TranslateIcon,
                message,
                channel: ChannelStore.getChannel(message.channel_id),
                onClick: async () => {
                    if (!tryStartTranslation(message.id)) return;

                    try {
                        const trans = await translate("received", content);
                        handleTranslate(message.id, trans);
                    } finally {
                        finishTranslation(message.id);
                    }
                }
            };
        }
    },

    async onBeforeMessageSend(channelId, message, _options, props) {
        const { aiChannelNameDetection, autoTranslate, translateOutgoing, sentInput, sentOutput, serverLanguageFallback } = settings.store;
        if (!autoTranslate && !translateOutgoing) return;
        if (!message.content || !hasTranslatableText(message.content)) return;

        const channel = props?.channel ?? ChannelStore.getChannel(channelId);
        const channelName = channel?.name?.trim() || "";
        const guild = channel?.guild_id ? GuildStore.getGuild(channel.guild_id) : undefined;
        const category = channel?.parent_id ? ChannelStore.getChannel(channel.parent_id) : undefined;

        // Explicit markers stay specific. The chosen outgoing language covers every other send.
        let targetLanguage: string | null = autoTranslate && channelName
            ? detectChannelLanguage(channelName)
            : null;

        // Without a marker, ask the model, passing the server and category names
        // as context so mixed or ambiguous channel names can still be resolved.
        if (!targetLanguage && autoTranslate && channelName && aiChannelNameDetection) {
            const detection = await detectChannelNameLanguage(channelName, {
                channelId: channel?.id ?? channelId,
                guildName: guild?.name,
                categoryName: category?.name
            });

            if (detection.language) {
                targetLanguage = detection.language;
            } else if (serverLanguageFallback !== false) {
                // The name is inconclusive; the server's preferred language is
                // a better target than leaving the channel unhandled.
                const serverLanguage = normalizeLanguageCode(guild?.preferredLocale);
                if (serverLanguage)
                    targetLanguage = serverLanguage;
            }
        }

        if (targetLanguage) {
            const languageName = GoogleLanguages[targetLanguage as keyof typeof GoogleLanguages] ?? targetLanguage;
            setOutgoingTranslateTooltip(`Auto-translated to ${languageName}`);
        } else if (translateOutgoing && sentOutput && sentOutput !== "auto") {
            const sameLanguage = !!sentInput && sentInput !== "auto" && sentInput === sentOutput;
            if (!sameLanguage) {
                targetLanguage = sentOutput;
                const languageName = GoogleLanguages[sentOutput as keyof typeof GoogleLanguages] ?? sentOutput;
                setOutgoingTranslateTooltip(`Translated to ${languageName}`);
            }
        }

        if (!targetLanguage) return;

        setShouldShowTranslateEnabledTooltip?.(true);
        clearTimeout(tooltipTimeout);
        tooltipTimeout = setTimeout(() => setShouldShowTranslateEnabledTooltip?.(false), 2000);

        const trans = await translate("sent", message.content, targetLanguage);
        message.content = trans.text;
    }
});
