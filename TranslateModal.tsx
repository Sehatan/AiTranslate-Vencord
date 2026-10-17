/*
 * Vencord, a modification for Discord's desktop app
 * Copyright (c) 2023 Vendicated and contributors
 * Modified for AiTranslate by Sehatan
 */

import { Divider } from "@components/Divider";
import { FormSwitch } from "@components/FormSwitch";
import { Margins } from "@utils/margins";
import { RenderModalProps } from "@vencord/discord-types";
import { Forms, Modal, openModal, SearchableSelect, useMemo } from "@webpack/common";

import { settings } from "./settings";
import { cl, getLanguages } from "./utils";

const LanguageSettingKeys = ["receivedInput", "receivedOutput", "sentInput", "sentOutput"] as const;

function LanguageSelect({ settingsKey, includeAuto }: { settingsKey: typeof LanguageSettingKeys[number]; includeAuto: boolean; }) {
    const currentValue = settings.use([settingsKey])[settingsKey];

    const options = useMemo(
        () => {
            const options = Object.entries(getLanguages()).map(([value, label]) => ({ value, label }));
            if (!includeAuto)
                options.shift();

            return options;
        }, []
    );

    return (
        <section className={Margins.bottom16}>
            <Forms.FormTitle tag="h3">
                {settings.def[settingsKey].description}
            </Forms.FormTitle>

            <SearchableSelect
                options={options}
                value={options.find(o => o.value === currentValue)?.value}
                placeholder="Select a language"
                maxVisibleItems={5}
                closeOnSelect={true}
                onChange={v => settings.store[settingsKey] = v}
            />
        </section>
    );
}

function SettingToggle({ settingsKey, title }: { settingsKey: "autoTranslate" | "translateOutgoing" | "aiChannelNameDetection" | "serverLanguageFallback" | "showChannelNameDetectionTokens"; title: string; }) {
    const value = settings.use([settingsKey])[settingsKey];

    return (
        <FormSwitch
            title={title}
            description={settings.def[settingsKey].description}
            value={value}
            onChange={v => settings.store[settingsKey] = v}
            hideBorder
        />
    );
}

function TranslateModal({ rootProps }: { rootProps: RenderModalProps; }) {
    const { autoTranslate, aiChannelNameDetection } = settings.use(["autoTranslate", "aiChannelNameDetection"]);

    return (
        <Modal
            {...rootProps}
            title="AI Translate"
        >
            <div className={cl("modal-content")}>
                {LanguageSettingKeys.map(s => (
                    <LanguageSelect
                        key={s}
                        settingsKey={s}
                        includeAuto={s.endsWith("Input")}
                    />
                ))}

                <Divider className={Margins.bottom16} />

                <SettingToggle settingsKey="autoTranslate" title="Auto Translate" />

                {autoTranslate && (
                    <>
                        <SettingToggle settingsKey="aiChannelNameDetection" title="AI channel name detection" />

                        {aiChannelNameDetection && (
                            <>
                                <SettingToggle settingsKey="serverLanguageFallback" title="Use server language as fallback" />
                                <SettingToggle settingsKey="showChannelNameDetectionTokens" title="Show detection token usage" />
                            </>
                        )}
                    </>
                )}

                <SettingToggle settingsKey="translateOutgoing" title="Translate outgoing messages" />
            </div>
        </Modal>
    );
}

export function openTranslateModal() {
    openModal(props => <TranslateModal rootProps={props} />);
}
