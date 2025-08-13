import { NextRequest, NextResponse } from "next/server";
import { getAllCodeQuantity } from "@/lib/googleSheets";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
	try {
		const { searchParams } = new URL(req.url);
		const qRaw = searchParams.get("q");
		const limitRaw = searchParams.get("limit");
		const limit = Number.isFinite(Number(limitRaw))
			? Math.max(1, Math.min(100, Number(limitRaw)))
			: null;

		const items = await getAllCodeQuantity();

		let filtered = items;
		if (qRaw && qRaw.trim().length > 0) {
			const q = qRaw.trim().toLowerCase();
			filtered = items.filter(it => it.code.toLowerCase().includes(q));
		}

		const result = limit ? filtered.slice(0, limit) : filtered;
		return NextResponse.json(result);
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : "Unknown error";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
