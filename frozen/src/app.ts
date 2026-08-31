import {
    getTheme,
    setTheme,
    type Theme
} from "./theme";

import {
    icon,
    type IconName
} from "./icons";

import {
    getAvailableLanguages,
    getLanguage,
    getLanguageName,
    setLanguage,
    t,
    type Language
} from "./i18n/i18n";

import {
    addFood,
    deleteFood,
    getFoods,
    resetDatabase,
    updateFood
} from "./storage/database";

import {
    checkForAppUpdate,
    clearOfflineCache,
    getOfflineCacheStatus,
    hasPendingAppUpdate,
    installAppUpdate,
    prepareOfflineAgain,
    resetPwaState,
    type OfflineCacheStatus,
    type UpdateCheckResult
} from "./pwa";

import type {
    FoodItem,
    CookingMethod
} from "./types/food";

type Tab =
    | "foods"
    | "settings";

type Screen =
    | "main"
    | "add-food"
    | "view-food"
    | "edit-food";

type SortMode =
    | "date-desc"
    | "date-asc"
    | "name-asc"
    | "name-desc";

type FrozenBackup = {
    version: 1;
    exportedAt: string;
    foods: FoodItem[];
};

type UpdateStatus =
    | "idle"
    | "checking"
    | "current"
    | "available"
    | "error";

type CookingMethodValidation = {
    valid: boolean;
    method?: CookingMethod;
    message?: string;
};

const SORT_STORAGE_KEY =
    "frozen-food-sort";

const MIN_TEMPERATURE =
    1;

const MAX_TEMPERATURE =
    300;

const MIN_TIME =
    1;

const MAX_TIME =
    600;

let currentTab: Tab =
    "foods";

let currentScreen: Screen =
    "main";

let foods: FoodItem[] =
    [];

let selectedFoodId:
    string | null =
    null;

let searchQuery =
    "";

let sortMode: SortMode =
    loadSortMode();

let sortMenuOpen =
    false;

let offlineCacheStatus:
    OfflineCacheStatus |
    null =
    null;

let offlineCacheChecking =
    false;

let updateStatus:
    UpdateStatus =
    "idle";

export async function startApp(): Promise<void> {
    foods =
        await getFoods();

    render();
}

function render(): void {
    const app =
        document.querySelector<HTMLDivElement>(
            "#app"
        );

    if (!app) {
        throw new Error(
            "App element not found"
        );
    }

    if (
        currentScreen ===
        "add-food"
    ) {
        app.innerHTML =
            renderFoodFormPage();

        bindFoodFormEvents();

        return;
    }

    if (
        currentScreen ===
        "edit-food"
    ) {
        app.innerHTML =
            renderFoodFormPage();

        bindFoodFormEvents();

        return;
    }

    if (
        currentScreen ===
        "view-food"
    ) {
        app.innerHTML =
            renderFoodViewPage();

        bindFoodViewEvents();

        return;
    }

    app.innerHTML = `
        <main class="app-content">
            ${renderPage()}
        </main>

        <nav class="bottom-nav">

            ${navButton(
                "foods",
                t("nav.foods"),
                "burger"
            )}

            ${navButton(
                "settings",
                t("nav.settings"),
                "settings"
            )}

        </nav>
    `;

    bindTabEvents();
    bindThemeEvents();
    bindLanguageEvents();
    bindFoodEvents();
    bindDataEvents();
    bindOfflineSettingsEvents();

    if (
        currentTab ===
            "settings" &&
        offlineCacheStatus ===
            null &&
        !offlineCacheChecking
    ) {
        void loadOfflineCacheStatus();
    }
}

function renderPage(): string {
    switch (
        currentTab
    ) {
        case "foods":
            return renderFoodsPage();

        case "settings":
            return renderSettingsPage();
    }
}

function renderFoodsPage(): string {
    return `
        <section class="page foods-page">

            <div class="food-toolbar-wrapper">

                <div class="food-toolbar">

                    <label class="search">

                        ${icon(
                            "search"
                        )}

                        <input
                            type="search"
                            value="${escapeHtml(
                                searchQuery
                            )}"
                            placeholder="${t(
                                "foods.search"
                            )}"
                            aria-label="${t(
                                "foods.search"
                            )}"
                            data-food-search
                        />

                    </label>

                    <button
                        class="icon-button ${
                            sortMenuOpen
                                ? "active"
                                : ""
                        }"
                        type="button"
                        aria-label="${t(
                            "foods.sort"
                        )}"
                        data-sort-button
                    >
                        ${icon(
                            "sort"
                        )}
                    </button>

                    <button
                        class="icon-button add-button"
                        type="button"
                        aria-label="${t(
                            "foods.add"
                        )}"
                        data-add-food
                    >
                        ${icon(
                            "plus"
                        )}
                    </button>

                </div>

                ${
                    sortMenuOpen
                        ? renderSortMenu()
                        : ""
                }

            </div>

            <div data-food-content>
                ${renderFoodContent()}
            </div>

        </section>
    `;
}

function renderSortMenu(): string {
    return `
        <div class="sort-menu">

            <div class="sort-menu-title">
                ${t(
                    "foods.sort.title"
                )}
            </div>

            ${sortOption(
                "date-desc",
                t(
                    "foods.sort.newest"
                )
            )}

            ${sortOption(
                "date-asc",
                t(
                    "foods.sort.oldest"
                )
            )}

            ${sortOption(
                "name-asc",
                t(
                    "foods.sort.nameAsc"
                )
            )}

            ${sortOption(
                "name-desc",
                t(
                    "foods.sort.nameDesc"
                )
            )}

        </div>
    `;
}

function sortOption(
    mode: SortMode,
    label: string
): string {
    const selected =
        sortMode ===
        mode;

    return `
        <button
            class="sort-option ${
                selected
                    ? "selected"
                    : ""
            }"
            type="button"
            data-sort-mode="${mode}"
        >

            <span class="sort-check">

                ${
                    selected
                        ? icon(
                            "check",
                            "check-icon"
                        )
                        : ""
                }

            </span>

            <span>
                ${label}
            </span>

        </button>
    `;
}

function renderFoodContent(): string {
    const visibleFoods =
        getVisibleFoods();

    if (
        foods.length ===
            0 &&
        searchQuery.length ===
            0
    ) {
        return `
            <div class="empty-state">

                <div class="empty-state-icon">

                    ${icon(
                        "snowflake",
                        "empty-snowflake"
                    )}

                </div>

                <strong>
                    ${t(
                        "foods.empty.title"
                    )}
                </strong>

                <p>
                    ${t(
                        "foods.empty.message"
                    )}
                </p>

            </div>
        `;
    }

    if (
        visibleFoods.length ===
        0
    ) {
        return `
            <div class="empty-state compact-empty-state">

                <strong>
                    ${t(
                        "foods.noResults.title"
                    )}
                </strong>

                <p>
                    ${t(
                        "foods.noResults.message"
                    )}
                </p>

            </div>
        `;
    }

    return `
        <div class="food-list">

            ${visibleFoods
                .map(
                    renderFoodItem
                )
                .join("")}

        </div>
    `;
}

function getVisibleFoods():
    FoodItem[] {
    const query =
        searchQuery
            .trim()
            .toLocaleLowerCase();

    let result =
        foods.filter(
            (food) => {
                if (!query) {
                    return true;
                }

                const name =
                    food.name
                        .toLocaleLowerCase();

                const brand =
                    food.brand
                        ?.toLocaleLowerCase() ??
                    "";

                return (
                    name.includes(
                        query
                    ) ||
                    brand.includes(
                        query
                    )
                );
            }
        );

    result =
        [...result];

    switch (
        sortMode
    ) {
        case "date-desc":
            result.sort(
                (
                    a,
                    b
                ) =>
                    b.createdAt.localeCompare(
                        a.createdAt
                    )
            );

            break;

        case "date-asc":
            result.sort(
                (
                    a,
                    b
                ) =>
                    a.createdAt.localeCompare(
                        b.createdAt
                    )
            );

            break;

        case "name-asc":
            result.sort(
                (
                    a,
                    b
                ) =>
                    a.name.localeCompare(
                        b.name,
                        undefined,
                        {
                            sensitivity:
                                "base"
                        }
                    )
            );

            break;

        case "name-desc":
            result.sort(
                (
                    a,
                    b
                ) =>
                    b.name.localeCompare(
                        a.name,
                        undefined,
                        {
                            sensitivity:
                                "base"
                        }
                    )
            );

            break;
    }

    return result;
}

function renderFoodItem(
    food: FoodItem
): string {
    return `
        <button
            class="food-item"
            type="button"
            data-view-food="${food.id}"
        >

            <div class="food-item-header">

                <div>

                    ${
                        food.brand
                            ? `
                                <div class="food-brand">
                                    ${escapeHtml(
                                        food.brand
                                    )}
                                </div>
                            `
                            : ""
                    }

                    <div class="food-name">
                        ${escapeHtml(
                            food.name
                        )}
                    </div>

                </div>

            </div>

            ${renderFoodMethods(
                food
            )}

            ${
                food.notes
                    ? `
                        <div class="food-notes food-notes-preview">
                            ${escapeHtml(
                                food.notes
                            )}
                        </div>
                    `
                    : ""
            }

        </button>
    `;
}

function renderFoodMethods(
    food: FoodItem
): string {
    const methods:
        string[] =
        [];

    if (
        food.oven
            ?.topBottomHeat
    ) {
        methods.push(
            renderMethodSummary(
                t(
                    "foodForm.topBottom"
                ),
                food.oven
                    .topBottomHeat
            )
        );
    }

    if (
        food.oven
            ?.fan
    ) {
        methods.push(
            renderMethodSummary(
                t(
                    "foodForm.fan"
                ),
                food.oven.fan
            )
        );
    }

    if (
        food.airFryer
    ) {
        methods.push(
            renderMethodSummary(
                t(
                    "foodForm.airFryer"
                ),
                food.airFryer
            )
        );
    }

    if (
        methods.length ===
        0
    ) {
        return "";
    }

    return `
        <div class="food-methods">
            ${methods.join("")}
        </div>
    `;
}

function renderMethodSummary(
    label: string,
    method: CookingMethod
): string {
    const time =
        method.timeMax !==
        undefined
            ? `${method.timeMin}–${method.timeMax}`
            : `${method.timeMin}`;

    return `
        <div class="food-method">

            <span class="food-method-name">
                ${label}
            </span>

            <span class="food-method-value">
                ${method.temperature} °C
                ·
                ${time}
                ${t(
                    "foodForm.minutes"
                )}
            </span>

        </div>
    `;
}

function renderFoodViewPage(): string {
    const food =
        getSelectedFood();

    if (!food) {
        currentScreen =
            "main";

        selectedFoodId =
            null;

        queueMicrotask(
            render
        );

        return "";
    }

    return `
        <main class="food-detail-screen">

            <header class="food-form-header">

                <button
                    class="back-button"
                    type="button"
                    data-close-food-view
                    aria-label="${t(
                        "foodForm.cancel"
                    )}"
                >
                    ${icon(
                        "back"
                    )}
                </button>

                <h1>
                    ${escapeHtml(
                        food.name
                    )}
                </h1>

                <div class="header-spacer"></div>

            </header>

            <div class="food-detail-content">

                <div class="food-detail-heading">

                    ${
                        food.brand
                            ? `
                                <div class="food-detail-brand">
                                    ${escapeHtml(
                                        food.brand
                                    )}
                                </div>
                            `
                            : ""
                    }

                    <h2>
                        ${escapeHtml(
                            food.name
                        )}
                    </h2>

                </div>

                ${renderFoodDetailMethods(
                    food
                )}

                ${
                    food.notes
                        ? `
                            <section class="food-detail-section">

                                <div class="section-title">
                                    ${t(
                                        "foodView.notes"
                                    )}
                                </div>

                                <div class="food-detail-notes">
                                    ${escapeHtml(
                                        food.notes
                                    )}
                                </div>

                            </section>
                        `
                        : ""
                }

                <div class="food-created-date">
                    ${t(
                        "foodView.created"
                    )}:
                    ${formatDate(
                        food.createdAt
                    )}
                </div>

                <div class="food-detail-actions">

                    <button
                        class="primary-button"
                        type="button"
                        data-edit-food
                    >
                        ${t(
                            "foodView.edit"
                        )}
                    </button>

                    <button
                        class="danger-button"
                        type="button"
                        data-delete-food
                    >
                        ${t(
                            "foodView.delete"
                        )}
                    </button>

                </div>

            </div>

        </main>
    `;
}

function renderFoodDetailMethods(
    food: FoodItem
): string {
    const ovenMethods:
        string[] =
        [];

    if (
        food.oven
            ?.topBottomHeat
    ) {
        ovenMethods.push(
            renderDetailMethod(
                t(
                    "foodForm.topBottom"
                ),
                food.oven
                    .topBottomHeat,
                "oven"
            )
        );
    }

    if (
        food.oven
            ?.fan
    ) {
        ovenMethods.push(
            renderDetailMethod(
                t(
                    "foodForm.fan"
                ),
                food.oven.fan,
                "fan"
            )
        );
    }

    const airFryer =
        food.airFryer
            ? renderDetailMethod(
                t(
                    "foodForm.airFryer"
                ),
                food.airFryer,
                "airFryer"
            )
            : "";

    if (
        ovenMethods.length ===
            0 &&
        !airFryer
    ) {
        return `
            <div class="food-detail-empty">
                ${t(
                    "foodView.noInstructions"
                )}
            </div>
        `;
    }

    return `
        ${
            ovenMethods.length >
            0
                ? `
                    <section class="food-detail-section">

                        <div class="section-title">
                            ${t(
                                "foodForm.oven"
                            )}
                        </div>

                        <div class="detail-method-list">
                            ${ovenMethods.join(
                                ""
                            )}
                        </div>

                    </section>
                `
                : ""
        }

        ${
            airFryer
                ? `
                    <section class="food-detail-section">

                        <div class="section-title">
                            ${t(
                                "foodForm.airFryer"
                            )}
                        </div>

                        <div class="detail-method-list">
                            ${airFryer}
                        </div>

                    </section>
                `
                : ""
        }
    `;
}

function renderDetailMethod(
    label: string,
    method: CookingMethod,
    iconName: IconName
): string {
    const time =
        method.timeMax !==
        undefined
            ? `${method.timeMin}–${method.timeMax}`
            : `${method.timeMin}`;

    return `
        <div class="detail-method">

            <div class="detail-method-header">

                <div class="detail-method-name">
                    ${label}
                </div>

                ${icon(
                    iconName,
                    "cooking-method-icon"
                )}

            </div>

            <div class="detail-method-values">

                <div class="detail-value">

                    <span>
                        ${t(
                            "foodForm.temperature"
                        )}
                    </span>

                    <strong>
                        ${method.temperature}
                        °C
                    </strong>

                </div>

                <div class="detail-value">

                    <span>
                        ${t(
                            "foodForm.time"
                        )}
                    </span>

                    <strong>
                        ${time}
                        ${t(
                            "foodForm.minutes"
                        )}
                    </strong>

                </div>

            </div>

        </div>
    `;
}

function renderSettingsPage(): string {
    return `
        <section class="page settings-page">

            <div class="settings-section">

                <div class="settings-label">
                    ${t(
                        "settings.appearance"
                    )}
                </div>

                <div class="settings-list">

                    ${themeOption(
                        "system",
                        t(
                            "settings.theme.system"
                        ),
                        "smartphone"
                    )}

                    ${themeOption(
                        "light",
                        t(
                            "settings.theme.light"
                        ),
                        "sun"
                    )}

                    ${themeOption(
                        "dark",
                        t(
                            "settings.theme.dark"
                        ),
                        "moon"
                    )}

                </div>

            </div>

            <div class="settings-section settings-section-spaced">

                <div class="settings-label">
                    ${t(
                        "settings.language"
                    )}
                </div>

                <div class="settings-list">
                    ${renderLanguageOptions()}
                </div>

            </div>

            <div class="settings-section settings-section-spaced">

                <div class="settings-label">
                    ${t(
                        "settings.offline.title"
                    )}
                </div>

                <div class="offline-settings-card">

                    ${renderOfflineStatus()}

                    <div class="offline-settings-actions">

                        <button
                            class="settings-action-button"
                            type="button"
                            data-check-cache
                            ${
                                offlineCacheChecking
                                    ? "disabled"
                                    : ""
                            }
                        >
                            ${
                                offlineCacheChecking
                                    ? t(
                                        "settings.offline.checking"
                                    )
                                    : t(
                                        "settings.offline.check"
                                    )
                            }
                        </button>

                        <button
                            class="settings-action-button"
                            type="button"
                            data-clear-cache
                        >
                            ${t(
                                "settings.offline.deleteCache"
                            )}
                        </button>

                        ${
                            offlineCacheStatus &&
                            !offlineCacheStatus
                                .cached
                                ? `
                                    <button
                                        class="settings-action-button"
                                        type="button"
                                        data-prepare-offline
                                    >
                                        ${t(
                                            "settings.offline.prepareAgain"
                                        )}
                                    </button>
                                `
                                : ""
                        }

                    </div>

                    <div class="offline-settings-divider"></div>

                    ${renderUpdateStatus()}

                    <div class="offline-settings-actions">

                        <button
                            class="settings-action-button"
                            type="button"
                            data-check-update
                            ${
                                updateStatus ===
                                "checking"
                                    ? "disabled"
                                    : ""
                            }
                        >
                            ${
                                updateStatus ===
                                "checking"
                                    ? t(
                                        "settings.update.checking"
                                    )
                                    : t(
                                        "settings.update.check"
                                    )
                            }
                        </button>

                        ${
                            updateStatus ===
                                "available" ||
                            hasPendingAppUpdate()
                                ? `
                                    <button
                                        class="settings-action-button primary-settings-action"
                                        type="button"
                                        data-install-update
                                    >
                                        ${t(
                                            "settings.update.install"
                                        )}
                                    </button>
                                `
                                : ""
                        }

                    </div>

                </div>

            </div>

            <div class="settings-section settings-section-spaced">

                <div class="settings-label">
                    ${t(
                        "settings.data"
                    )}
                </div>

                <div class="data-settings-list">

                    <button
                        class="data-setting"
                        type="button"
                        data-export-backup
                    >

                        <span class="data-setting-text">

                            <strong>
                                ${t(
                                    "settings.export"
                                )}
                            </strong>

                            <span>
                                ${t(
                                    "settings.exportDescription"
                                )}
                            </span>

                        </span>

                    </button>

                    <button
                        class="data-setting"
                        type="button"
                        data-import-button
                    >

                        <span class="data-setting-text">

                            <strong>
                                ${t(
                                    "settings.import"
                                )}
                            </strong>

                            <span>
                                ${t(
                                    "settings.importDescription"
                                )}
                            </span>

                        </span>

                    </button>

                </div>

                <input
                    class="hidden-file-input"
                    type="file"
                    accept=".json,application/json"
                    data-import-file
                />

            </div>

            <div class="settings-section settings-section-spaced reset-section">

                <div class="settings-label danger-settings-label">
                    ${t(
                        "settings.reset.title"
                    )}
                </div>

                <div class="reset-card">

                    <div class="reset-card-text">

                        <strong>
                            ${t(
                                "settings.reset.button"
                            )}
                        </strong>

                        <span>
                            ${t(
                                "settings.reset.description"
                            )}
                        </span>

                    </div>

                    <button
                        class="reset-app-button"
                        type="button"
                        data-reset-app
                    >
                        ${t(
                            "settings.reset.button"
                        )}
                    </button>

                </div>

            </div>

        </section>
    `;
}

function renderOfflineStatus():
    string {
    if (
        offlineCacheChecking ||
        !offlineCacheStatus
    ) {
        return `
            <div class="offline-status">

                <span class="offline-status-dot checking"></span>

                <div class="offline-status-text">

                    <strong>
                        ${t(
                            "settings.offline.checking"
                        )}
                    </strong>

                    <span>
                        ${t(
                            "settings.offline.checkingDescription"
                        )}
                    </span>

                </div>

            </div>
        `;
    }

    if (
        !offlineCacheStatus
            .supported
    ) {
        return `
            <div class="offline-status">

                <span class="offline-status-dot error"></span>

                <div class="offline-status-text">

                    <strong>
                        ${t(
                            "settings.offline.unsupported"
                        )}
                    </strong>

                </div>

            </div>
        `;
    }

    if (
        offlineCacheStatus
            .cached
    ) {
        return `
            <div class="offline-status">

                <span class="offline-status-dot ready"></span>

                <div class="offline-status-text">

                    <strong>
                        ${t(
                            "settings.offline.ready"
                        )}
                    </strong>

                    <span>
                        ${offlineCacheStatus.entryCount}
                        ${t(
                            "settings.offline.filesCached"
                        )}
                    </span>

                </div>

            </div>
        `;
    }

    return `
        <div class="offline-status">

            <span class="offline-status-dot error"></span>

            <div class="offline-status-text">

                <strong>
                    ${t(
                        "settings.offline.notReady"
                    )}
                </strong>

                <span>
                    ${t(
                        "settings.offline.notReadyDescription"
                    )}
                </span>

            </div>

        </div>
    `;
}

function renderUpdateStatus():
    string {
    const effectiveStatus:
        UpdateStatus =
        hasPendingAppUpdate()
            ? "available"
            : updateStatus;

    switch (
        effectiveStatus
    ) {
        case "checking":
            return `
                <div class="update-status">
                    ${t(
                        "settings.update.checking"
                    )}
                </div>
            `;

        case "current":
            return `
                <div class="update-status update-current">
                    ${t(
                        "settings.update.current"
                    )}
                </div>
            `;

        case "available":
            return `
                <div class="update-status update-available">
                    ${t(
                        "settings.update.available"
                    )}
                </div>
            `;

        case "error":
            return `
                <div class="update-status update-error">
                    ${t(
                        "settings.update.error"
                    )}
                </div>
            `;

        default:
            return `
                <div class="update-status">
                    ${t(
                        "settings.update.description"
                    )}
                </div>
            `;
    }
}

function renderFoodFormPage(): string {
    const editing =
        currentScreen ===
        "edit-food";

    const food =
        editing
            ? getSelectedFood()
            : undefined;

    if (
        editing &&
        !food
    ) {
        currentScreen =
            "main";

        queueMicrotask(
            render
        );

        return "";
    }

    return `
        <main class="food-form-screen">

            <header class="food-form-header">

                <button
                    class="back-button"
                    type="button"
                    aria-label="${t(
                        "foodForm.cancel"
                    )}"
                    data-close-food-form
                >
                    ${icon(
                        "back"
                    )}
                </button>

                <h1>
                    ${
                        editing
                            ? t(
                                "foodForm.editTitle"
                            )
                            : t(
                                "foodForm.title"
                            )
                    }
                </h1>

                <div class="header-spacer"></div>

            </header>

            <form
                class="food-form"
                data-food-form
                novalidate
            >

                <div class="form-field">

                    <label for="food-name">

                        ${t(
                            "foodForm.name"
                        )}

                        <span class="required">
                            *
                        </span>

                    </label>

                    <input
                        id="food-name"
                        name="name"
                        type="text"
                        autocomplete="off"
                        required
                        value="${escapeHtml(
                            food?.name ??
                                ""
                        )}"
                        placeholder="${t(
                            "foodForm.name.placeholder"
                        )}"
                        data-name-input
                    />

                    <div
                        class="form-validation-error"
                        data-name-error
                        hidden
                    ></div>

                </div>

                <div class="form-field">

                    <label for="food-brand">

                        ${t(
                            "foodForm.brand"
                        )}

                        <span class="optional">
                            (${t(
                                "foodForm.optional"
                            )})
                        </span>

                    </label>

                    <input
                        id="food-brand"
                        name="brand"
                        type="text"
                        autocomplete="off"
                        value="${escapeHtml(
                            food?.brand ??
                                ""
                        )}"
                        placeholder="${t(
                            "foodForm.brand.placeholder"
                        )}"
                    />

                </div>

                <section class="preparation-section">

                    <div class="section-title">
                        ${t(
                            "foodForm.oven"
                        )}
                    </div>

                    ${renderCookingMethod(
                        "top-bottom",
                        t(
                            "foodForm.topBottom"
                        ),
                        "oven",
                        food?.oven
                            ?.topBottomHeat
                    )}

                    ${renderCookingMethod(
                        "fan",
                        t(
                            "foodForm.fan"
                        ),
                        "fan",
                        food?.oven
                            ?.fan
                    )}

                </section>

                <section class="preparation-section">

                    <div class="section-title">
                        ${t(
                            "foodForm.airFryer"
                        )}
                    </div>

                    ${renderCookingMethod(
                        "air-fryer",
                        t(
                            "foodForm.airFryer"
                        ),
                        "airFryer",
                        food?.airFryer
                    )}

                </section>

                <div class="form-field">

                    <label for="food-notes">

                        ${t(
                            "foodForm.notes"
                        )}

                        <span class="optional">
                            (${t(
                                "foodForm.optional"
                            )})
                        </span>

                    </label>

                    <textarea
                        id="food-notes"
                        name="notes"
                        rows="4"
                        placeholder="${t(
                            "foodForm.notes.placeholder"
                        )}"
                    >${escapeHtml(
                        food?.notes ??
                            ""
                    )}</textarea>

                </div>

                <div class="form-actions">

                    <button
                        class="secondary-button"
                        type="button"
                        data-close-food-form
                    >
                        ${t(
                            "foodForm.cancel"
                        )}
                    </button>

                    <button
                        class="primary-button"
                        type="submit"
                    >
                        ${t(
                            "foodForm.save"
                        )}
                    </button>

                </div>

            </form>

        </main>
    `;
}

function renderCookingMethod(
    id: string,
    label: string,
    iconName: IconName,
    method?: CookingMethod
): string {
    return `
        <div
            class="cooking-method"
            data-cooking-method="${id}"
        >

            <div class="cooking-method-header">

                <strong>
                    ${label}
                </strong>

                ${icon(
                    iconName,
                    "cooking-method-icon"
                )}

            </div>

            <div class="cooking-values">

                <label class="temperature-field">

                    <span>
                        ${t(
                            "foodForm.temperature"
                        )}
                    </span>

                    <div class="unit-input">

                        <input
                            type="number"
                            name="${id}-temperature"
                            inputmode="numeric"
                            min="${MIN_TEMPERATURE}"
                            max="${MAX_TEMPERATURE}"
                            value="${
                                method
                                    ?.temperature ??
                                ""
                            }"
                        />

                        <span>
                            °C
                        </span>

                    </div>

                </label>

                <div class="time-field">

                    <span class="field-caption">
                        ${t(
                            "foodForm.time"
                        )}
                    </span>

                    <div class="time-inputs">

                        <input
                            type="number"
                            name="${id}-time-min"
                            inputmode="numeric"
                            min="${MIN_TIME}"
                            max="${MAX_TIME}"
                            value="${
                                method
                                    ?.timeMin ??
                                ""
                            }"
                            aria-label="${t(
                                "foodForm.validation.minimumTime"
                            )}"
                        />

                        <span class="time-separator">
                            –
                        </span>

                        <input
                            type="number"
                            name="${id}-time-max"
                            inputmode="numeric"
                            min="${MIN_TIME}"
                            max="${MAX_TIME}"
                            value="${
                                method
                                    ?.timeMax ??
                                ""
                            }"
                            aria-label="${t(
                                "foodForm.validation.maximumTime"
                            )}"
                        />

                        <span class="time-unit">
                            ${t(
                                "foodForm.minutes"
                            )}
                        </span>

                    </div>

                </div>

            </div>

            <div
                class="cooking-method-error"
                data-cooking-method-error="${id}"
                role="alert"
                hidden
            ></div>

        </div>
    `;
}

function renderLanguageOptions(): string {
    const selectedLanguage =
        getLanguage();

    return getAvailableLanguages()
        .map(
            (
                language
            ) => {
                const selected =
                    language ===
                    selectedLanguage;

                return `
                    <button
                        class="settings-option ${
                            selected
                                ? "selected"
                                : ""
                        }"
                        type="button"
                        data-language="${language}"
                    >

                        <span>
                            ${getLanguageName(
                                language
                            )}
                        </span>

                        ${
                            selected
                                ? icon(
                                    "check",
                                    "check-icon"
                                )
                                : ""
                        }

                    </button>
                `;
            }
        )
        .join("");
}

function navButton(
    tab: Tab,
    label: string,
    iconName: IconName
): string {
    const selected =
        currentTab ===
        tab;

    return `
        <button
            class="nav-item ${
                selected
                    ? "selected"
                    : ""
            }"
            data-tab="${tab}"
            type="button"
            aria-label="${label}"
        >

            ${icon(
                iconName,
                "nav-icon"
            )}

            <span class="nav-label">
                ${label}
            </span>

        </button>
    `;
}

function themeOption(
    theme: Theme,
    label: string,
    iconName: IconName
): string {
    const selected =
        getTheme() ===
        theme;

    return `
        <button
            class="settings-option ${
                selected
                    ? "selected"
                    : ""
            }"
            type="button"
            data-theme-option="${theme}"
        >

            <span class="settings-option-content">

                ${icon(
                    iconName,
                    "settings-option-icon"
                )}

                <span>
                    ${label}
                </span>

            </span>

            ${
                selected
                    ? icon(
                        "check",
                        "check-icon"
                    )
                    : ""
            }

        </button>
    `;
}

function bindTabEvents(): void {
    document
        .querySelectorAll<HTMLButtonElement>(
            "[data-tab]"
        )
        .forEach(
            (
                button
            ) => {
                button.addEventListener(
                    "click",
                    () => {
                        currentTab =
                            button
                                .dataset
                                .tab as Tab;

                        sortMenuOpen =
                            false;

                        render();
                    }
                );
            }
        );
}

function bindThemeEvents(): void {
    document
        .querySelectorAll<HTMLButtonElement>(
            "[data-theme-option]"
        )
        .forEach(
            (
                button
            ) => {
                button.addEventListener(
                    "click",
                    () => {
                        const theme =
                            button
                                .dataset
                                .themeOption as Theme;

                        setTheme(
                            theme
                        );

                        render();
                    }
                );
            }
        );
}

function bindLanguageEvents(): void {
    document
        .querySelectorAll<HTMLButtonElement>(
            "[data-language]"
        )
        .forEach(
            (
                button
            ) => {
                button.addEventListener(
                    "click",
                    () => {
                        const language =
                            button
                                .dataset
                                .language as Language;

                        setLanguage(
                            language
                        );

                        render();
                    }
                );
            }
        );
}

function bindFoodEvents(): void {
    document
        .querySelectorAll<HTMLButtonElement>(
            "[data-add-food]"
        )
        .forEach(
            (
                button
            ) => {
                button.addEventListener(
                    "click",
                    () => {
                        selectedFoodId =
                            null;

                        currentScreen =
                            "add-food";

                        sortMenuOpen =
                            false;

                        render();
                    }
                );
            }
        );

    bindFoodItemEvents();

    const searchInput =
        document.querySelector<HTMLInputElement>(
            "[data-food-search]"
        );

    searchInput?.addEventListener(
        "input",
        () => {
            searchQuery =
                searchInput.value;

            updateFoodContent();

            bindFoodItemEvents();
        }
    );

    const sortButton =
        document.querySelector<HTMLButtonElement>(
            "[data-sort-button]"
        );

    sortButton?.addEventListener(
        "click",
        () => {
            sortMenuOpen =
                !sortMenuOpen;

            render();
        }
    );

    document
        .querySelectorAll<HTMLButtonElement>(
            "[data-sort-mode]"
        )
        .forEach(
            (
                button
            ) => {
                button.addEventListener(
                    "click",
                    () => {
                        const mode =
                            button
                                .dataset
                                .sortMode as SortMode;

                        setSortMode(
                            mode
                        );

                        sortMenuOpen =
                            false;

                        render();
                    }
                );
            }
        );
}

function bindFoodItemEvents(): void {
    document
        .querySelectorAll<HTMLButtonElement>(
            "[data-view-food]"
        )
        .forEach(
            (
                button
            ) => {
                button.addEventListener(
                    "click",
                    () => {
                        selectedFoodId =
                            button
                                .dataset
                                .viewFood ??
                            null;

                        currentScreen =
                            "view-food";

                        render();
                    }
                );
            }
        );
}

function bindFoodViewEvents(): void {
    const backButton =
        document.querySelector<HTMLButtonElement>(
            "[data-close-food-view]"
        );

    backButton?.addEventListener(
        "click",
        () => {
            currentScreen =
                "main";

            selectedFoodId =
                null;

            render();
        }
    );

    const editButton =
        document.querySelector<HTMLButtonElement>(
            "[data-edit-food]"
        );

    editButton?.addEventListener(
        "click",
        () => {
            currentScreen =
                "edit-food";

            render();
        }
    );

    const deleteButton =
        document.querySelector<HTMLButtonElement>(
            "[data-delete-food]"
        );

    deleteButton?.addEventListener(
        "click",
        async () => {
            const food =
                getSelectedFood();

            if (!food) {
                return;
            }

            const confirmed =
                window.confirm(
                    t(
                        "foodView.deleteConfirm"
                    )
                );

            if (
                !confirmed
            ) {
                return;
            }

            await deleteFood(
                food.id
            );

            foods =
                await getFoods();

            selectedFoodId =
                null;

            currentScreen =
                "main";

            currentTab =
                "foods";

            render();
        }
    );
}

function bindDataEvents(): void {
    const exportButton =
        document.querySelector<HTMLButtonElement>(
            "[data-export-backup]"
        );

    exportButton?.addEventListener(
        "click",
        () => {
            exportBackup();
        }
    );

    const importButton =
        document.querySelector<HTMLButtonElement>(
            "[data-import-button]"
        );

    const importInput =
        document.querySelector<HTMLInputElement>(
            "[data-import-file]"
        );

    importButton?.addEventListener(
        "click",
        () => {
            importInput?.click();
        }
    );

    importInput?.addEventListener(
        "change",
        async () => {
            const file =
                importInput.files?.[0];

            if (!file) {
                return;
            }

            try {
                await importBackup(
                    file
                );

                foods =
                    await getFoods();

                window.alert(
                    t(
                        "settings.importSuccess"
                    )
                );

                render();
            } catch (
                error
            ) {
                console.error(
                    error
                );

                window.alert(
                    t(
                        "settings.importError"
                    )
                );
            }
        }
    );
}

function bindOfflineSettingsEvents():
    void {
    const checkCacheButton =
        document.querySelector<HTMLButtonElement>(
            "[data-check-cache]"
        );

    checkCacheButton?.addEventListener(
        "click",
        async () => {
            offlineCacheStatus =
                null;

            render();

            await loadOfflineCacheStatus();
        }
    );

    const clearCacheButton =
        document.querySelector<HTMLButtonElement>(
            "[data-clear-cache]"
        );

    clearCacheButton?.addEventListener(
        "click",
        async () => {
            const confirmed =
                window.confirm(
                    t(
                        "settings.offline.deleteCacheConfirm"
                    )
                );

            if (
                !confirmed
            ) {
                return;
            }

            await clearOfflineCache();

            offlineCacheStatus =
                await getOfflineCacheStatus();

            render();
        }
    );

    const prepareOfflineButton =
        document.querySelector<HTMLButtonElement>(
            "[data-prepare-offline]"
        );

    prepareOfflineButton?.addEventListener(
        "click",
        async () => {
            await prepareOfflineAgain();
        }
    );

    const checkUpdateButton =
        document.querySelector<HTMLButtonElement>(
            "[data-check-update]"
        );

    checkUpdateButton?.addEventListener(
        "click",
        async () => {
            updateStatus =
                "checking";

            render();

            const result:
                UpdateCheckResult =
                await checkForAppUpdate();

            switch (
                result
            ) {
                case "available":
                    updateStatus =
                        "available";
                    break;

                case "current":
                    updateStatus =
                        "current";
                    break;

                case "unsupported":
                case "error":
                    updateStatus =
                        "error";
                    break;
            }

            render();
        }
    );

    const installUpdateButton =
        document.querySelector<HTMLButtonElement>(
            "[data-install-update]"
        );

    installUpdateButton?.addEventListener(
        "click",
        async () => {
            await installAppUpdate();
        }
    );

    const resetAppButton =
        document.querySelector<HTMLButtonElement>(
            "[data-reset-app]"
        );

    resetAppButton?.addEventListener(
        "click",
        async () => {
            const confirmed =
                window.confirm(
                    t(
                        "settings.reset.confirm"
                    )
                );

            if (
                !confirmed
            ) {
                return;
            }

            try {
                await resetDatabase();

                localStorage.clear();

                await resetPwaState();

                window.location.reload();
            } catch (
                error
            ) {
                console.error(
                    "App reset failed:",
                    error
                );

                window.alert(
                    t(
                        "settings.reset.error"
                    )
                );
            }
        }
    );
}

async function loadOfflineCacheStatus():
    Promise<void> {
    if (
        offlineCacheChecking
    ) {
        return;
    }

    offlineCacheChecking =
        true;

    try {
        offlineCacheStatus =
            await getOfflineCacheStatus();
    } catch (
        error
    ) {
        console.error(
            "Could not check offline cache:",
            error
        );

        offlineCacheStatus = {
            supported:
                false,
            serviceWorkerActive:
                false,
            cached:
                false,
            cacheCount:
                0,
            entryCount:
                0
        };
    } finally {
        offlineCacheChecking =
            false;
    }

    if (
        currentTab ===
            "settings" &&
        currentScreen ===
            "main"
    ) {
        render();
    }
}

function exportBackup(): void {
    const backup:
        FrozenBackup = {
        version: 1,

        exportedAt:
            new Date()
                .toISOString(),

        foods
    };

    const json =
        JSON.stringify(
            backup,
            null,
            2
        );

    const blob =
        new Blob(
            [json],
            {
                type:
                    "application/json"
            }
        );

    const url =
        URL.createObjectURL(
            blob
        );

    const link =
        document.createElement(
            "a"
        );

    const date =
        new Date()
            .toISOString()
            .slice(
                0,
                10
            );

    link.href =
        url;

    link.download =
        `frozen-backup-${date}.json`;

    document.body.appendChild(
        link
    );

    link.click();

    link.remove();

    URL.revokeObjectURL(
        url
    );
}

async function importBackup(
    file: File
): Promise<void> {
    const text =
        await file.text();

    const parsed:
        unknown =
        JSON.parse(
            text
        );

    if (
        !isFrozenBackup(
            parsed
        )
    ) {
        throw new Error(
            "Invalid Frozen backup"
        );
    }

    for (
        const food of
        parsed.foods
    ) {
        await updateFood(
            food
        );
    }
}

function isFrozenBackup(
    value: unknown
): value is FrozenBackup {
    if (
        typeof value !==
            "object" ||
        value ===
            null
    ) {
        return false;
    }

    const backup =
        value as Partial<FrozenBackup>;

    if (
        backup.version !==
            1 ||
        !Array.isArray(
            backup.foods
        )
    ) {
        return false;
    }

    return backup.foods.every(
        (
            food
        ) =>
            isFoodItem(
                food
            )
    );
}

function isFoodItem(
    value: unknown
): value is FoodItem {
    if (
        typeof value !==
            "object" ||
        value ===
            null
    ) {
        return false;
    }

    const food =
        value as Partial<FoodItem>;

    return (
        typeof food.id ===
            "string" &&
        typeof food.name ===
            "string" &&
        typeof food.createdAt ===
            "string" &&
        typeof food.updatedAt ===
            "string"
    );
}

function updateFoodContent(): void {
    const container =
        document.querySelector<HTMLDivElement>(
            "[data-food-content]"
        );

    if (!container) {
        return;
    }

    container.innerHTML =
        renderFoodContent();
}

function bindFoodFormEvents(): void {
    document
        .querySelectorAll<HTMLButtonElement>(
            "[data-close-food-form]"
        )
        .forEach(
            (
                button
            ) => {
                button.addEventListener(
                    "click",
                    () => {
                        if (
                            currentScreen ===
                            "edit-food"
                        ) {
                            currentScreen =
                                "view-food";
                        } else {
                            currentScreen =
                                "main";

                            selectedFoodId =
                                null;
                        }

                        render();
                    }
                );
            }
        );

    const form =
        document.querySelector<HTMLFormElement>(
            "[data-food-form]"
        );

    if (!form) {
        return;
    }

    form.querySelectorAll<HTMLInputElement>(
        "input"
    ).forEach(
        (
            input
        ) => {
            input.addEventListener(
                "input",
                () => {
                    clearInputValidation(
                        input
                    );

                    if (
                        input.name ===
                        "name"
                    ) {
                        clearNameError();
                    }

                    const methodElement =
                        input.closest<HTMLElement>(
                            "[data-cooking-method]"
                        );

                    if (
                        methodElement
                    ) {
                        clearCookingMethodError(
                            methodElement
                        );
                    }
                }
            );
        }
    );

    form.addEventListener(
        "submit",
        async (
            event
        ) => {
            event.preventDefault();

            clearAllFormErrors(
                form
            );

            const formData =
                new FormData(
                    form
                );

            const name =
                getString(
                    formData,
                    "name"
                ).trim();

            let formValid =
                true;

            let firstInvalidElement:
                HTMLElement |
                null =
                null;

            if (!name) {
                formValid =
                    false;

                const nameInput =
                    form.querySelector<HTMLInputElement>(
                        '[name="name"]'
                    );

                if (
                    nameInput
                ) {
                    markInputInvalid(
                        nameInput
                    );

                    firstInvalidElement =
                        nameInput;
                }

                showNameError(
                    t(
                        "foodForm.validation.nameRequired"
                    )
                );
            }

            const topBottomResult =
                validateCookingMethod(
                    form,
                    formData,
                    "top-bottom"
                );

            const fanResult =
                validateCookingMethod(
                    form,
                    formData,
                    "fan"
                );

            const airFryerResult =
                validateCookingMethod(
                    form,
                    formData,
                    "air-fryer"
                );

            const methodResults = [
                {
                    prefix:
                        "top-bottom",
                    result:
                        topBottomResult
                },
                {
                    prefix:
                        "fan",
                    result:
                        fanResult
                },
                {
                    prefix:
                        "air-fryer",
                    result:
                        airFryerResult
                }
            ];

            for (
                const {
                    prefix,
                    result
                } of methodResults
            ) {
                if (
                    result.valid
                ) {
                    continue;
                }

                formValid =
                    false;

                showCookingMethodError(
                    form,
                    prefix,
                    result.message ??
                        t(
                            "foodForm.validation.invalidMethod"
                        )
                );

                if (
                    !firstInvalidElement
                ) {
                    firstInvalidElement =
                        getFirstInvalidMethodInput(
                            form,
                            formData,
                            prefix
                        );
                }
            }

            if (
                !formValid
            ) {
                firstInvalidElement
                    ?.scrollIntoView({
                        behavior:
                            "smooth",
                        block:
                            "center"
                    });

                window.setTimeout(
                    () => {
                        if (
                            firstInvalidElement instanceof
                            HTMLInputElement
                        ) {
                            firstInvalidElement.focus();
                        }
                    },
                    250
                );

                return;
            }

            const brand =
                getString(
                    formData,
                    "brand"
                ).trim();

            const notes =
                getString(
                    formData,
                    "notes"
                ).trim();

            const topBottomHeat =
                topBottomResult.method;

            const fan =
                fanResult.method;

            const airFryer =
                airFryerResult.method;

            const now =
                new Date()
                    .toISOString();

            if (
                currentScreen ===
                "edit-food"
            ) {
                const existing =
                    getSelectedFood();

                if (!existing) {
                    return;
                }

                const updated:
                    FoodItem = {
                    id:
                        existing.id,

                    name,

                    ...(brand
                        ? {
                            brand
                        }
                        : {}),

                    ...(
                        topBottomHeat ||
                        fan
                            ? {
                                oven: {
                                    ...(topBottomHeat
                                        ? {
                                            topBottomHeat
                                        }
                                        : {}),

                                    ...(fan
                                        ? {
                                            fan
                                        }
                                        : {})
                                }
                            }
                            : {}
                    ),

                    ...(airFryer
                        ? {
                            airFryer
                        }
                        : {}),

                    ...(notes
                        ? {
                            notes
                        }
                        : {}),

                    createdAt:
                        existing
                            .createdAt,

                    updatedAt:
                        now
                };

                await updateFood(
                    updated
                );

                foods =
                    await getFoods();

                currentScreen =
                    "view-food";

                render();

                return;
            }

            const food:
                FoodItem = {
                id:
                    createId(),

                name,

                ...(brand
                    ? {
                        brand
                    }
                    : {}),

                ...(
                    topBottomHeat ||
                    fan
                        ? {
                            oven: {
                                ...(topBottomHeat
                                    ? {
                                        topBottomHeat
                                    }
                                    : {}),

                                ...(fan
                                    ? {
                                        fan
                                    }
                                    : {})
                            }
                        }
                        : {}
                ),

                ...(airFryer
                    ? {
                        airFryer
                    }
                    : {}),

                ...(notes
                    ? {
                        notes
                    }
                    : {}),

                createdAt:
                    now,

                updatedAt:
                    now
            };

            await addFood(
                food
            );

            foods =
                await getFoods();

            currentScreen =
                "main";

            currentTab =
                "foods";

            selectedFoodId =
                null;

            searchQuery =
                "";

            render();
        }
    );
}

function validateCookingMethod(
    form: HTMLFormElement,
    formData: FormData,
    prefix: string
): CookingMethodValidation {
    const rawTemperature =
        getString(
            formData,
            `${prefix}-temperature`
        ).trim();

    const rawTimeMin =
        getString(
            formData,
            `${prefix}-time-min`
        ).trim();

    const rawTimeMax =
        getString(
            formData,
            `${prefix}-time-max`
        ).trim();

    const hasAnyValue =
        rawTemperature !==
            "" ||
        rawTimeMin !==
            "" ||
        rawTimeMax !==
            "";

    if (
        !hasAnyValue
    ) {
        return {
            valid:
                true
        };
    }

    const temperatureInput =
        form.querySelector<HTMLInputElement>(
            `[name="${prefix}-temperature"]`
        );

    const timeMinInput =
        form.querySelector<HTMLInputElement>(
            `[name="${prefix}-time-min"]`
        );

    const timeMaxInput =
        form.querySelector<HTMLInputElement>(
            `[name="${prefix}-time-max"]`
        );

    if (
        rawTemperature ===
        ""
    ) {
        markInputInvalid(
            temperatureInput
        );

        return {
            valid:
                false,

            message:
                t(
                    "foodForm.validation.temperatureRequired"
                )
        };
    }

    if (
        rawTimeMin ===
        ""
    ) {
        markInputInvalid(
            timeMinInput
        );

        return {
            valid:
                false,

            message:
                t(
                    "foodForm.validation.timeRequired"
                )
        };
    }

    const temperature =
        Number(
            rawTemperature
        );

    const timeMin =
        Number(
            rawTimeMin
        );

    const timeMax =
        rawTimeMax ===
        ""
            ? undefined
            : Number(
                rawTimeMax
            );

    if (
        !Number.isFinite(
            temperature
        ) ||
        temperature <
            MIN_TEMPERATURE ||
        temperature >
            MAX_TEMPERATURE
    ) {
        markInputInvalid(
            temperatureInput
        );

        return {
            valid:
                false,

            message:
                t(
                    "foodForm.validation.temperatureRange"
                )
        };
    }

    if (
        !Number.isFinite(
            timeMin
        ) ||
        timeMin <
            MIN_TIME ||
        timeMin >
            MAX_TIME
    ) {
        markInputInvalid(
            timeMinInput
        );

        return {
            valid:
                false,

            message:
                t(
                    "foodForm.validation.timeRange"
                )
        };
    }

    if (
        timeMax !==
        undefined
    ) {
        if (
            !Number.isFinite(
                timeMax
            ) ||
            timeMax <
                MIN_TIME ||
            timeMax >
                MAX_TIME
        ) {
            markInputInvalid(
                timeMaxInput
            );

            return {
                valid:
                    false,

                message:
                    t(
                        "foodForm.validation.timeRange"
                    )
            };
        }

        if (
            timeMax <
            timeMin
        ) {
            markInputInvalid(
                timeMaxInput
            );

            return {
                valid:
                    false,

                message:
                    t(
                        "foodForm.validation.maximumBeforeMinimum"
                    )
            };
        }
    }

    return {
        valid:
            true,

        method: {
            temperature,

            timeMin,

            ...(timeMax !==
            undefined
                ? {
                    timeMax
                }
                : {})
        }
    };
}

function getFirstInvalidMethodInput(
    form: HTMLFormElement,
    formData: FormData,
    prefix: string
): HTMLInputElement | null {
    const temperature =
        getString(
            formData,
            `${prefix}-temperature`
        ).trim();

    const timeMin =
        getString(
            formData,
            `${prefix}-time-min`
        ).trim();

    const timeMax =
        getString(
            formData,
            `${prefix}-time-max`
        ).trim();

    const temperatureInput =
        form.querySelector<HTMLInputElement>(
            `[name="${prefix}-temperature"]`
        );

    const timeMinInput =
        form.querySelector<HTMLInputElement>(
            `[name="${prefix}-time-min"]`
        );

    const timeMaxInput =
        form.querySelector<HTMLInputElement>(
            `[name="${prefix}-time-max"]`
        );

    if (
        temperature ===
        ""
    ) {
        return temperatureInput;
    }

    if (
        timeMin ===
        ""
    ) {
        return timeMinInput;
    }

    const temperatureNumber =
        Number(
            temperature
        );

    const timeMinNumber =
        Number(
            timeMin
        );

    if (
        !Number.isFinite(
            temperatureNumber
        ) ||
        temperatureNumber <
            MIN_TEMPERATURE ||
        temperatureNumber >
            MAX_TEMPERATURE
    ) {
        return temperatureInput;
    }

    if (
        !Number.isFinite(
            timeMinNumber
        ) ||
        timeMinNumber <
            MIN_TIME ||
        timeMinNumber >
            MAX_TIME
    ) {
        return timeMinInput;
    }

    if (
        timeMax !==
        ""
    ) {
        const timeMaxNumber =
            Number(
                timeMax
            );

        if (
            !Number.isFinite(
                timeMaxNumber
            ) ||
            timeMaxNumber <
                MIN_TIME ||
            timeMaxNumber >
                MAX_TIME ||
            timeMaxNumber <
                timeMinNumber
        ) {
            return timeMaxInput;
        }
    }

    return temperatureInput;
}

function markInputInvalid(
    input:
        HTMLInputElement |
        null
): void {
    if (!input) {
        return;
    }

    input.setAttribute(
        "aria-invalid",
        "true"
    );

    input.classList.add(
        "input-invalid"
    );
}

function clearInputValidation(
    input: HTMLInputElement
): void {
    input.removeAttribute(
        "aria-invalid"
    );

    input.classList.remove(
        "input-invalid"
    );
}

function clearAllFormErrors(
    form: HTMLFormElement
): void {
    form.querySelectorAll<HTMLInputElement>(
        ".input-invalid"
    ).forEach(
        (
            input
        ) => {
            clearInputValidation(
                input
            );
        }
    );

    clearNameError();

    form.querySelectorAll<HTMLElement>(
        "[data-cooking-method]"
    ).forEach(
        (
            element
        ) => {
            clearCookingMethodError(
                element
            );
        }
    );
}

function showNameError(
    message: string
): void {
    const element =
        document.querySelector<HTMLElement>(
            "[data-name-error]"
        );

    if (!element) {
        return;
    }

    element.textContent =
        message;

    element.hidden =
        false;
}

function clearNameError():
    void {
    const element =
        document.querySelector<HTMLElement>(
            "[data-name-error]"
        );

    if (!element) {
        return;
    }

    element.textContent =
        "";

    element.hidden =
        true;
}

function showCookingMethodError(
    form: HTMLFormElement,
    prefix: string,
    message: string
): void {
    const method =
        form.querySelector<HTMLElement>(
            `[data-cooking-method="${prefix}"]`
        );

    const error =
        form.querySelector<HTMLElement>(
            `[data-cooking-method-error="${prefix}"]`
        );

    method?.classList.add(
        "cooking-method-invalid"
    );

    if (
        error
    ) {
        error.textContent =
            message;

        error.hidden =
            false;
    }
}

function clearCookingMethodError(
    method: HTMLElement
): void {
    method.classList.remove(
        "cooking-method-invalid"
    );

    method
        .querySelectorAll<HTMLInputElement>(
            ".input-invalid"
        )
        .forEach(
            (
                input
            ) => {
                clearInputValidation(
                    input
                );
            }
        );

    const error =
        method.querySelector<HTMLElement>(
            "[data-cooking-method-error]"
        );

    if (
        error
    ) {
        error.textContent =
            "";

        error.hidden =
            true;
    }
}

function getSelectedFood():
    FoodItem | undefined {
    if (
        !selectedFoodId
    ) {
        return undefined;
    }

    return foods.find(
        (
            food
        ) =>
            food.id ===
            selectedFoodId
    );
}

function loadSortMode(): SortMode {
    const saved =
        localStorage.getItem(
            SORT_STORAGE_KEY
        );

    if (
        saved === "date-desc" ||
        saved === "date-asc" ||
        saved === "name-asc" ||
        saved === "name-desc"
    ) {
        return saved;
    }

    return "date-desc";
}

function setSortMode(
    mode: SortMode
): void {
    sortMode =
        mode;

    localStorage.setItem(
        SORT_STORAGE_KEY,
        mode
    );
}

function createId():
    string {
    if (
        typeof crypto
            .randomUUID ===
        "function"
    ) {
        return crypto
            .randomUUID();
    }

    if (
        typeof crypto
            .getRandomValues ===
        "function"
    ) {
        const bytes =
            new Uint8Array(
                16
            );

        crypto.getRandomValues(
            bytes
        );

        return Array.from(
            bytes
        )
            .map(
                (
                    byte
                ) =>
                    byte
                        .toString(
                            16
                        )
                        .padStart(
                            2,
                            "0"
                        )
            )
            .join("");
    }

    return (
        `${Date.now()}-` +
        Math.random()
            .toString(
                16
            )
            .slice(
                2
            )
    );
}

function getString(
    formData: FormData,
    key: string
): string {
    const value =
        formData.get(
            key
        );

    return typeof value ===
        "string"
        ? value
        : "";
}

function formatDate(
    value: string
): string {
    const language =
        getLanguage();

    return new Intl.DateTimeFormat(
        language === "de"
            ? "de-DE"
            : "en-GB",
        {
            day:
                "numeric",

            month:
                "long",

            year:
                "numeric"
        }
    ).format(
        new Date(
            value
        )
    );
}

function escapeHtml(
    value: string
): string {
    return value
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );
}