export type Theme =
    | "system"
    | "light"
    | "dark";

const STORAGE_KEY =
    "frozen-theme";

export function initializeTheme(): void {
    applyTheme(
        getTheme()
    );

    window
        .matchMedia(
            "(prefers-color-scheme: dark)"
        )
        .addEventListener(
            "change",
            () => {
                if (
                    getTheme() ===
                    "system"
                ) {
                    applyTheme(
                        "system"
                    );
                }
            }
        );
}

export function getTheme(): Theme {
    const savedTheme =
        localStorage.getItem(
            STORAGE_KEY
        );

    if (
        savedTheme === "system" ||
        savedTheme === "light" ||
        savedTheme === "dark"
    ) {
        return savedTheme;
    }

    return "system";
}

export function setTheme(
    theme: Theme
): void {
    localStorage.setItem(
        STORAGE_KEY,
        theme
    );

    applyTheme(theme);
}

function applyTheme(
    theme: Theme
): void {
    let resolvedTheme:
        | "light"
        | "dark";

    if (theme === "system") {
        resolvedTheme =
            window.matchMedia(
                "(prefers-color-scheme: dark)"
            ).matches
                ? "dark"
                : "light";
    } else {
        resolvedTheme = theme;
    }

    document
        .documentElement
        .dataset
        .theme =
        resolvedTheme;
}