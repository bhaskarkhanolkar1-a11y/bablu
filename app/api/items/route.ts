// FILE: app/api/items/route.ts

import { NextRequest, NextResponse } from "next/server";
// Import the new function we created
import { getAllItemsForSearch } from "@/lib/googleSheets";
// Import the Fuse.js library
import Fuse from "fuse.js";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
	try {
		const { searchParams } = new URL(req.url);
		const q = searchParams.get("q")?.trim() || "";
		const limitRaw = searchParams.get("limit");
		const limit = Number.isFinite(Number(limitRaw))
			? Math.max(1, Math.min(100, Number(limitRaw)))
			: 10; // Default to 10 if not provided

		// 1. Fetch all items, now including their names
		const items = await getAllItemsForSearch();

		// 2. If there's no search query, just return the first few items
		if (!q) {
			const result = items.slice(0, limit);
			return NextResponse.json(result);
		}

		// 3. Set up Fuse.js for smart searching
		const fuse = new Fuse(items, {
			// We want to search by both 'code' and 'name'
			keys: ["code", "name"],
			// A threshold of 0.4 means it's a bit "fuzzy" but not too loose
			threshold: 0.4,
			// Include a score to see how good the match is
			includeScore: true,
		});

		// 4. Perform the search
		const searchResults = fuse.search(q);

		// 5. Format the results and send them back
		const formattedResults = searchResults
			.slice(0, limit) // Limit the number of results
			.map(result => result.item); // We only need the original item data

		return NextResponse.json(formattedResults);

	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : "Unknown error";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
