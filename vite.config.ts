// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
// @cloudflare/vite-plugin builds from this — wrangler.jsonc main alone is insufficient.
export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
//   vite: {
//     resolve: {
//       alias: {
//         // Fix runtime ESM import mismatch for React 19 environments.
//         // Some bundles may try to import the ESM-shim entrypoint that doesn't
//         // correctly re-export `useSyncExternalStore`.
//         // "use-sync-external-store/shim": "use-sync-external-store",
//       },
//     },
//     optimizeDeps: {
//       noDiscovery: true,
//       include: [],
//     },
//   },
// });
vite: {
  resolve: {
    alias: {
      // "use-sync-external-store/shim":
      //   "/src/lib/react-sync-store.ts",

      // "use-sync-external-store":
      //   "/src/lib/react-sync-store.ts",
      "use-sync-external-store/shim/with-selector":
    "use-sync-external-store/with-selector",
    },
  },

  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "@tanstack/react-router",
      "@tanstack/react-store",
    ],
  },
},
});
