import burgerSvg from "@tabler/icons/outline/burger.svg?raw";
import settingsSvg from "@tabler/icons/outline/settings.svg?raw";

import searchSvg from "@tabler/icons/outline/search.svg?raw";
import sortSvg from "@tabler/icons/outline/arrows-sort.svg?raw";
import plusSvg from "@tabler/icons/outline/plus.svg?raw";
import checkSvg from "@tabler/icons/outline/check.svg?raw";

import sunSvg from "@tabler/icons/outline/sun.svg?raw";
import moonSvg from "@tabler/icons/outline/moon.svg?raw";
import smartphoneSvg from "@tabler/icons/outline/device-mobile.svg?raw";

import snowflakeSvg from "@tabler/icons/outline/snowflake.svg?raw";

import arrowLeftSvg from "@tabler/icons/outline/arrow-left.svg?raw";
import ovenSvg from "@tabler/icons/outline/cooker.svg?raw";
import fanSvg from "@tabler/icons/outline/propeller.svg?raw";
import airFryerSvg from "@tabler/icons/outline/blender.svg?raw";

export const icons = {
    burger: burgerSvg,
    settings: settingsSvg,

    search: searchSvg,
    sort: sortSvg,
    plus: plusSvg,
    check: checkSvg,

    sun: sunSvg,
    moon: moonSvg,
    smartphone: smartphoneSvg,

    snowflake: snowflakeSvg,

    back: arrowLeftSvg,
    oven: ovenSvg,
    fan: fanSvg,
    airFryer: airFryerSvg
};

export type IconName = keyof typeof icons;

export function icon(
    name: IconName,
    className = "ui-icon"
): string {
    return `
        <span
            class="${className}"
            aria-hidden="true"
        >
            ${icons[name]}
        </span>
    `;
}