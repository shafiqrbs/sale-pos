import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { polyfillNode } from "esbuild-plugin-polyfill-node";

// https://vite.dev/config/
export default defineConfig({
	base: "./",
	plugins: [
		react({
			babel: {
				plugins: [["babel-plugin-react-compiler"]],
			},
		}),
		polyfillNode({
			globals: { buffer: true },
			polyfills: {
				stream: true,
			},
		}),
	],
	server: {
		port: 3000,
	},
	build: {
		outDir: "dist",
		emptyOutDir: true,
	},
	resolve: {
		alias: {
			"@components": "/src/common/components",
			"@services": "/src/services",
			"@features": "/src/features",
			"@constants": "/src/constants",
			"@utils": "/src/common/utils",
			"@assets": "/src/assets",
			"@hooks": "/src/common/hooks",
			"@modules": "/src/modules",
			"@": "/src",

			"@tabler/icons-react": "@tabler/icons-react/dist/esm/icons/index.mjs",
		},
	},
});
