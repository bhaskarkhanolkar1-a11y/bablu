import { NextResponse } from "next/server";
import { getAllCodeQuantity } from "@/lib/googleSheets";

export const runtime = "nodejs";

export async function GET() {
	try {
		const items = await getAllCodeQuantity();
		return NextResponse.json(items);
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : "Unknown error";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
