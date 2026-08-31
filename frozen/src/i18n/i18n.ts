import en from "./locales/en.json";
import de from "./locales/de.json";

export type Language =
    | "en"
    | "de";

type Translations =
    Record<string, string>;

const languages: Record<
    Language,
    {
        name: string;
        translations: Translations;
    }
> = {
    en: {
        name: "English",
        translations: en
    },

    de: {
        name: "Deutsch",
        translations: de
    }
};

const DEFAULT_LANGUAGE: Language =
    "en";

const STORAGE_KEY =
    "frozen-language";

let currentLanguage: Language =
    loadLanguage();

export function initializeI18n(): void {
    document.documentElement.lang =
        currentLanguage;
}

export function t(
    key: string
): string {
    const currentTranslations =
        languages[currentLanguage]
            .translations;

    const fallbackTranslations =
        languages[DEFAULT_LANGUAGE]
            .translations;

    return (
        currentTranslations[key] ??
        fallbackTranslations[key] ??
        key
    );
}

export function getLanguage(): Language {
    return currentLanguage;
}

export function setLanguage(
    language: Language
): void {
    currentLanguage = language;

    localStorage.setItem(
        STORAGE_KEY,
        language
    );

    document.documentElement.lang =
        language;
}

export function getAvailableLanguages():
    Language[] {
    return Object.keys(
        languages
    ) as Language[];
}

export function getLanguageName(
    language: Language
): string {
    return languages[language].name;
}

function loadLanguage(): Language {
    const savedLanguage =
        localStorage.getItem(
            STORAGE_KEY
        );

    if (
        savedLanguage === "en" ||
        savedLanguage === "de"
    ) {
        return savedLanguage;
    }

    return DEFAULT_LANGUAGE;
}