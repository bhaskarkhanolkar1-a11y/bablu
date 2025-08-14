import { NextRequest, NextResponse } from "next/server";
import { getItemByCode, updateItemByCode } from "@/lib/googleSheets";

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
		const codeRaw: unknown = body?.code;
		const quantityRaw: unknown = body?.quantity;
        const locationRaw: unknown = body?.location;

		if (typeof codeRaw !== "string" || codeRaw.trim().length === 0) {
			return NextResponse.json(
				{ error: "Body must include a non-empty 'code' string" },
				{ status: 400 }
			);
		}

        const updateData: { quantity?: number; location?: string } = {};

		if (quantityRaw !== undefined) {
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
                { error: "Request body must contain 'quantity' or 'location' to update." },
                { status: 400 }
            );
        }

		const code = codeRaw.trim().toUpperCase();

		const updated = await updateItemByCode(code, updateData);

		if (!updated) {
			return NextResponse.json(
				{ error: `No product found with code ${code}` },
				{ status: 404 }
			);
		}

		return NextResponse.json({ success: true, code, ...updateData });

	} catch (error: unknown) {
		const message =
			error instanceof Error ? error.message : "Unknown error occurred";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
