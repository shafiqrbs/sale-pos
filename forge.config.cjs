const { FusesPlugin } = require("@electron-forge/plugin-fuses");
const { FuseV1Options, FuseVersion } = require("@electron/fuses");

module.exports = {
	packagerConfig: {
		asar: true,
		name: "PosKeeper",
		executableName: "poskeeper",
		appBundleId: "com.poskeeper.app",
		appCategoryType: "public.app-category.business",
		icon: "icons/brand.ico"
	},
	rebuildConfig: {},
	makers: [
		{
			name: "@electron-forge/maker-squirrel",
			config: {
				name: "PosKeeper",
				setupExe: "poskeeper-setup.exe",
				setupIcon: "icons/brand.ico",
			},
		},
		{
			name: "@electron-forge/maker-zip",
			platforms: [ "darwin" ],
		},
		{
			name: "@electron-forge/maker-deb",
			config: {
				options: {
					name: "poskeeper",
					productName: "PosKeeper",
					genericName: "Point of Sale",
					description: "PosKeeper - A smart desktop point-of-sale system for managing sales, inventory, purchases, and business operations.",
					categories: [ "Office", "Finance" ],
					icon: "icons/brand.png",
					maintainer: "Sharif Md. Minhaz <minhaz.rbs@gmail.com>",
				},
			},
		},
		{
			name: "@electron-forge/maker-rpm",
			config: {
				options: {
					name: "poskeeper",
					productName: "PosKeeper",
					genericName: "Point of Sale",
					description: "PosKeeper - A smart desktop point-of-sale system for managing sales, inventory, purchases, and business operations.",
					categories: [ "Office", "Finance" ],
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
			[ FuseV1Options.RunAsNode ]: false,
			[ FuseV1Options.EnableCookieEncryption ]: true,
			[ FuseV1Options.EnableNodeOptionsEnvironmentVariable ]: false,
			[ FuseV1Options.EnableNodeCliInspectArguments ]: false,
			[ FuseV1Options.EnableEmbeddedAsarIntegrityValidation ]: true,
			[ FuseV1Options.OnlyLoadAppFromAsar ]: true,
		}),
	],
};
