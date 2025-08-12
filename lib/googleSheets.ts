import { google } from "googleapis";

type SheetsClient = ReturnType<typeof google.sheets>;

function getEnv(name: string, required = true): string | undefined {
	const value = process.env[name];
	if (required && (!value || value.length === 0)) {
		throw new Error(`Missing required env var ${name}`);
	}
	return value;
}

function createAuth() {
	const clientEmail = getEnv("GOOGLE_SERVICE_ACCOUNT_EMAIL");
	const privateKeyRaw = getEnv("GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY");
	const privateKey = privateKeyRaw!.replace(/\\n/g, "\n");
	return new google.auth.JWT({
		email: clientEmail,
		key: privateKey,
		scopes: ["https://www.googleapis.com/auth/spreadsheets"],
	});
}

function getSheetsClient(): SheetsClient {
	const auth = createAuth();
	return google.sheets({ version: "v4", auth });
}

const SHEET_ID = () => getEnv("GOOGLE_SHEETS_ID")!;
const SHEET_TAB = () => getEnv("GOOGLE_SHEETS_TAB", false) || "Sheet1";

// Assumes two columns: A = code, B = quantity. Header row optional; we will skip
// the first row if it contains non-numeric quantity and non-5-char code.
export async function getQuantityByCode(code: string): Promise<number | null> {
	const sheets = getSheetsClient();
	const range = `${SHEET_TAB()}!A:B`;
	const resp = await sheets.spreadsheets.values.get({
		spreadsheetId: SHEET_ID(),
		range,
		majorDimension: "ROWS",
	});
	const rows = resp.data.values || [];
	if (rows.length === 0) return null;

	for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
		const row = rows[rowIndex];
		if (!row || row.length === 0) continue;
		const rowCode = String(row[0] ?? "")
			.trim()
			.toUpperCase();
		if (rowCode === code) {
			const qtyStr = String(row[1] ?? "").trim();
			const qty = Number.parseInt(qtyStr, 10);
			if (Number.isFinite(qty)) return qty;
			return 0;
		}
	}
	return null;
}

export async function setQuantityByCode(
	code: string,
	quantity: number
): Promise<boolean> {
	const sheets = getSheetsClient();
	const range = `${SHEET_TAB()}!A:B`;
	const resp = await sheets.spreadsheets.values.get({
		spreadsheetId: SHEET_ID(),
		range,
		majorDimension: "ROWS",
	});
	const rows = resp.data.values || [];

	// Find row index for code
	let targetRowIndex: number | null = null; // zero-based within returned rows
	for (let i = 0; i < rows.length; i += 1) {
		const row = rows[i];
		const rowCode = String(row?.[0] ?? "")
			.trim()
			.toUpperCase();
		if (rowCode === code) {
			targetRowIndex = i;
			break;
		}
	}

	if (targetRowIndex === null) {
		return false; // not found
	}

	// Sheets API uses 1-based row numbers and A1 notation.
	const sheetRowNumber = targetRowIndex + 1; // including header if present
	const updateRange = `${SHEET_TAB()}!B${sheetRowNumber}:B${sheetRowNumber}`;
	await sheets.spreadsheets.values.update({
		spreadsheetId: SHEET_ID(),
		range: updateRange,
		valueInputOption: "RAW",
		requestBody: { values: [[quantity]] },
	});
	return true;
}

export async function getAllCodeQuantity(): Promise<
	Array<{ code: string; quantity: number }>
> {
	const sheets = getSheetsClient();
	// Sheet has 4 columns (code, quantity, title, qr) but we only need A and B
	const range = `${SHEET_TAB()}!A:B`;
	const resp = await sheets.spreadsheets.values.get({
		spreadsheetId: SHEET_ID(),
		range,
		majorDimension: "ROWS",
	});
	const rows = resp.data.values || [];
	const results: Array<{ code: string; quantity: number }> = [];
	for (let i = 0; i < rows.length; i += 1) {
		const row = rows[i] ?? [];
		const codeRaw = String(row[0] ?? "").trim();
		if (!codeRaw) continue; // skip empty code rows
		// Keep original case for code display? Requirement shows lowercase in example; keep as-is
		const qtyStr = String(row[1] ?? "").trim();
		const qtyParsed = Number.parseInt(qtyStr, 10);
		const quantity = Number.isFinite(qtyParsed) ? qtyParsed : 0;
		results.push({ code: codeRaw, quantity });
	}
	return results;
}
