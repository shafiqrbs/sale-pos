const path = require("path");
const { app } = require("electron");
const Database = require("better-sqlite3");

const userDataPath = app.getPath("userData");
const dbPath = path.join(userDataPath, "pos.db");
console.log(`Local database path: ${dbPath}`);

const db = new Database(dbPath);

const close = () => {
	db.close();
};

module.exports = { db, close };
