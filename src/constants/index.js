import flagBD from "@assets/images/flags/bd.svg";
import flagGB from "@assets/images/flags/gb.svg";

export const SHOW_PROGRESSIVE_WORKS = true;
export const RESTRICT_PRODUCT_QUANTITY_LIMIT = false;

export const CHARACTER_SET = [
	"PC437_USA",
	"PC850_MULTILINGUAL",
	"PC860_PORTUGUESE",
	"PC863_CANADIAN_FRENCH",
	"PC865_NORDIC",
	"PC851_GREEK",
	"PC857_TURKISH",
	"PC737_GREEK",
	"ISO8859_7_GREEK",
	"WPC1252",
	"PC866_CYRILLIC2",
	"PC852_LATIN2",
	"SLOVENIA",
	"PC858_EURO",
	"WPC775_BALTIC_RIM",
	"PC855_CYRILLIC",
	"PC861_ICELANDIC",
	"PC862_HEBREW",
	"PC864_ARABIC",
	"PC869_GREEK",
	"ISO8859_2_LATIN2",
	"ISO8859_15_LATIN9",
	"PC1125_UKRANIAN",
	"WPC1250_LATIN2",
	"WPC1251_CYRILLIC",
	"WPC1253_GREEK",
	"WPC1254_TURKISH",
	"WPC1255_HEBREW",
	"WPC1256_ARABIC",
	"WPC1257_BALTIC_RIM",
	"WPC1258_VIETNAMESE",
	"KZ1048_KAZAKHSTAN",
];
export const LINE_CHARACTER = [
	{ label: "---------------------------------", value: "-" },
	{ label: "=====================", value: "=" },
];

export const LANGUAGES = [
	{ label: "EN", value: "en", flag: flagGB },
	{ label: "BN", value: "bn", flag: flagBD },
];

export const SYNC_DATA = [
	{
		mode: "sales",
		description: "Sync sales data to cloud",
	},
	{
		mode: "purchases",
		description: "Sync purchase records",
	},
	{
		mode: "products",
		description: "Sync product catalog",
	},
	{
		mode: "customers",
		description: "Sync customer database",
	},
	{
		mode: "vendors",
		description: "Sync supplier information",
	},
];

export const ADVANCED_FILTER_SEARCH_OPERATOR = {
	INPUT_PARAMETER: {
		equal: "=",
		not_equal: "!=",
		in: "in",
		not_in: "not_in",
		starts_with: "starts_with",
		ends_with: "ends_with",
	},
	SELECT_PARAMETER: { equal: "=", not_equal: "!=", in: "in", not_in: "not_in" },
	DATE_PARAMETER: { equal: "=", not_equal: "!=", in: "in", not_in: "not_in" },
	NUMBER_PARAMETER: { equal: "=", not_equal: "!=", in: "in", not_in: "not_in" },
	TEXT_PARAMETER: { equal: "=", not_equal: "!=", in: "in", not_in: "not_in" },
	BOOLEAN_PARAMETER: { equal: "=", not_equal: "!=", in: "in", not_in: "not_in" },
	ARRAY_PARAMETER: { equal: "=", not_equal: "!=", in: "in", not_in: "not_in" },
	OBJECT_PARAMETER: { equal: "=", not_equal: "!=", in: "in", not_in: "not_in" },
};
