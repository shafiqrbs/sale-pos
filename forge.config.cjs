const { FusesPlugin } = require("@electron-forge/plugin-fuses");
const { FuseV1Options, FuseVersion } = require("@electron/fuses");

const NAME = "Sandra";
const NAME_LOWERCASE = NAME.toLowerCase();

module.exports = {
	packagerConfig: {
		asar: true,
		name: NAME,
		executableName: NAME_LOWERCASE,
		appBundleId: `com.${NAME_LOWERCASE}.app`,
		appCategoryType: "public.app-category.business",
		icon: "icons/brand.ico",
	},
	rebuildConfig: {},
	makers: [
		{
			name: "@electron-forge/maker-squirrel",
			config: {
				name: NAME,
				setupExe: ` ${NAME_LOWERCASE}-setup.exe`,
				setupIcon: "icons/brand.ico",
				iconUrl: "https://raw.githubusercontent.com/shafiqrbs/sale-pos/master/icons/brand.ico",
			},
		},
		{
			name: "@electron-forge/maker-zip",
			platforms: ["darwin"],
		},
		{
			name: "@electron-forge/maker-deb",
			config: {
				options: {
					name: NAME_LOWERCASE,
					productName: NAME,
					genericName: "Point of Sale",
					description:
						"Sandra - A smart desktop point-of-sale system for managing sales, inventory, purchases, and business operations.",
					categories: ["Office", "Finance"],
					icon: "icons/brand.png",
					maintainer: "Sharif Md. Minhaz <minhaz.rbs@gmail.com>",
				},
			},
		},
		{
			name: "@electron-forge/maker-rpm",
			config: {
				options: {
					name: NAME_LOWERCASE,
					productName: NAME,
					genericName: "Point of Sale",
					description: `${NAME} - A smart desktop point-of-sale system for managing sales, inventory, purchases, and business operations.`,
					categories: ["Office", "Finance"],
					icon: "icons/brand.png",
				},
			},
		},
	],
	plugins: [
		{
			name: "@electron-forge/plugin-auto-unpack-natives",
			config: {},
		},
		// Fuses are used to enable/disable various Electron functionality
		// at package time, before code signing the application
		new FusesPlugin({
			version: FuseVersion.V1,
			[FuseV1Options.RunAsNode]: false,
			[FuseV1Options.EnableCookieEncryption]: true,
			[FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
			[FuseV1Options.EnableNodeCliInspectArguments]: false,
			[FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
			[FuseV1Options.OnlyLoadAppFromAsar]: true,
		}),
	],
};
