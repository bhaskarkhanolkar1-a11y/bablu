// FILE: lib/googleSheets.ts

import { google } from "googleapis";
import { handleLowStockNotification } from "./notifications";

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

// --- NEW: Function to add a new item ---
export async function addItem(item: {
	name: string;
	quantity: number;
	location: string;
}): Promise<void> {
	const sheets = getSheetsClient();
	const range = `${SHEET_TAB()}!A:C`;
	await sheets.spreadsheets.values.append({
		spreadsheetId: SHEET_ID(),
		range,
		valueInputOption: "RAW",
		requestBody: {
			values: [[item.name, item.quantity, item.location]],
		},
	});
}

// --- NEW: Function to delete an item ---
export async function deleteItem(code: string): Promise<boolean> {
	const sheets = getSheetsClient();
	const range = `${SHEET_TAB()}!A:A`; // Only need to search column A
	const resp = await sheets.spreadsheets.values.get({
		spreadsheetId: SHEET_ID(),
		range,
		majorDimension: "ROWS",
	});

	const rows = resp.data.values || [];
	let targetRowIndex: number | null = null;
	for (let i = 0; i < rows.length; i += 1) {
		const rowCode = String(rows[i]?.[0] ?? "").trim();
		if (rowCode.toLowerCase() === code.toLowerCase()) {
			targetRowIndex = i;
			break;
		}
	}

	if (targetRowIndex === null) {
		return false; // Item not found
	}

	const sheetRowNumber = targetRowIndex + 1;
	// This will clear the row's content
	await sheets.spreadsheets.values.clear({
		spreadsheetId: SHEET_ID(),
		range: `${SHEET_TAB()}!A${sheetRowNumber}:C${sheetRowNumber}`,
	});

	return true;
}

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
		const rowCode = String(row[0] ?? "").trim();
		if (rowCode.toLowerCase() === code.toLowerCase()) {
			const qtyStr = String(row[1] ?? "").trim();
			const qty = Number.parseInt(qtyStr, 10);
			const quantity = Number.isFinite(qty) ? qty : 0;
			const location = String(row[2] ?? "").trim();
			return { quantity, location };
		}
	}
	return null;
}

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
		const rowCode = String(row?.[0] ?? "").trim();
		if (rowCode.toLowerCase() === currentCode.toLowerCase()) {
			targetRowIndex = i;
			break;
		}
	}

	if (targetRowIndex === null) {
		return false;
	}

	const existingRow = rows[targetRowIndex];
	const oldQuantity = Number.parseInt(String(existingRow[1] ?? "0").trim(), 10) || 0;

	// Trigger notifications if quantity is being updated and drops below the threshold
	if (updateData.quantity !== undefined && updateData.quantity !== oldQuantity) {
		// We don't need to wait for this to finish
		handleLowStockNotification(
			currentCode,
			oldQuantity,
			updateData.quantity
		);
	}

	const sheetRowNumber = targetRowIndex + 1;
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

export async function getAllItemsForSearch(): Promise<
	Array<{ code: string; quantity: number; name: string }>
> {
	const sheets = getSheetsClient();
	const range = `${SHEET_TAB()}!A:B`;
	const resp = await sheets.spreadsheets.values.get({
		spreadsheetId: SHEET_ID(),
		range,
		majorDimension: "ROWS",
	});
	const rows = resp.data.values || [];
	const results: Array<{ code: string; quantity: number; name: string }> = [];
	for (let i = 0; i < rows.length; i += 1) {
		const row = rows[i] ?? [];
		const codeAndName = String(row[0] ?? "").trim();
		if (!codeAndName) continue;
		
		const qtyStr = String(row[1] ?? "").trim();
		const qtyParsed = Number.parseInt(qtyStr, 10);
		if (i === 0 && !Number.isFinite(qtyParsed)) continue;
		
		const quantity = Number.isFinite(qtyParsed) ? qtyParsed : 0;
		
		results.push({ code: codeAndName, quantity, name: codeAndName });
	}
	return results;
}
