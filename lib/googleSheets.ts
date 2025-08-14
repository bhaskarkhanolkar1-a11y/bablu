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
	const range = `${SHEET_TAB()}!A:C`; // Read columns A, B, and C
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

// NEW: A more robust update function
export async function updateItem(
	currentCode: string,
	updateData: { newCode?: string; quantity?: number; location?: string }
): Promise<boolean> {
	const sheets = getSheetsClient();
	const range = `${SHEET_TAB()}!A:C`;
	const resp = await sheets.spreadsheets.values.get({
		spreadsheetId: SHEET_ID(),
		range,
		majorDimension: "ROWS",
	});
	const rows = resp.data.values || [];

	let targetRowIndex: number | null = null;
	for (let i = 0; i < rows.length; i += 1) {
		const row = rows[i];
		const rowCode = String(row?.[0] ?? "")
			.trim()
			.toUpperCase();
		if (rowCode === currentCode) {
			targetRowIndex = i;
			break;
		}
	}

	if (targetRowIndex === null) {
		return false; // Item not found
	}

	const sheetRowNumber = targetRowIndex + 1;
	const existingRow = rows[targetRowIndex];

	// Prepare the new values, using existing ones as fallbacks
	const code = updateData.newCode ?? existingRow[0];
	const quantity = updateData.quantity ?? existingRow[1];
	const location = updateData.location ?? existingRow[2];

	const updateRange = `${SHEET_TAB()}!A${sheetRowNumber}:C${sheetRowNumber}`;
	await sheets.spreadsheets.values.update({
		spreadsheetId: SHEET_ID(),
		range: updateRange,
		valueInputOption: "RAW",
		requestBody: { values: [[code, quantity, location]] },
	});

	return true;
}


export async function getAllCodeQuantity(): Promise<
	Array<{ code: string; quantity: number }>
> {
	const sheets = getSheetsClient();
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
		if (!codeRaw) continue;
		const qtyStr = String(row[1] ?? "").trim();
		const qtyParsed = Number.parseInt(qtyStr, 10);
		if (i === 0 && !Number.isFinite(qtyParsed)) continue;
		const quantity = Number.isFinite(qtyParsed) ? qtyParsed : 0;
		results.push({ code: codeRaw, quantity });
	}
	return results;
}
