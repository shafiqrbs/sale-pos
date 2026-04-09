/**
 * Database migration runner.
 *
 * Migration files live in  data/migrations/migration_N.json
 * Each file is a JSON array of SQL statements, e.g.:
 *   ["ALTER TABLE purchase ADD COLUMN due REAL DEFAULT 0"]
 *
 * data/migration_run_history.json tracks which files have already been applied
 * so re-running the script never executes the same migration twice.
 *
 * Usage:
 *   npm run migrate
 */

"use strict";

const path = require("path");
const fs = require("fs");
const os = require("os");
const Database = require("better-sqlite3");

// ── resolve DB path the same way Electron does ─────────────────────────────
function getDbPath() {
	const appName = "sandra";
	switch (process.platform) {
		case "win32":
			return path.join(process.env.APPDATA || os.homedir(), appName, "pos.db");
		case "darwin":
			return path.join(os.homedir(), "Library", "Application Support", appName, "pos.db");
		default:
			// Linux and anything else
			return path.join(os.homedir(), ".config", appName, "pos.db");
	}
}

// ── paths ───────────────────────────────────────────────────────────────────
const ROOT = path.join(__dirname, "..");
const MIGRATIONS_DIR = path.join(ROOT, "data", "migrations");
const HISTORY_FILE = path.join(ROOT, "data", "migration_run_history.json");
const DB_PATH = getDbPath();

// ── load history ────────────────────────────────────────────────────────────
function loadHistory() {
	try {
		const raw = fs.readFileSync(HISTORY_FILE, "utf8").trim();
		return raw ? JSON.parse(raw) : [];
	} catch {
		return [];
	}
}

function saveHistory(history) {
	fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2) + "\n", "utf8");
}

// ── main ─────────────────────────────────────────────────────────────────────
function run() {
	if (!fs.existsSync(DB_PATH)) {
		console.error(`Database not found at: ${DB_PATH}`);
		console.error("Start the app at least once so the database is created, then run migrations.");
		process.exit(1);
	}

	const db = new Database(DB_PATH);
	const history = loadHistory();

	// collect and sort migration files alphabetically (migration_1 before migration_10 etc.)
	const files = fs
		.readdirSync(MIGRATIONS_DIR)
		.filter((f) => f.endsWith(".json"))
		.sort((a, b) => {
			// sort by the numeric suffix if present, otherwise lexicographically
			const numA = parseInt(a.match(/\d+/)?.[0] ?? "0", 10);
			const numB = parseInt(b.match(/\d+/)?.[0] ?? "0", 10);
			return numA !== numB ? numA - numB : a.localeCompare(b);
		});

	let applied = 0;
	let skipped = 0;

	for (const file of files) {
		if (history.includes(file)) {
			console.log(`  skip  ${file} (already applied)`);
			skipped++;
			continue;
		}

		const filePath = path.join(MIGRATIONS_DIR, file);
		let statements;

		try {
			statements = JSON.parse(fs.readFileSync(filePath, "utf8"));
		} catch (err) {
			console.error(`  ERROR parsing ${file}: ${err.message}`);
			continue;
		}

		if (!Array.isArray(statements) || statements.length === 0) {
			console.log(`  skip  ${file} (empty migration)`);
			history.push(file);
			saveHistory(history);
			skipped++;
			continue;
		}

		console.log(`  apply ${file} (${statements.length} statement(s))`);

		for (const sql of statements) {
			if (!sql || !sql.trim()) continue;
			try {
				db.prepare(sql).run();
				console.log(`    OK: ${sql.slice(0, 80)}${sql.length > 80 ? "…" : ""}`);
			} catch (err) {
				console.warn(`    WARN: ${err.message} — statement: ${sql.slice(0, 80)}`);
				// continue: most errors here mean the change is already present
			}
		}

		history.push(file);
		saveHistory(history);
		applied++;
	}

	db.close();
	console.log(`\nDone. Applied: ${applied}, Skipped: ${skipped}`);
}

run();
