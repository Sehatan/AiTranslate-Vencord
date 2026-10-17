/*
 * Vencord, a modification for Discord's desktop app
 * Copyright (c) 2023 Vendicated and contributors
 * Modified for AiTranslate by Sehatan
 */

import { ChatBarButton, ChatBarButtonFactory } from "@api/ChatButtons";
import { TooltipContainer } from "@components/TooltipContainer";
import { classes } from "@utils/misc";
import { IconComponent } from "@utils/types";
import { RenderModalProps } from "@vencord/discord-types";
import { ChannelStore, ConfirmModal, GuildStore, openModal, SelectedChannelStore, useEffect, useState, useStateFromStores } from "@webpack/common";

import { detectChannelLanguage, GoogleLanguages, normalizeLanguageCode } from "./languages";
import { settings } from "./settings";
import { openTranslateModal } from "./TranslateModal";
import { cl, detectChannelNameLanguage, getCachedChannelNameDetection } from "./utils";
import type { ChannelNameDetection, TokenUsage } from "./utils";

// Wait before asking the model about a channel name, so quickly hopping through
// servers does not spend a request on every channel you merely scroll past.
const NAME_DETECTION_DELAY_MS = 1200;

export const TranslateIcon: IconComponent = ({ height = 20, width = 20, className }) => {
    return (
        <svg
            viewBox="0 96 960 960"
            height={height}
            width={width}
            className={classes(cl("icon"), className)}
        >
            <path fill="currentColor" d="m475 976 181-480h82l186 480h-87l-41-126H604l-47 126h-82Zm151-196h142l-70-194h-2l-70 194Zm-466 76-55-55 204-204q-38-44-67.5-88.5T190 416h87q17 33 37.5 62.5T361 539q45-47 75-97.5T487 336H40v-80h280v-80h80v80h280v80H567q-22 69-58.5 135.5T419 598l98 99-30 81-127-122-200 200Z" />
        </svg>
    );
};

export let setShouldShowTranslateEnabledTooltip: undefined | ((show: boolean) => void);
export let outgoingTranslateTooltip = "Auto Translate Enabled";

export function setOutgoingTranslateTooltip(text: string) {
    outgoingTranslateTooltip = text;
}

/**
 * The chat bar button reflects the selected channel, so tracking it through the
 * stores keeps the language indicator correct when switching channels or when a
 * channel is renamed while it is open. The server and category names are passed
 * to the language check as context.
 */
interface SelectedChannelInfo {
    id: string;
    name: string;
    guildName: string;
    guildLocale: string;
    categoryName: string;
}

function useSelectedChannelInfo(): SelectedChannelInfo | null {
    return useStateFromStores(
        [SelectedChannelStore, ChannelStore, GuildStore],
        () => {
            const channel = ChannelStore.getChannel(SelectedChannelStore.getChannelId());
            if (!channel) return null;

            const guild = channel.guild_id ? GuildStore.getGuild(channel.guild_id) : undefined;
            const category = channel.parent_id ? ChannelStore.getChannel(channel.parent_id) : undefined;

            return {
                id: channel.id,
                name: channel.name ?? "",
                guildName: guild?.name ?? "",
                guildLocale: guild?.preferredLocale ?? "",
                categoryName: category?.name ?? ""
            };
        }
    );
}

/** Language codes are longer than the badge, so only the base language is shown. */
function shortenLanguageCode(code: string) {
    return code.split("-")[0].toUpperCase();
}

interface InferredChannelLanguage {
    name: string;
    detection: ChannelNameDetection | null;
    pending: boolean;
}

function formatDetectionTokens(usage?: TokenUsage) {
    if (!usage) return null;

    const total = usage.totalTokens
        ?? (usage.promptTokens != null && usage.completionTokens != null
            ? usage.promptTokens + usage.completionTokens
            : usage.completionTokens ?? usage.promptTokens);

    if (total == null) return null;

    const details = [
        usage.promptTokens != null ? `prompt ${usage.promptTokens}` : "",
        usage.completionTokens != null ? `completion ${usage.completionTokens}` : ""
    ].filter(Boolean);

    return `Channel-name check: ${total} token${total === 1 ? "" : "s"}${details.length ? ` (${details.join(", ")})` : ""}.`;
}

function AutoTranslateConfirmModal(props: RenderModalProps) {
    const s = settings.use(["dismissedAutoTranslateAlert"]);

    return (
        <ConfirmModal
            {...props}
            title="AiTranslate Auto-Translate Enabled"
            subtitle="You just enabled Auto Translate! Messages are translated to the language found in the current channel name, either from a flag/code/language name, an AI language check, or the server's language as a fallback. The translate button shows the detected language before you send."
            confirmText="Disable Auto-Translate"
            onConfirm={() => settings.store.autoTranslate = false}
            cancelText="Got it"
            variant="primary"
            checkboxProps={{
                checked: s.dismissedAutoTranslateAlert === true,
                onChange: checked => s.dismissedAutoTranslateAlert = checked,
            }}
        />
    );
}

export const TranslateChatBarIcon: ChatBarButtonFactory = ({ isMainChat }) => {
    const { aiChannelNameDetection, autoTranslate, serverLanguageFallback, showChannelLanguageIndicator, showChannelNameDetectionTokens, translateOutgoing } = settings.use([
        "aiChannelNameDetection",
        "autoTranslate",
        "serverLanguageFallback",
        "showChannelLanguageIndicator",
        "showChannelNameDetectionTokens",
        "translateOutgoing"
    ]);

    const channelInfo = useSelectedChannelInfo();
    const channelName = channelInfo?.name;
    const channelId = channelInfo?.id;
    const guildName = channelInfo?.guildName ?? "";
    const categoryName = channelInfo?.categoryName ?? "";

    const explicitLanguage = channelName ? detectChannelLanguage(channelName) : null;

    // The server's own language is only used together with the AI check, and
    // only when the name is inconclusive; a language found in the name wins.
    const serverLanguage = aiChannelNameDetection && serverLanguageFallback !== false
        ? normalizeLanguageCode(channelInfo?.guildLocale)
        : null;

    const canInferLanguage = !!aiChannelNameDetection
        && !!autoTranslate
        && !!channelName
        && !!channelId
        && !explicitLanguage;

    const [inferred, setInferred] = useState<InferredChannelLanguage | null>(null);

    useEffect(() => {
        if (!canInferLanguage || !channelName || !channelId) {
            setInferred(null);
            return;
        }

        const context = { channelId, guildName, categoryName };
        const cached = getCachedChannelNameDetection(channelName, context);
        if (cached) {
            setInferred({ name: channelName, detection: cached, pending: false });
            return;
        }

        setInferred({ name: channelName, detection: null, pending: true });

        let cancelled = false;
        const timer = setTimeout(async () => {
            const detection = await detectChannelNameLanguage(channelName, context);
            if (!cancelled)
                setInferred({ name: channelName, detection, pending: false });
        }, NAME_DETECTION_DELAY_MS);

        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [channelName, channelId, guildName, categoryName, canInferLanguage]);

    const [shouldShowTranslateEnabledTooltip, setter] = useState(false);
    useEffect(() => {
        setShouldShowTranslateEnabledTooltip = setter;
        return () => { setShouldShowTranslateEnabledTooltip = undefined; };
    }, []);

    if (!isMainChat) return null;

    // Resolved like the send path does, so the badge previews what will happen
    // to the next message instead of guessing.
    const inferredForChannel = inferred?.name === channelName ? inferred : null;
    const inferredLanguage = inferredForChannel?.detection?.language ?? null;
    const detectionUsage = inferredForChannel?.detection?.usage;
    const inferredUsable = inferredLanguage;

    const detectionPending = !!inferredForChannel?.pending;

    // The server language takes over when the channel name is inconclusive.
    const serverLanguageUsable = !detectionPending
        && serverLanguage
        && (inferredLanguage === null || inferredLanguage === "en")
        ? serverLanguage
        : null;

    const language = explicitLanguage ?? inferredUsable ?? serverLanguageUsable;
    const languageSource = explicitLanguage
        ? "marker"
        : inferredUsable
            ? "name"
            : serverLanguageUsable
                ? "server"
                : null;
    const languageName = language
        ? GoogleLanguages[language as keyof typeof GoogleLanguages] ?? language
        : null;

    const showLanguageIndicator = autoTranslate && showChannelLanguageIndicator !== false && !!channelName;

    const tokenSummary = aiChannelNameDetection && showChannelNameDetectionTokens !== false
        ? formatDetectionTokens(detectionUsage)
        : null;

    const baseTooltip = !autoTranslate
        ? "Open AI Translate Modal"
        : !channelName
            ? "Auto Translate is on, but this channel has no name to detect a language from. Messages are not translated."
            : language
                ? languageSource === "marker"
                    ? `Auto Translate is on: ${languageName} found in the #${channelName} channel name. Your messages are translated to ${languageName}.`
                    : languageSource === "name"
                        ? `Auto Translate is on: the channel name #${channelName} looks like ${languageName}. Your messages are translated to ${languageName}.`
                        : inferredLanguage === "en"
                            ? `Auto Translate is on: the channel name #${channelName} looks English, so the server language ${languageName} is used. Your messages are translated to ${languageName}.`
                            : `Auto Translate is on: the channel name #${channelName} is inconclusive, so the server language ${languageName} is used. Your messages are translated to ${languageName}.`
                : detectionPending
                    ? `Auto Translate is on: checking the language of #${channelName}…`
                    : `Auto Translate is on, but no language was detected in #${channelName}. Messages are not translated from the channel name.`;

    const tooltip = tokenSummary ? `${baseTooltip} ${tokenSummary}` : baseTooltip;

    const toggle = () => {
        const newState = !autoTranslate;
        settings.store.autoTranslate = newState;
        if (newState && !settings.store.dismissedAutoTranslateAlert)
            openModal(props => <AutoTranslateConfirmModal {...props} />);
    };

    const button = (
        <ChatBarButton
            tooltip={tooltip}
            onClick={e => {
                if (e.shiftKey) return toggle();
                else openTranslateModal();
            }}
            onContextMenu={toggle}
            buttonProps={{
                "aria-haspopup": "dialog"
            }}
        >
            <span className={cl("chat-indicator")}>
                <TranslateIcon className={cl({ "auto-translate": autoTranslate || translateOutgoing, "chat-button": true })} />
                {showLanguageIndicator && (
                    <span
                        className={cl({
                            "lang-badge": true,
                            "lang-badge-detected": !!language,
                            "lang-badge-pending": detectionPending
                        })}
                        aria-hidden="true"
                    >
                        {language ? shortenLanguageCode(language) : detectionPending ? "…" : "—"}
                    </span>
                )}
            </span>
        </ChatBarButton>
    );

    if (shouldShowTranslateEnabledTooltip && settings.store.showAutoTranslateTooltip)
        return (
            <TooltipContainer text={outgoingTranslateTooltip} forceOpen>
                {button}
            </TooltipContainer>
        );

    return button;
};
