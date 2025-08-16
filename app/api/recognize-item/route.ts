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

        // Performs text detection on the image file
        const [result] = await client.textDetection(Buffer.from(imageBytes, 'base64'));
        const detections = result.textAnnotations;

        // Check if detections is not null or undefined before accessing its properties
        const recognizedText = detections && detections.length > 0 && detections[0].description
            ? detections[0].description.trim().split('\n')[0] // Get the first line of text
            : null;

		return NextResponse.json({
			success: true,
			code: recognizedText,
		});
	} catch (error: unknown) {
		const message =
			error instanceof Error ? error.message : "Unknown error occurred";
		return NextResponse.json({ success: false, error: message }, { status: 500 });
	}
}
