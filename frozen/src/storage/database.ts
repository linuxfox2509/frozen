import type {
    FoodItem
} from "../types/food";

const DATABASE_NAME =
    "frozen";

const DATABASE_VERSION =
    1;

const FOOD_STORE =
    "foods";

function openDatabase():
    Promise<IDBDatabase> {
    return new Promise(
        (
            resolve,
            reject
        ) => {
            const request =
                indexedDB.open(
                    DATABASE_NAME,
                    DATABASE_VERSION
                );

            request.onerror =
                () => {
                    reject(
                        request.error
                    );
                };

            request.onsuccess =
                () => {
                    resolve(
                        request.result
                    );
                };

            request.onupgradeneeded =
                () => {
                    const database =
                        request.result;

                    if (
                        !database
                            .objectStoreNames
                            .contains(
                                FOOD_STORE
                            )
                    ) {
                        const store =
                            database
                                .createObjectStore(
                                    FOOD_STORE,
                                    {
                                        keyPath:
                                            "id"
                                    }
                                );

                        store.createIndex(
                            "name",
                            "name"
                        );

                        store.createIndex(
                            "createdAt",
                            "createdAt"
                        );
                    }
                };
        }
    );
}

export async function addFood(
    food: FoodItem
): Promise<void> {
    const database =
        await openDatabase();

    return new Promise(
        (
            resolve,
            reject
        ) => {
            const transaction =
                database.transaction(
                    FOOD_STORE,
                    "readwrite"
                );

            const store =
                transaction.objectStore(
                    FOOD_STORE
                );

            store.add(
                food
            );

            transaction.oncomplete =
                () => {
                    database.close();

                    resolve();
                };

            transaction.onerror =
                () => {
                    database.close();

                    reject(
                        transaction.error
                    );
                };
        }
    );
}

export async function updateFood(
    food: FoodItem
): Promise<void> {
    const database =
        await openDatabase();

    return new Promise(
        (
            resolve,
            reject
        ) => {
            const transaction =
                database.transaction(
                    FOOD_STORE,
                    "readwrite"
                );

            const store =
                transaction.objectStore(
                    FOOD_STORE
                );

            store.put(
                food
            );

            transaction.oncomplete =
                () => {
                    database.close();

                    resolve();
                };

            transaction.onerror =
                () => {
                    database.close();

                    reject(
                        transaction.error
                    );
                };
        }
    );
}

export async function deleteFood(
    id: string
): Promise<void> {
    const database =
        await openDatabase();

    return new Promise(
        (
            resolve,
            reject
        ) => {
            const transaction =
                database.transaction(
                    FOOD_STORE,
                    "readwrite"
                );

            const store =
                transaction.objectStore(
                    FOOD_STORE
                );

            store.delete(
                id
            );

            transaction.oncomplete =
                () => {
                    database.close();

                    resolve();
                };

            transaction.onerror =
                () => {
                    database.close();

                    reject(
                        transaction.error
                    );
                };
        }
    );
}

export async function getFoods():
    Promise<FoodItem[]> {
    const database =
        await openDatabase();

    return new Promise(
        (
            resolve,
            reject
        ) => {
            const transaction =
                database.transaction(
                    FOOD_STORE,
                    "readonly"
                );

            const store =
                transaction.objectStore(
                    FOOD_STORE
                );

            const request =
                store.getAll();

            request.onsuccess =
                () => {
                    database.close();

                    resolve(
                        request.result
                    );
                };

            request.onerror =
                () => {
                    database.close();

                    reject(
                        request.error
                    );
                };
        }
    );
}

export async function resetDatabase():
    Promise<void> {
    return new Promise(
        (
            resolve,
            reject
        ) => {
            const request =
                indexedDB.deleteDatabase(
                    DATABASE_NAME
                );

            request.onsuccess =
                () => {
                    resolve();
                };

            request.onerror =
                () => {
                    reject(
                        request.error
                    );
                };

            request.onblocked =
                () => {
                    reject(
                        new Error(
                            "Database deletion was blocked."
                        )
                    );
                };
        }
    );
}