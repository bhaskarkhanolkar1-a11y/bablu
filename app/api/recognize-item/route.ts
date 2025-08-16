// FILE: app/api/recognize-item/route.ts

import { NextRequest, NextResponse } from "next/server";
import { ImageAnnotatorClient } from '@google-cloud/vision';

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
	try {
        const body = await req.json();
        const imageBytes = body.image;

        if (!imageBytes) {
            return NextResponse.json({ success: false, error: "No image provided" }, { status: 400 });
        }

        // Creates a client
        const client = new ImageAnnotatorClient();

        // Performs label detection on the image file
        const [result] = await client.labelDetection(Buffer.from(imageBytes, 'base64'));
        const labels = result.labelAnnotations;

        // Return all relevant labels
        const recognizedLabels = labels ? labels.map(label => label.description) : [];

		return NextResponse.json({
			success: true,
			labels: recognizedLabels,
		});
	} catch (error: unknown) {
		const message =
			error instanceof Error ? error.message : "Unknown error occurred";
		return NextResponse.json({ success: false, error: message }, { status: 500 });
	}
}
