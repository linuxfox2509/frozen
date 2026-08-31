import "./style.css";
import "./pwa.css";

import {
    initializeTheme
} from "./theme";

import {
    initializeI18n
} from "./i18n/i18n";

import {
    initializePwa
} from "./pwa";

import {
    startApp
} from "./app";

async function main():
    Promise<void> {
    initializeTheme();
    initializeI18n();

    await Promise.all([
        initializePwa(),
        startApp()
    ]);
}

void main();