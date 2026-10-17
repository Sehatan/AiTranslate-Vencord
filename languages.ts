/*
 * Simplified language list based on Google Translate (works well with LLMs)
 */

export const GoogleLanguages = {
    "auto": "Detect language",
    "af": "Afrikaans",
    "sq": "Albanian",
    "am": "Amharic",
    "ar": "Arabic",
    "hy": "Armenian",
    "az": "Azerbaijani",
    "eu": "Basque",
    "be": "Belarusian",
    "bn": "Bengali",
    "bs": "Bosnian",
    "bg": "Bulgarian",
    "ca": "Catalan",
    "ceb": "Cebuano",
    "zh-CN": "Chinese (Simplified)",
    "zh-TW": "Chinese (Traditional)",
    "co": "Corsican",
    "hr": "Croatian",
    "cs": "Czech",
    "da": "Danish",
    "nl": "Dutch",
    "en": "English",
    "eo": "Esperanto",
    "et": "Estonian",
    "fi": "Finnish",
    "fr": "French",
    "fy": "Frisian",
    "gl": "Galician",
    "ka": "Georgian",
    "de": "German",
    "el": "Greek",
    "gu": "Gujarati",
    "ht": "Haitian Creole",
    "ha": "Hausa",
    "haw": "Hawaiian",
    "he": "Hebrew",
    "hi": "Hindi",
    "hmn": "Hmong",
    "hu": "Hungarian",
    "is": "Icelandic",
    "ig": "Igbo",
    "id": "Indonesian",
    "ga": "Irish",
    "it": "Italian",
    "ja": "Japanese",
    "jw": "Javanese",
    "kn": "Kannada",
    "kk": "Kazakh",
    "km": "Khmer",
    "ko": "Korean",
    "ku": "Kurdish",
    "ky": "Kyrgyz",
    "lo": "Lao",
    "la": "Latin",
    "lv": "Latvian",
    "lt": "Lithuanian",
    "lb": "Luxembourgish",
    "mk": "Macedonian",
    "mg": "Malagasy",
    "ms": "Malay",
    "ml": "Malayalam",
    "mt": "Maltese",
    "mi": "Maori",
    "mr": "Marathi",
    "mn": "Mongolian",
    "my": "Myanmar (Burmese)",
    "ne": "Nepali",
    "no": "Norwegian",
    "ny": "Chichewa",
    "ps": "Pashto",
    "fa": "Persian",
    "pl": "Polish",
    "pt": "Portuguese",
    "pa": "Punjabi",
    "ro": "Romanian",
    "ru": "Russian",
    "sm": "Samoan",
    "gd": "Scots Gaelic",
    "sr": "Serbian",
    "st": "Sesotho",
    "sn": "Shona",
    "sd": "Sindhi",
    "si": "Sinhala",
    "sk": "Slovak",
    "sl": "Slovenian",
    "so": "Somali",
    "es": "Spanish",
    "su": "Sundanese",
    "sw": "Swahili",
    "sv": "Swedish",
    "tg": "Tajik",
    "ta": "Tamil",
    "tt": "Tatar",
    "te": "Telugu",
    "th": "Thai",
    "tr": "Turkish",
    "tk": "Turkmen",
    "uk": "Ukrainian",
    "ur": "Urdu",
    "ug": "Uyghur",
    "uz": "Uzbek",
    "vi": "Vietnamese",
    "cy": "Welsh",
    "xh": "Xhosa",
    "yi": "Yiddish",
    "yo": "Yoruba",
    "zu": "Zulu"
} as const;

export type ChannelLanguageCode = Exclude<keyof typeof GoogleLanguages, "auto">;

export const SupportedLanguageCodes = (Object.keys(GoogleLanguages) as Array<keyof typeof GoogleLanguages>)
    .filter((code): code is ChannelLanguageCode => code !== "auto");

function normalizeChannelLanguageMarker(value: string) {
    return value
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

const ExtraChannelLanguageCodeAliases: Partial<Record<ChannelLanguageCode, string[]>> = {
    en: ["us", "gb", "uk"],
    ja: ["jp"],
    ko: ["kr"],
    pt: ["br"],
    uk: ["ua"],
    vi: ["vn"],
    "zh-CN": ["cn", "zh"],
    "zh-TW": ["tw"]
};

const ExtraChannelLanguageNameAliases: Partial<Record<ChannelLanguageCode, string[]>> = {
    es: ["espanol"],
    pt: ["portugues"],
    "zh-CN": ["chinese", "simplified-chinese"],
    "zh-TW": ["traditional-chinese"],
    my: ["burmese", "myanmar"]
};

const ChannelLanguageFlags: Partial<Record<ChannelLanguageCode, string[]>> = {
    ar: ["🇸🇦", "🇦🇪"],
    bg: ["🇧🇬"],
    cs: ["🇨🇿"],
    da: ["🇩🇰"],
    de: ["🇩🇪", "🇦🇹"],
    el: ["🇬🇷"],
    en: ["🇺🇸", "🇬🇧"],
    es: ["🇪🇸"],
    et: ["🇪🇪"],
    fi: ["🇫🇮"],
    fr: ["🇫🇷"],
    he: ["🇮🇱"],
    hr: ["🇭🇷"],
    hu: ["🇭🇺"],
    id: ["🇮🇩"],
    is: ["🇮🇸"],
    it: ["🇮🇹"],
    ja: ["🇯🇵"],
    ko: ["🇰🇷"],
    lt: ["🇱🇹"],
    lv: ["🇱🇻"],
    nl: ["🇳🇱"],
    no: ["🇳🇴"],
    pl: ["🇵🇱"],
    pt: ["🇧🇷", "🇵🇹"],
    ro: ["🇷🇴"],
    ru: ["🇷🇺"],
    sk: ["🇸🇰"],
    sl: ["🇸🇮"],
    sr: ["🇷🇸"],
    sv: ["🇸🇪"],
    th: ["🇹🇭"],
    tr: ["🇹🇷"],
    uk: ["🇺🇦"],
    vi: ["🇻🇳"],
    "zh-CN": ["🇨🇳"],
    "zh-TW": ["🇹🇼"]
};

function buildChannelLanguageAliases(
    selector: (code: ChannelLanguageCode, languageName: string) => string[]
) {
    return Object.entries(GoogleLanguages)
        .filter(([code]) => code !== "auto")
        .flatMap(([code, languageName]) => {
            const languageCode = code as ChannelLanguageCode;
            const aliases = new Set(
                selector(languageCode, languageName)
                    .map(normalizeChannelLanguageMarker)
                    .filter(Boolean)
            );

            return [...aliases].map(alias => ({ alias, code: languageCode }));
        });
}

const ChannelLanguageCodeAliases = buildChannelLanguageAliases((code) => [
    code,
    ...(ExtraChannelLanguageCodeAliases[code] ?? [])
]);

const ChannelLanguageNameAliases = buildChannelLanguageAliases((code, languageName) => [
    languageName,
    ...(ExtraChannelLanguageNameAliases[code] ?? [])
]);

function detectFromAliases(
    normalizedName: string,
    aliases: Array<{ alias: string; code: ChannelLanguageCode; }>
): ChannelLanguageCode | null {
    const paddedName = `-${normalizedName}-`;
    const matches = new Set<ChannelLanguageCode>();

    for (const { alias, code } of aliases) {
        if (paddedName.includes(`-${alias}-`))
            matches.add(code);
    }

    return matches.size === 1 ? [...matches][0] : null;
}

/**
 * Exact ISO codes beat country aliases: "uk" is the Ukrainian language code, so
 * it should not be swallowed by the English aliases for the United Kingdom.
 * Country aliases like "us", "gb", "br" and "cn" are not language codes, so they
 * still fall through to the alias pass below.
 */
function detectExactLanguageCode(normalizedName: string): ChannelLanguageCode | null {
    const paddedName = `-${normalizedName}-`;
    const matches = new Set<ChannelLanguageCode>();

    for (const code of SupportedLanguageCodes) {
        if (paddedName.includes(`-${code.toLowerCase()}-`))
            matches.add(code);
    }

    return matches.size === 1 ? [...matches][0] : null;
}

/**
 * Detect a target language from a Discord channel name.
 *
 * Priority is: flag emoji -> exact ISO code -> ISO/country code -> full language
 * name. Text markers must occupy whole channel-name segments, so "pl-chat"
 * matches Polish while "planet-chat" does not. If no supported marker is
 * present, null is returned and the name-based detection can take over.
 */
export function detectChannelLanguage(channelName?: string | null): ChannelLanguageCode | null {
    if (!channelName) return null;

    // Priority 1: flag emoji markers.
    const flagMatches = new Set<ChannelLanguageCode>();
    for (const [code, flags] of Object.entries(ChannelLanguageFlags) as [ChannelLanguageCode, string[]][]) {
        if (flags.some(flag => channelName.includes(flag)))
            flagMatches.add(code);
    }

    if (flagMatches.size === 1)
        return [...flagMatches][0];
    if (flagMatches.size > 1)
        return null;

    const normalizedName = normalizeChannelLanguageMarker(channelName);
    if (!normalizedName) return null;

    // Priority 2: a literal language code such as "uk" or "pl".
    const exactCodeMatch = detectExactLanguageCode(normalizedName);
    if (exactCodeMatch)
        return exactCodeMatch;

    // Priority 3: ISO/language codes and server-style country prefixes.
    const codeMatch = detectFromAliases(normalizedName, ChannelLanguageCodeAliases);
    if (codeMatch)
        return codeMatch;

    // Priority 4: full language names and localized name aliases.
    return detectFromAliases(normalizedName, ChannelLanguageNameAliases);
}

/**
 * Resolve the outgoing target language using the channel object Discord passes
 * to onBeforeMessageSend. ChannelStore is only a fallback when that name is
 * unavailable, preventing stale store data from translating the wrong channel.
 */
export function resolveOutgoingChannelLanguage(
    propsChannelName?: string | null,
    storeChannelName?: string | null
): ChannelLanguageCode | null {
    if (propsChannelName?.trim())
        return detectChannelLanguage(propsChannelName);

    return detectChannelLanguage(storeChannelName);
}

// ---------------------------------------------------------------------------
// Language identification of the channel name itself
//
// Markers (flags, codes, language names) only work when the server follows that
// convention. Servers that simply name their channels in their own language
// ("ogólny", "allgemein", "общий") have no marker at all, so the AI is asked to
// identify the name's language. normalizeLanguageCode makes the model's answer
// safe to use: anything that is not a supported code is treated as "unknown".
// ---------------------------------------------------------------------------

/** Codes models use instead of the Google-style ones this plugin stores. */
const LanguageCodeAliases: Record<string, ChannelLanguageCode> = {
    // Legacy Google/ISO tags and common region variants
    "zh": "zh-CN",
    "zh-cn": "zh-CN",
    "zh-hans": "zh-CN",
    "cmn": "zh-CN",
    "zh-tw": "zh-TW",
    "zh-hant": "zh-TW",
    "zh-hk": "zh-TW",
    "yue": "zh-TW",
    "pt-br": "pt",
    "pt-pt": "pt",
    "en-us": "en",
    "en-gb": "en",
    "es-419": "es",
    "es-mx": "es",
    "sr-latn": "sr",
    "iw": "he",
    "in": "id",
    "jv": "jw",
    "nb": "no",
    "nn": "no",

    // ISO 639-2/639-3 codes some models reply with
    afr: "af", amh: "am", ara: "ar", aze: "az", bel: "be", ben: "bn", bos: "bs",
    bul: "bg", cat: "ca", ceb: "ceb", cos: "co", cym: "cy", wel: "cy", ces: "cs",
    cze: "cs", dan: "da", deu: "de", ger: "de", ell: "el", gre: "el", eng: "en",
    epo: "eo", est: "et", eus: "eu", baq: "eu", fas: "fa", per: "fa", fin: "fi",
    fra: "fr", fre: "fr", fry: "fy", gle: "ga", iri: "ga", glg: "gl", guj: "gu",
    hat: "ht", hau: "ha", haw: "haw", heb: "he", hin: "hi", hmn: "hmn", hrv: "hr",
    hun: "hu", hye: "hy", arm: "hy", ibo: "ig", ind: "id", isl: "is", ice: "is",
    ita: "it", jav: "jw", jpn: "ja", kan: "kn", kat: "ka", geo: "ka", kaz: "kk",
    khm: "km", kir: "ky", kor: "ko", kur: "ku", lao: "lo", lat: "la", lav: "lv",
    lit: "lt", ltz: "lb", mal: "ml", mar: "mr", mkd: "mk", mac: "mk", mlg: "mg",
    mlt: "mt", mon: "mn", mri: "mi", msa: "ms", may: "ms", mya: "my", bur: "my",
    nep: "ne", nld: "nl", dut: "nl", nor: "no", nya: "ny", pan: "pa", pol: "pl",
    por: "pt", pus: "ps", ron: "ro", rum: "ro", rus: "ru", sin: "si", slk: "sk",
    slo: "sk", slv: "sl", smo: "sm", sna: "sn", snd: "sd", som: "so",
    sot: "st", spa: "es", sqi: "sq", alb: "sq", srp: "sr", sun: "su", swa: "sw",
    swe: "sv", tam: "ta", tat: "tt", tel: "te", tgk: "tg", tha: "th", tuk: "tk",
    tur: "tr", uig: "ug", ukr: "uk", urd: "ur", uzb: "uz", vie: "vi", xho: "xh",
    yid: "yi", yor: "yo", zho: "zh-CN", chi: "zh-CN", zul: "zu"
};

/** Language names a model may reply with instead of a code. */
const LanguageNameAliases: Record<string, ChannelLanguageCode> = {
    "chinese": "zh-CN",
    "mandarin": "zh-CN",
    "simplified chinese": "zh-CN",
    "traditional chinese": "zh-TW",
    "cantonese": "zh-TW",
    "castilian": "es",
    "farsi": "fa",
    "persian": "fa",
    "burmese": "my",
    "myanmar": "my",
    "flemish": "nl",
    "brazilian portuguese": "pt",
    "gaelic": "gd"
};

function normalizeLookupValue(value: string) {
    return value
        .trim()
        .toLowerCase()
        .replace(/_/g, "-")
        .replace(/\s+/g, " ");
}

function escapeRegExp(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function toSupportedLanguageCode(value: string): ChannelLanguageCode | null {
    const normalized = normalizeLookupValue(value);
    if (!normalized) return null;

    const alias = LanguageCodeAliases[normalized];
    if (alias) return alias;

    for (const code of SupportedLanguageCodes) {
        if (code.toLowerCase() === normalized)
            return code;
    }

    // Locale tags such as es-ES, de-DE or fr-CA carry the language first.
    const base = normalized.split("-")[0];
    if (base && base !== normalized) {
        const baseAlias = LanguageCodeAliases[base];
        if (baseAlias) return baseAlias;

        for (const code of SupportedLanguageCodes) {
            if (code.toLowerCase() === base)
                return code;
        }
    }

    return null;
}

function toSupportedLanguageName(text: string): ChannelLanguageCode | null {
    const normalized = normalizeLookupValue(text);
    if (!normalized) return null;

    const alias = LanguageNameAliases[normalized];
    if (alias) return alias;

    for (const code of SupportedLanguageCodes) {
        const label = GoogleLanguages[code].toLowerCase();

        if (normalized === label)
            return code;

        // Answers like "the language is Polish" or "Polish (pl)".
        if (new RegExp(`(?:^|[^a-z])${escapeRegExp(label)}(?:$|[^a-z])`).test(normalized))
            return code;
    }

    return null;
}

/**
 * Turn a model's language answer into a supported code, or null when the model
 * did not give one. Kept strict on purpose: a wrong guess would translate
 * messages into the wrong language, so anything ambiguous counts as unknown.
 */
export function normalizeLanguageCode(raw: string | null | undefined): ChannelLanguageCode | null {
    if (!raw) return null;

    const text = raw
        .trim()
        .toLowerCase()
        .replace(/[`"'\u00AB\u00BB]/g, "")
        .replace(/^[\s*([{]+/, "")
        .replace(/[\s*)\]}.!,;:]+$/, "")
        .trim();

    if (!text) return null;

    if (/\b(?:none|unknown|n\/a|ambiguous|cannot (?:tell|determine)|can't (?:tell|determine)|not a (?:natural[- ])?language|not english)\b/.test(text))
        return null;

    const direct = toSupportedLanguageCode(text);
    if (direct) return direct;

    const byName = toSupportedLanguageName(text);
    if (byName) return byName;

    // "code: pl", "language code is pl", "answer: pl"
    const labelled = text.match(/(?:code|language|answer|iso)\s*(?:is|:|=)?\s*([a-z]{2,3}(?:-[a-z0-9]{2,4})?)\b/);
    if (labelled) {
        const code = toSupportedLanguageCode(labelled[1]);
        if (code) return code;
    }

    // "pl (Polish)" / "Polish (pl)"
    const parenthesised = text.match(/[(\[]\s*([a-z]{2,3}(?:-[a-z0-9]{2,4})?)\s*[)\]]/);
    if (parenthesised) {
        const code = toSupportedLanguageCode(parenthesised[1]);
        if (code) return code;
    }

    return null;
}

