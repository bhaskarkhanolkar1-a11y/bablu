import { NextRequest, NextResponse } from "next/server";
import { getQuantityByCode, setQuantityByCode } from "@/lib/googleSheets";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
	const { searchParams } = new URL(req.url);
	const codeRaw = searchParams.get("code");
	if (!codeRaw) {
		return NextResponse.json(
			{ error: "Missing 'code' query parameter" },
			{ status: 400 }
		);
	}
	const code = codeRaw.trim().toUpperCase();
	try {
		const quantity = await getQuantityByCode(code);
		if (quantity === null) {
			return NextResponse.json(
				{ found: false, code, quantity: null },
				{ status: 404 }
			);
		}
		return NextResponse.json({ found: true, code, quantity });
	} catch (error: unknown) {
		const message =
			error instanceof Error ? error.message : "Unknown error occurred";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}

export async function PATCH(req: NextRequest) {
	try {
		const body = await req.json();
		const codeRaw: unknown = body?.code;
		const quantityRaw: unknown = body?.quantity;
		if (typeof codeRaw !== "string" || codeRaw.trim().length === 0) {
			return NextResponse.json(
				{ error: "Body must include a non-empty 'code' string" },
				{ status: 400 }
			);
		}
		if (
			typeof quantityRaw !== "number" ||
			!Number.isFinite(quantityRaw) ||
			Number.isNaN(quantityRaw)
		) {
			return NextResponse.json(
				{ error: "Body must include a finite numeric 'quantity'" },
				{ status: 400 }
			);
		}
		const code = codeRaw.trim().toUpperCase();
		const newQuantity = Math.max(0, Math.floor(quantityRaw));

		const updated = await setQuantityByCode(code, newQuantity);
		if (!updated) {
			return NextResponse.json(
				{ error: `No product found with code ${code}` },
				{ status: 404 }
			);
		}
		return NextResponse.json({ success: true, code, quantity: newQuantity });
	} catch (error: unknown) {
		const message =
			error instanceof Error ? error.message : "Unknown error occurred";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
