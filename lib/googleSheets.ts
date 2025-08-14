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

export async function getItemByCode(
	code: string
): Promise<{ quantity: number; location: string } | null> {
	const sheets = getSheetsClient();
	const range = `${SHEET_TAB()}!A:C`;
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
			const quantity = Number.isFinite(qty) ? qty : 0;
			const location = String(row[2] ?? "").trim();
			return { quantity, location };
		}
	}
	return null;
}

export async function updateItemByCode(
	code: string,
	data: { quantity?: number; location?: string }
): Promise<boolean> {
	const sheets = getSheetsClient();
	const range = `${SHEET_TAB()}!A:C`; // Read columns A, B, and C
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

	const sheetRowNumber = targetRowIndex + 1; // Sheets API uses 1-based row numbers

	// Prepare the data to be updated
	const existingRow = rows[targetRowIndex];
	const newQuantity = data.quantity ?? existingRow[1];
	const newLocation = data.location ?? existingRow[2];

	// Update columns B (quantity) and C (location) for the found row
	const updateRange = `${SHEET_TAB()}!B${sheetRowNumber}:C${sheetRowNumber}`;
	await sheets.spreadsheets.values.update({
		spreadsheetId: SHEET_ID(),
		range: updateRange,
		valueInputOption: "RAW",
		requestBody: { values: [[newQuantity, newLocation]] },
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
		const qtyStr = String(row[1] ?? "").trim();
		const qtyParsed = Number.parseInt(qtyStr, 10);
		// Skip likely header row if first row has non-numeric quantity
		if (i === 0 && !Number.isFinite(qtyParsed)) continue;
		const quantity = Number.isFinite(qtyParsed) ? qtyParsed : 0;
		results.push({ code: codeRaw, quantity });
	}
	return results;
}
