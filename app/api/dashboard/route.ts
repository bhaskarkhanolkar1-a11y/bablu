// FILE: app/api/dashboard/route.ts

import { NextResponse } from "next/server";
import { getAllItemsForSearch } from "@/lib/googleSheets";

export const runtime = "nodejs";

export async function GET() {
	try {
		const items = await getAllItemsForSearch();
		// We remove items that might be empty rows in the sheet
		const cleanedItems = items.filter(item => item.name && item.name.trim() !== "");
		return NextResponse.json(cleanedItems);

	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : "Unknown error";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
