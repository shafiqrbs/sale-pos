const ThermalPrinter = require("node-thermal-printer").printer;
const PrinterTypes = require("node-thermal-printer").types;

const DOUBLE_LINE = "================================================================";

const thermalPrint = async ({ configData, salesItems, salesViewData, setup }) => {
	try {
		const printer = new ThermalPrinter({
			type: PrinterTypes.EPSON, // Printer type: 'star' or 'epson'
			interface: `//localhost//${setup.printer_name}`, // Printer interface
			characterSet: setup.character_set, // Printer character set - default: SLOVENIA
			lineCharacter: setup.line_character, // Set character for lines - default: "-"
			width: 64,
			options: {
				timeout: 5000,
			},
		});

		printer.setTypeFontB();
		printer.alignCenter();
		// await printer.printImage("./icons/sandra.png");
		printer.bold(true);
		printer.setTextSize(1, 1);
		printer.alignCenter();
		printer.println("Sandra Foods Intl.");
		printer.bold(false);

		printer.setTypeFontB();
		printer.setTextSize(0, 0);
		printer.drawLine();

		printer.alignCenter();
		printer.setTextSize(0, 0);
		printer.bold(true);
		printer.println(`${configData?.domain?.company_name || configData?.company_name || "Sandra"}`);
		printer.bold(false);
		printer.setTextSize(0, 0);
		printer.println(`Mobile : ${configData?.mobile || configData?.domain?.mobile || "N/A"}`);
		printer.setTextSize(0, 0);
		printer.println(`Address: ${configData?.address || "N/A"}`);
		printer.setTextSize(0, 0);
		printer.println(`Email  : ${configData?.email || configData?.domain?.email || "N/A"}`);
		printer.drawLine();

		printer.alignCenter();
		printer.bold(true);
		printer.setTextSize(0, 0);
		printer.println(`Bill No- ${salesViewData?.invoice?.slice(-6) || "N/A"}`);
		printer.bold(false);
		printer.drawLine();

		printer.setTypeFontB();
		printer.tableCustom([
			{ text: `Date: ${salesViewData?.created || "N/A"}`, align: "LEFT", width: 0.5 },
			{
				text: `${configData?.user?.username || "N/A"}`,
				align: "RIGHT",
				width: 0.5,
			},
		]);
		// printer.tableCustom([
		// 	{ text: `${salesViewData?.createdByName || "N/A"}`, align: "LEFT", width: 0.5 },
		// 	{ text: `${salesViewData?.customerMobile || "N/A"}`, align: "RIGHT", width: 0.5 },
		// ]);
		printer.drawLine();

		// Table Header
		printer.setTypeFontB();
		printer.bold(true);
		printer.tableCustom([
			{ text: "Item Name", align: "LEFT", width: 0.5 },
			{ text: "QTY", align: "CENTER", width: 0.05 },
			{ text: "Price", align: "RIGHT", width: 0.15 },
			{ text: "Total", align: "RIGHT", width: 0.25 },
		]);
		printer.bold(false);
		printer.println(DOUBLE_LINE);

		// Table Rows (Sales Items)
		salesItems.forEach((item) => {
			printer.tableCustom([
				{
					text: `${item?.item_name || item?.display_name || "-"}`,
					align: "LEFT",
					width: 0.5,
				},
				{ text: `${item?.quantity?.toString() || "0"}`, align: "CENTER", width: 0.05 },
				{ text: `${item?.sales_price?.toString() || "0.00"}`, align: "RIGHT", width: 0.1 },
				{ text: `${item?.sub_total?.toString() || "0.00"}`, align: "RIGHT", width: 0.3 },
			]);
		});

		printer.println(DOUBLE_LINE);
		// Totals
		printer.tableCustom([
			{ text: "SubTotal", align: "LEFT", bold: true, width: 0.5 },
			{
				text: `${salesViewData?.sub_total?.toFixed(2) || "0.00"}`,
				align: "RIGHT",
				width: 0.5,
			},
		]);
		printer.tableCustom([
			{ text: "Discount", align: "LEFT", bold: true, width: 0.5 },
			{
				text: `${salesViewData?.discount?.toFixed(2) || "0.00"}`,
				align: "RIGHT",
				width: 0.5,
			},
		]);
		printer.drawLine();
		printer.tableCustom([
			{ text: "Total", align: "LEFT", bold: true, width: 0.5 },
			{
				text: `${
					salesViewData?.total?.toFixed(2) || salesViewData?.sub_total?.toFixed(2) || "0.00"
				}`,
				align: "RIGHT",
				width: 0.5,
			},
		]);
		printer.tableCustom([
			{ text: "Receive", align: "LEFT", bold: true, width: 0.5 },
			{
				text: `${
					salesViewData?.payment?.toFixed(2) || salesViewData?.receive?.toFixed(2) || "0.00"
				}`,
				align: "RIGHT",
				width: 0.5,
			},
		]);

		printer.drawLine();

		printer.alignLeft();
		printer.bold(true);
		printer.println("Payments:");
		printer.bold(false);

		printer.println(DOUBLE_LINE);

		// =============== print all payments from payments array ================
		const payments = JSON.parse(salesViewData?.payments || "[]");
		payments?.forEach((payment) => {
			printer.tableCustom([
				{
					text: `-${payment?.transaction_mode_name || "Unknown"}:`,
					align: "LEFT",
					width: 0.5,
				},
				{
					text: `${payment?.amount?.toFixed(2) || "0.00"}`,
					align: "RIGHT",
					width: 0.5,
				},
			]);
		});

		printer.println(DOUBLE_LINE);
		printer.tableCustom([
			{ text: "Returned", align: "LEFT", bold: true, width: 0.5 },
			{
				text: `${Math.abs(Number(salesViewData?.total) - Number(salesViewData?.payment)).toFixed(
					2
				)}`,
				align: "RIGHT",
				width: 0.5,
			},
		]);

		printer.drawLine();

		// printer.bold(true);
		printer.setTextSize(0, 0);
		printer.println(
			"Thank you so much for choosing Sandra Foods. We truly appreciate your trust and support."
		);
		// printer.bold(false);

		printer.cut();

		const data = await printer.execute();

		console.info("Print data:", data);
		return { success: true, message: data };
	} catch (error) {
		console.error("Error in thermal-Print:", error);
		return { success: false, message: error };
	}
};

const kitchenPrint = async ({ configData, selectedProducts, salesByUserName, setup }) => {
	try {
		const printer = new ThermalPrinter({
			type: PrinterTypes.EPSON, // Printer type: 'star' or 'epson'
			interface: `//localhost//${setup.printer_name}`, // Printer interface
			characterSet: setup.character_set, // Printer character set - default: SLOVENIA
			lineCharacter: setup.line_character, // Set character for lines - default: "-"
			width: 64,
			options: {
				timeout: 5000,
			},
		});

		printer.bold(true);
		printer.setTextSize(1, 1);
		printer.alignCenter();
		printer.println(
			`© ${configData?.domain?.company_name || configData?.company_name || "Sandra"}`
		);
		printer.bold(false);
		printer.setTypeFontB();
		printer.setTextSize(0, 0);
		printer.drawLine();

		printer.setTypeFontB();
		printer.tableCustom([
			{ text: `${salesByUserName || "N/A"}`, align: "LEFT", width: 0.5 },
			{ text: `${new Date().toLocaleString()}`, align: "RIGHT", width: 0.5 },
		]);
		printer.drawLine();

		// Table Header
		printer.setTypeFontB();
		printer.bold(true);
		printer.tableCustom([
			{ text: "Name", align: "LEFT", width: 0.7 },
			{ text: "QTY", align: "RIGHT", width: 0.3 },
		]);
		printer.bold(false);
		printer.drawLine();

		// Table Rows (Kitchen Items)
		selectedProducts.items.forEach((item) => {
			printer.tableCustom([
				{ text: `${item?.display_name || "-"}`, align: "LEFT", width: 0.7 },
				{ text: `${item?.quantity?.toString() || "0"}`, align: "RIGHT", width: 0.3 },
			]);
		});

		printer.drawLine();

		if (selectedProducts.note) {
			printer.alignLeft();
			printer.bold(true);
			printer.println("Note:");
			printer.bold(false);
			printer.println(selectedProducts.note);
			printer.drawLine();
		}

		printer.alignCenter();
		printer.bold(true);
		printer.setTextSize(0, 0);
		printer.println(
			`© ${configData?.domain?.company_name || configData?.company_name || "Sandra"}`
		);
		printer.bold(false);

		printer.cut();

		const data = await printer.execute();

		console.info("Kitchen print data:", data);
		return { success: true, message: data };
	} catch (error) {
		console.error("Error in kitchen-Print:", error);
		return { success: false, message: error };
	}
};

module.exports = {
	thermalPrint,
	kitchenPrint,
};
