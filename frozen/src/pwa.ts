import {
    registerSW
} from "virtual:pwa-register";

import {
    t
} from "./i18n/i18n";

export type OfflineCacheStatus = {
    supported: boolean;
    serviceWorkerActive: boolean;
    cached: boolean;
    cacheCount: number;
    entryCount: number;
};

export type UpdateCheckResult =
    | "available"
    | "current"
    | "unsupported"
    | "error";

let updateServiceWorker:
    ((reloadPage?: boolean) => Promise<void>) |
    undefined;

let updateAvailable =
    false;

let offlineBanner:
    HTMLDivElement | null =
    null;

let updateBanner:
    HTMLDivElement | null =
    null;

export async function initializePwa():
    Promise<void> {
    if (
        !(
            "serviceWorker" in
            navigator
        )
    ) {
        return;
    }

    const firstInstallation =
        navigator
            .serviceWorker
            .controller ===
        null;

    let preparationScreen:
        HTMLDivElement | null =
        null;

    if (
        firstInstallation
    ) {
        preparationScreen =
            createPreparationScreen();
    }

    updateServiceWorker =
        registerSW({
            immediate: true,

            onNeedRefresh() {
                updateAvailable =
                    true;

                showUpdateBanner();
            },

            onOfflineReady() {
                showOfflineReadyMessage();
            },

            onRegisterError(
                error
            ) {
                console.error(
                    "Service worker registration failed:",
                    error
                );

                removePreparationScreen(
                    preparationScreen
                );
            }
        });

    try {
        await navigator
            .serviceWorker
            .ready;

        await requestPersistentStorage();

        if (
            preparationScreen
        ) {
            setPreparationReady(
                preparationScreen
            );

            await delay(
                850
            );

            removePreparationScreen(
                preparationScreen
            );
        }
    } catch (
        error
    ) {
        console.error(
            "Offline preparation failed:",
            error
        );

        removePreparationScreen(
            preparationScreen
        );
    }

    initializeNetworkStatus();
}

export async function getOfflineCacheStatus():
    Promise<OfflineCacheStatus> {
    if (
        !(
            "serviceWorker" in
            navigator
        ) ||
        !(
            "caches" in
            window
        )
    ) {
        return {
            supported: false,
            serviceWorkerActive:
                false,
            cached:
                false,
            cacheCount:
                0,
            entryCount:
                0
        };
    }

    const registration =
        await navigator
            .serviceWorker
            .getRegistration();

    const cacheNames =
        await caches.keys();

    const appCacheNames =
        cacheNames.filter(
            isFrozenCacheName
        );

    let entryCount =
        0;

    for (
        const cacheName of
        appCacheNames
    ) {
        const cache =
            await caches.open(
                cacheName
            );

        const requests =
            await cache.keys();

        entryCount +=
            requests.length;
    }

    const serviceWorkerActive =
        Boolean(
            registration
                ?.active
        );

    return {
        supported:
            true,

        serviceWorkerActive,

        cached:
            serviceWorkerActive &&
            appCacheNames.length >
                0 &&
            entryCount >
                0,

        cacheCount:
            appCacheNames.length,

        entryCount
    };
}

export async function clearOfflineCache():
    Promise<void> {
    if (
        !(
            "caches" in
            window
        )
    ) {
        return;
    }

    const cacheNames =
        await caches.keys();

    const appCacheNames =
        cacheNames.filter(
            isFrozenCacheName
        );

    await Promise.all(
        appCacheNames.map(
            (
                cacheName
            ) =>
                caches.delete(
                    cacheName
                )
        )
    );
}

export async function prepareOfflineAgain():
    Promise<void> {
    await unregisterFrozenServiceWorkers();

    await clearOfflineCache();

    window.location.reload();
}

export async function checkForAppUpdate():
    Promise<UpdateCheckResult> {
    if (
        !(
            "serviceWorker" in
            navigator
        )
    ) {
        return "unsupported";
    }

    try {
        const registration =
            await navigator
                .serviceWorker
                .getRegistration();

        if (
            !registration
        ) {
            return "unsupported";
        }

        if (
            registration.waiting
        ) {
            updateAvailable =
                true;

            return "available";
        }

        let updateFound:
            ServiceWorker | null =
            null;

        const updateFoundPromise =
            new Promise<ServiceWorker | null>(
                (
                    resolve
                ) => {
                    const timeout =
                        window.setTimeout(
                            () => {
                                resolve(
                                    null
                                );
                            },
                            2500
                        );

                    registration
                        .addEventListener(
                            "updatefound",
                            () => {
                                window.clearTimeout(
                                    timeout
                                );

                                resolve(
                                    registration
                                        .installing
                                );
                            },
                            {
                                once:
                                    true
                            }
                        );
                }
            );

        await registration.update();

        if (
            registration.waiting
        ) {
            updateAvailable =
                true;

            return "available";
        }

        updateFound =
            await updateFoundPromise;

        if (
            !updateFound
        ) {
            return "current";
        }

        await waitForWorkerInstallation(
            updateFound
        );

        const refreshedRegistration =
            await navigator
                .serviceWorker
                .getRegistration();

        if (
            refreshedRegistration
                ?.waiting
        ) {
            updateAvailable =
                true;

            return "available";
        }

        if (
            updateFound.state ===
            "installed"
        ) {
            updateAvailable =
                true;

            return "available";
        }

        return "current";
    } catch (
        error
    ) {
        console.error(
            "Update check failed:",
            error
        );

        return "error";
    }
}

export function hasPendingAppUpdate():
    boolean {
    return updateAvailable;
}

export async function installAppUpdate():
    Promise<void> {
    if (
        updateServiceWorker
    ) {
        await updateServiceWorker(
            true
        );

        return;
    }

    if (
        !(
            "serviceWorker" in
            navigator
        )
    ) {
        return;
    }

    const registration =
        await navigator
            .serviceWorker
            .getRegistration();

    const waitingWorker =
        registration
            ?.waiting;

    if (
        !waitingWorker
    ) {
        return;
    }

    await new Promise<void>(
        (
            resolve
        ) => {
            navigator
                .serviceWorker
                .addEventListener(
                    "controllerchange",
                    () => {
                        resolve();
                    },
                    {
                        once:
                            true
                    }
                );

            waitingWorker
                .postMessage({
                    type:
                        "SKIP_WAITING"
                });
        }
    );

    window.location.reload();
}

export async function resetPwaState():
    Promise<void> {
    if (
        "caches" in
        window
    ) {
        const cacheNames =
            await caches.keys();

        await Promise.all(
            cacheNames.map(
                (
                    cacheName
                ) =>
                    caches.delete(
                        cacheName
                    )
            )
        );
    }

    await unregisterFrozenServiceWorkers();
}

function isFrozenCacheName(
    cacheName: string
): boolean {
    const normalized =
        cacheName
            .toLowerCase();

    return (
        normalized.includes(
            "workbox"
        ) ||
        normalized.includes(
            "precache"
        ) ||
        normalized.includes(
            "frozen"
        )
    );
}

async function unregisterFrozenServiceWorkers():
    Promise<void> {
    if (
        !(
            "serviceWorker" in
            navigator
        )
    ) {
        return;
    }

    const registrations =
        await navigator
            .serviceWorker
            .getRegistrations();

    await Promise.all(
        registrations.map(
            (
                registration
            ) =>
                registration.unregister()
        )
    );
}

function waitForWorkerInstallation(
    worker: ServiceWorker
): Promise<void> {
    if (
        worker.state ===
            "installed" ||
        worker.state ===
            "activated" ||
        worker.state ===
            "redundant"
    ) {
        return Promise.resolve();
    }

    return new Promise(
        (
            resolve
        ) => {
            const timeout =
                window.setTimeout(
                    () => {
                        resolve();
                    },
                    10000
                );

            worker.addEventListener(
                "statechange",
                () => {
                    if (
                        worker.state ===
                            "installed" ||
                        worker.state ===
                            "activated" ||
                        worker.state ===
                            "redundant"
                    ) {
                        window.clearTimeout(
                            timeout
                        );

                        resolve();
                    }
                }
            );
        }
    );
}

function createPreparationScreen():
    HTMLDivElement {
    const element =
        document.createElement(
            "div"
        );

    element.className =
        "offline-preparation";

    element.innerHTML = `
        <div class="offline-preparation-content">

            <div
                class="offline-preparation-spinner"
                aria-hidden="true"
            ></div>

            <div class="offline-preparation-text">

                <strong>
                    ${t(
                        "pwa.preparing.title"
                    )}
                </strong>

                <span>
                    ${t(
                        "pwa.preparing.message"
                    )}
                </span>

            </div>

        </div>
    `;

    document.body.appendChild(
        element
    );

    return element;
}

function setPreparationReady(
    element: HTMLDivElement
): void {
    const spinner =
        element.querySelector<HTMLDivElement>(
            ".offline-preparation-spinner"
        );

    const title =
        element.querySelector<HTMLElement>(
            ".offline-preparation-text strong"
        );

    const message =
        element.querySelector<HTMLElement>(
            ".offline-preparation-text span"
        );

    spinner?.classList.add(
        "ready"
    );

    if (
        title
    ) {
        title.textContent =
            t(
                "pwa.ready.title"
            );
    }

    if (
        message
    ) {
        message.textContent =
            t(
                "pwa.ready.message"
            );
    }
}

function removePreparationScreen(
    element:
        HTMLDivElement |
        null
): void {
    if (
        !element
    ) {
        return;
    }

    element.classList.add(
        "closing"
    );

    window.setTimeout(
        () => {
            element.remove();
        },
        220
    );
}

function initializeNetworkStatus():
    void {
    window.addEventListener(
        "offline",
        () => {
            showOfflineBanner();
        }
    );

    window.addEventListener(
        "online",
        () => {
            hideOfflineBanner();
        }
    );

    if (
        !navigator.onLine
    ) {
        showOfflineBanner();
    }
}

function showOfflineBanner():
    void {
    if (
        offlineBanner
    ) {
        return;
    }

    offlineBanner =
        document.createElement(
            "div"
        );

    offlineBanner.className =
        "pwa-banner offline-banner";

    offlineBanner.innerHTML = `
        <span>
            ${t(
                "pwa.offline"
            )}
        </span>
    `;

    document.body.appendChild(
        offlineBanner
    );
}

function hideOfflineBanner():
    void {
    if (
        !offlineBanner
    ) {
        return;
    }

    const banner =
        offlineBanner;

    offlineBanner =
        null;

    banner.classList.add(
        "closing"
    );

    window.setTimeout(
        () => {
            banner.remove();
        },
        180
    );
}

function showUpdateBanner():
    void {
    if (
        updateBanner
    ) {
        return;
    }

    updateBanner =
        document.createElement(
            "div"
        );

    updateBanner.className =
        "pwa-banner update-banner";

    updateBanner.innerHTML = `
        <span>
            ${t(
                "pwa.updateAvailable"
            )}
        </span>

        <button
            type="button"
            data-pwa-update
        >
            ${t(
                "pwa.update"
            )}
        </button>
    `;

    document.body.appendChild(
        updateBanner
    );

    const button =
        updateBanner
            .querySelector<HTMLButtonElement>(
                "[data-pwa-update]"
            );

    button?.addEventListener(
        "click",
        async () => {
            button.disabled =
                true;

            button.textContent =
                t(
                    "pwa.updating"
                );

            try {
                await installAppUpdate();
            } catch (
                error
            ) {
                console.error(
                    "PWA update failed:",
                    error
                );

                button.disabled =
                    false;

                button.textContent =
                    t(
                        "pwa.update"
                    );
            }
        }
    );
}

function showOfflineReadyMessage():
    void {
    if (
        document.querySelector(
            ".offline-preparation"
        )
    ) {
        return;
    }

    const message =
        document.createElement(
            "div"
        );

    message.className =
        "pwa-banner ready-banner";

    message.textContent =
        t(
            "pwa.offlineReady"
        );

    document.body.appendChild(
        message
    );

    window.setTimeout(
        () => {
            message.classList.add(
                "closing"
            );

            window.setTimeout(
                () => {
                    message.remove();
                },
                180
            );
        },
        2200
    );
}

async function requestPersistentStorage():
    Promise<void> {
    if (
        !navigator.storage ||
        !navigator.storage.persist
    ) {
        return;
    }

    try {
        const alreadyPersistent =
            await navigator
                .storage
                .persisted();

        if (
            alreadyPersistent
        ) {
            return;
        }

        await navigator
            .storage
            .persist();
    } catch (
        error
    ) {
        console.warn(
            "Persistent storage could not be requested:",
            error
        );
    }
}

function delay(
    milliseconds: number
): Promise<void> {
    return new Promise(
        (
            resolve
        ) => {
            window.setTimeout(
                resolve,
                milliseconds
            );
        }
    );
}