const bcrypt = require("bcrypt");
const { db } = require("./connection.cjs");

// Offline login: looks up a user in core_users by username, verifies the
// bcrypt hash (12 rounds) in the main process, and returns the row with the
// password column stripped. Response shape matches the old online API
// ({ status, data } / { status, message }) so Login.jsx only needs the
// transport swapped.
const loginUser = async ({ username, password } = {}) => {
	try {
		if (typeof username !== "string" || typeof password !== "string" || !username || !password) {
			return { status: 401, message: "InvalidCredentials" };
		}

		const row = db.prepare("SELECT * FROM core_users WHERE username = ?").get(username);
		if (!row || typeof row.password !== "string") {
			return { status: 401, message: "InvalidCredentials" };
		}

		// node's bcrypt only understands $2a$/$2b$; rewrite the PHP-style
		// $2y$ prefix so hashes seeded from PHP or bcrypt-generator.com verify correctly
		const normalizedHash = row.password.replace(/^\$2y\$/, "$2b$");

		const ok = await bcrypt.compare(password, normalizedHash);
		if (!ok) {
			return { status: 401, message: "InvalidCredentials" };
		}

		const { password: _pw, ...safeUser } = row;
		return { status: 200, data: safeUser };
	} catch (error) {
		console.error("Error in loginUser:", error);
		return { status: 500, message: "LoginFailed" };
	}
};

module.exports = { loginUser };
