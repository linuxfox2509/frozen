import {
    defineConfig
} from "vite";

import {
    VitePWA
} from "vite-plugin-pwa";

export default defineConfig({
    plugins: [
        VitePWA({
            registerType:
                "prompt",

            includeAssets: [
                "favicon.svg",
                "apple-touch-icon.png"
            ],

            manifest: {
                name:
                    "Frozen",

                short_name:
                    "Frozen",

                description:
                    "Save cooking instructions for frozen and packaged foods.",

                start_url:
                    "/",

                scope:
                    "/",

                display:
                    "standalone",

                background_color:
                    "#e6e8e2",

                theme_color:
                    "#c46442",

                orientation:
                    "portrait",

                icons: [
                    {
                        src:
                            "/pwa-192x192.png",

                        sizes:
                            "192x192",

                        type:
                            "image/png"
                    },

                    {
                        src:
                            "/pwa-512x512.png",

                        sizes:
                            "512x512",

                        type:
                            "image/png"
                    },

                    {
                        src:
                            "/pwa-maskable-512x512.png",

                        sizes:
                            "512x512",

                        type:
                            "image/png",

                        purpose:
                            "maskable"
                    }
                ]
            },

            workbox: {
                globPatterns: [
                    "**/*.{js,css,html,ico,png,svg,json}"
                ],

                cleanupOutdatedCaches:
                    true,

                clientsClaim:
                    true,

                skipWaiting:
                    false,

                navigateFallback:
                    "index.html"
            },

            devOptions: {
                enabled:
                    true
            }
        })
    ]
});