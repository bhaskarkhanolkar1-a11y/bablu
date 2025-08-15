// FILE: app/api/item/route.ts

import { NextRequest, NextResponse } from "next/server";
// Import the new functions
import { getItemByCode, updateItem, addItem, deleteItem } from "@/lib/googleSheets";

export const runtime = "nodejs";

// --- NEW: POST function to add a new item ---
export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const { name, quantity, location } = body;

		if (!name || typeof name !== "string" || name.trim().length === 0) {
			return NextResponse.json({ error: "Invalid 'name' provided" }, { status: 400 });
		}
		if (typeof quantity !== "number" || !Number.isFinite(quantity)) {
			return NextResponse.json({ error: "Invalid 'quantity' provided" }, { status: 400 });
		}
		if (!location || typeof location !== "string" || location.trim().length === 0) {
			return NextResponse.json({ error: "Invalid 'location' provided" }, { status: 400 });
		}

		await addItem({
			name: name.trim(),
			quantity: Math.max(0, Math.floor(quantity)),
			location: location.trim(),
		});

		return NextResponse.json({ success: true });

	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : "Unknown error occurred";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}


// --- NEW: DELETE function to remove an item ---
export async function DELETE(req: NextRequest) {
	try {
		const body = await req.json();
		const { code } = body;

		if (!code || typeof code !== "string" || code.trim().length === 0) {
			return NextResponse.json({ error: "Request body must include the 'code' to delete." }, { status: 400 });
		}

		const deleted = await deleteItem(code.trim());

		if (!deleted) {
			return NextResponse.json({ error: `No product found with code ${code}` }, { status: 404 });
		}

		return NextResponse.json({ success: true });

	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : "Unknown error occurred";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}


// This GET function is for fetching a single item's details
export async function GET(req: NextRequest) {
	const { searchParams } = new URL(req.url);
	const codeRaw = searchParams.get("code");
	if (!codeRaw) {
		return NextResponse.json({ error: "Missing 'code' query parameter" }, { status: 400 });
	}
	const code = codeRaw.trim();
	try {
		const item = await getItemByCode(code);
		if (item === null) {
			return NextResponse.json({ found: false, code }, { status: 404 });
		}
		return NextResponse.json({
			found: true,
			code,
			quantity: item.quantity,
			location: item.location,
		});
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : "Unknown error occurred";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}


// This PATCH function is for updating an existing item
export async function PATCH(req: NextRequest) {
	try {
		const body = await req.json();
		const currentCodeRaw: unknown = body?.code;
        const newCodeRaw: unknown = body?.newCode;
		const quantityRaw: unknown = body?.quantity;
        const locationRaw: unknown = body?.location;

		if (typeof currentCodeRaw !== "string" || currentCodeRaw.trim().length === 0) {
			return NextResponse.json({ error: "Body must include the current 'code' string" }, { status: 400 });
		}

        const updateData: { newCode?: string; quantity?: number; location?: string } = {};

        if (newCodeRaw !== undefined) {
            if (typeof newCodeRaw !== 'string' || newCodeRaw.trim().length === 0) {
                return NextResponse.json({ error: "If provided, 'newCode' must be a non-empty string" }, { status: 400 });
            }
            updateData.newCode = newCodeRaw.trim();
        }

		if (quantityRaw !== undefined) {
			if (typeof quantityRaw !== "number" || !Number.isFinite(quantityRaw) || Number.isNaN(quantityRaw)) {
				return NextResponse.json({ error: "If provided, 'quantity' must be a finite number" }, { status: 400 });
			}
			updateData.quantity = Math.max(0, Math.floor(quantityRaw));
		}

        if (locationRaw !== undefined) {
            if (typeof locationRaw !== 'string') {
                return NextResponse.json({ error: "If provided, 'location' must be a string" }, { status: 400 });
            }
            updateData.location = locationRaw.trim();
        }

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ error: "Request body must contain 'newCode', 'quantity', or 'location' to update." }, { status: 400 });
        }

		const currentCode = currentCodeRaw.trim();
		const updated = await updateItem(currentCode, updateData);

		if (!updated) {
			return NextResponse.json({ error: `No product found with code ${currentCode}` }, { status: 404 });
		}

		return NextResponse.json({ success: true, ...updateData });

	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : "Unknown error occurred";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
