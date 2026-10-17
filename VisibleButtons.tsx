/*
 * Vencord, a modification for Discord's desktop app
 * Copyright (c) 2023 Vendicated and contributors
 * Modified for AiTranslate by Sehatan
 */

import { ChatBarButton, ChatBarButtonFactory } from "@api/ChatButtons";
import { classes } from "@utils/misc";
import { IconComponent } from "@utils/types";
import { RenderModalProps } from "@vencord/discord-types";
import { ConfirmModal, openModal, useEffect, useState } from "@webpack/common";

import { settings } from "./settings";
import { useTranslationStats } from "./TranslationAccessory";
import type { TranslationStats } from "./TranslationAccessory";
import { cl } from "./utils";
import { isLiveTranslateEnabled, setLiveTranslateEnabled, subscribeToLiveTranslate } from "./liveTranslate";
import {
    isAutoVisibleTranslateEnabled,
    setAutoVisibleTranslateEnabled,
    subscribeToAutoVisibleTranslate,
    translateVisibleMessages
} from "./visibleTranslate";

export const VisibleTranslateIcon: IconComponent = ({ height = 20, width = 20, className }) => {
    return (
        <svg
            viewBox="0 0 24 24"
            height={height}
            width={width}
            className={classes(cl("icon"), className)}
        >
            <path fill="currentColor" d="M12 5C5.7 5 2 12 2 12s3.7 7 10 7 10-7 10-7-3.7-7-10-7Zm0 12c-4.6 0-7.6-4.4-8-5.2.4-.8 3.4-5.2 8-5.2s7.6 4.4 8 5.2c-.4.8-3.4 5.2-8 5.2Z" />
            <path fill="currentColor" d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Zm0 2a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Z" />
        </svg>
    );
};

export const AutoVisibleTranslateIcon: IconComponent = ({ height = 20, width = 20, className }) => {
    return (
        <svg
            viewBox="0 0 24 24"
            height={height}
            width={width}
            className={classes(cl("icon"), className)}
        >
            <path fill="currentColor" d="M17.65 6.35A8 8 0 1 0 19.73 14h-2.08A6 6 0 1 1 16.24 7.76L13 11h8V3l-3.35 3.35Z" />
        </svg>
    );
};

export const LiveTranslateIcon: IconComponent = ({ height = 20, width = 20, className }) => {
    return (
        <svg
            viewBox="0 0 24 24"
            height={height}
            width={width}
            className={classes(cl("icon"), className)}
        >
            <path fill="currentColor" d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" />
        </svg>
    );
};

function formatTokenCount(tokens: number) {
    if (tokens >= 1_000_000)
        return `${(tokens / 1_000_000).toFixed(1).replace(/\.0$/, "")}m`;
    if (tokens >= 1000)
        return `${(tokens / 1000).toFixed(1).replace(/\.0$/, "")}k`;

    return String(tokens);
}

function statsSuffix(stats: TranslationStats) {
    return stats.count
        ? ` · ${stats.count} translated · ${stats.tokens.toLocaleString()} tokens`
        : "";
}

function TokenBadge({ stats }: { stats: TranslationStats; }) {
    if (!stats.tokens) return null;

    return (
        <span
            className={cl("token-badge")}
            title={`${stats.count} translated message${stats.count === 1 ? "" : "s"} · ${stats.tokens.toLocaleString()} tokens`}
        >
            {formatTokenCount(stats.tokens)}
        </span>
    );
}

function useAutoVisibleEnabled() {
    const [enabled, setEnabled] = useState(isAutoVisibleTranslateEnabled);

    useEffect(() => {
        setEnabled(isAutoVisibleTranslateEnabled());
        return subscribeToAutoVisibleTranslate(() => setEnabled(isAutoVisibleTranslateEnabled()));
    }, []);

    return enabled;
}

function useLiveTranslateEnabled() {
    const [enabled, setEnabled] = useState(isLiveTranslateEnabled);

    useEffect(() => {
        setEnabled(isLiveTranslateEnabled());
        return subscribeToLiveTranslate(() => setEnabled(isLiveTranslateEnabled()));
    }, []);

    return enabled;
}

function VisibleTranslateWarning({ onAccept, ...props }: RenderModalProps & { onAccept: () => void; }) {
    const s = settings.use(["dismissedVisibleTranslateWarning"]);

    return (
        <ConfirmModal
            {...props}
            title="Translate visible messages?"
            subtitle="This sends the messages currently visible in this channel to your AI provider. It uses tokens. Messages that already have a translation are skipped."
            confirmText="Translate"
            cancelText="Cancel"
            variant="primary"
            onConfirm={onAccept}
            checkboxProps={{
                checked: s.dismissedVisibleTranslateWarning === true,
                onChange: checked => s.dismissedVisibleTranslateWarning = checked,
                label: "Don't show this warning again"
            }}
        />
    );
}

function AutoVisibleTranslateWarning({ onAccept, ...props }: RenderModalProps & { onAccept: () => void; }) {
    const s = settings.use(["dismissedAutoVisibleTranslateWarning"]);

    return (
        <ConfirmModal
            {...props}
            title="Auto-translate visible messages?"
            subtitle="While enabled, all currently visible messages and any messages that become visible as you scroll are sent to your AI provider automatically. This can use a lot of tokens."
            confirmText="Enable"
            cancelText="Cancel"
            variant="primary"
            onConfirm={onAccept}
            checkboxProps={{
                checked: s.dismissedAutoVisibleTranslateWarning === true,
                onChange: checked => s.dismissedAutoVisibleTranslateWarning = checked,
                label: "Don't show this warning again"
            }}
        />
    );
}

function LiveTranslateWarning({ onAccept, ...props }: RenderModalProps & { onAccept: () => void; }) {
    const s = settings.use(["dismissedLiveTranslateWarning"]);

    return (
        <ConfirmModal
            {...props}
            title="Translate live messages?"
            subtitle="While enabled, new incoming messages in the current channel are translated as they arrive. This uses tokens for every message."
            confirmText="Enable"
            cancelText="Cancel"
            variant="primary"
            onConfirm={onAccept}
            checkboxProps={{
                checked: s.dismissedLiveTranslateWarning === true,
                onChange: checked => s.dismissedLiveTranslateWarning = checked,
                label: "Don't show this warning again"
            }}
        />
    );
}

export const VisibleTranslateButton: ChatBarButtonFactory = ({ isMainChat }) => {
    const stats = useTranslationStats();

    if (!isMainChat) return null;

    const run = () => translateVisibleMessages();

    const onClick = () => {
        if (settings.store.dismissedVisibleTranslateWarning) {
            run();
            return;
        }

        openModal(props => <VisibleTranslateWarning {...props} onAccept={run} />);
    };

    return (
        <ChatBarButton
            tooltip={`Translate visible messages${statsSuffix(stats)}`}
            onClick={onClick}
        >
            <span className={cl("chat-indicator")}>
                <VisibleTranslateIcon className={cl("chat-button")} />
                <TokenBadge stats={stats} />
            </span>
        </ChatBarButton>
    );
};

export const AutoVisibleTranslateButton: ChatBarButtonFactory = ({ isMainChat }) => {
    const stats = useTranslationStats();
    const enabled = useAutoVisibleEnabled();

    if (!isMainChat) return null;

    const enable = () => setAutoVisibleTranslateEnabled(true);

    const onClick = () => {
        if (enabled) {
            setAutoVisibleTranslateEnabled(false);
            return;
        }

        if (settings.store.dismissedAutoVisibleTranslateWarning) {
            enable();
            return;
        }

        openModal(props => <AutoVisibleTranslateWarning {...props} onAccept={enable} />);
    };

    return (
        <ChatBarButton
            tooltip={`${enabled ? "Disable" : "Enable"} auto-translate visible messages${statsSuffix(stats)}`}
            onClick={onClick}
        >
            <span className={cl("chat-indicator")}>
                <AutoVisibleTranslateIcon className={cl({ "auto-translate": enabled, "chat-button": true })} />
                <TokenBadge stats={stats} />
            </span>
        </ChatBarButton>
    );
};

export const LiveTranslateButton: ChatBarButtonFactory = ({ isMainChat }) => {
    const stats = useTranslationStats();
    const enabled = useLiveTranslateEnabled();

    if (!isMainChat) return null;

    const enable = () => setLiveTranslateEnabled(true);

    const onClick = () => {
        if (enabled) {
            setLiveTranslateEnabled(false);
            return;
        }

        if (settings.store.dismissedLiveTranslateWarning) {
            enable();
            return;
        }

        openModal(props => <LiveTranslateWarning {...props} onAccept={enable} />);
    };

    return (
        <ChatBarButton
            tooltip={`${enabled ? "Disable" : "Enable"} live message translation${statsSuffix(stats)}`}
            onClick={onClick}
        >
            <span className={cl("chat-indicator")}>
                <LiveTranslateIcon className={cl({ "auto-translate": enabled, "chat-button": true })} />
                <TokenBadge stats={stats} />
            </span>
        </ChatBarButton>
    );
};
