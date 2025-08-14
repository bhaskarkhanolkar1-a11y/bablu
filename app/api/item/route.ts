import { NextRequest, NextResponse } from "next/server";
import { getItemByCode, updateItem } from "@/lib/googleSheets";

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
		const item = await getItemByCode(code);
		if (item === null) {
			return NextResponse.json(
				{ found: false, code, quantity: null, location: null },
				{ status: 404 }
			);
		}
		return NextResponse.json({
			found: true,
			code,
			quantity: item.quantity,
			location: item.location,
		});
	} catch (error: unknown) {
		const message =
			error instanceof Error ? error.message : "Unknown error occurred";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}

export async function PATCH(req: NextRequest) {
	try {
		const body = await req.json();
		const currentCodeRaw: unknown = body?.code;
		const newCodeRaw: unknown = body?.newCode;
		const quantityRaw: unknown = body?.quantity;
        const locationRaw: unknown = body?.location;

		if (typeof currentCodeRaw !== "string" || currentCodeRaw.trim().length === 0) {
			return NextResponse.json(
				{ error: "Body must include the current 'code' string" },
				{ status: 400 }
			);
		}

        const updateData: { newCode?: string; quantity?: number; location?: string } = {};

        if (newCodeRaw !== undefined) {
            if (typeof newCodeRaw !== 'string' || newCodeRaw.trim().length === 0) {
                return NextResponse.json({ error: "If provided, 'newCode' must be a non-empty string" }, { status: 400 });
            }
            updateData.newCode = newCodeRaw.trim().toUpperCase();
        }

		if (quantityRaw !== undefined) {
			if (
				typeof quantityRaw !== "number" ||
				!Number.isFinite(quantityRaw) ||
				Number.isNaN(quantityRaw)
			) {
				return NextResponse.json(
					{ error: "If provided, 'quantity' must be a finite number" },
					{ status: 400 }
				);
			}
			updateData.quantity = Math.max(0, Math.floor(quantityRaw));
		}

        if (locationRaw !== undefined) {
            if (typeof locationRaw !== 'string') {
                return NextResponse.json(
                    { error: "If provided, 'location' must be a string" },
                    { status: 400 }
                );
            }
            updateData.location = locationRaw.trim();
        }

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json(
                { error: "Request body must contain 'newCode', 'quantity', or 'location' to update." },
                { status: 400 }
            );
        }

		const currentCode = currentCodeRaw.trim().toUpperCase();
		const updated = await updateItem(currentCode, updateData);

		if (!updated) {
			return NextResponse.json(
				{ error: `No product found with code ${currentCode}` },
				{ status: 404 }
			);
		}

		return NextResponse.json({ success: true, ...updateData });

	} catch (error: unknown) {
		const message =
			error instanceof Error ? error.message : "Unknown error occurred";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
