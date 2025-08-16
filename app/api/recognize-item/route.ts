// FILE: app/api/recognize-item/route.ts

import { NextRequest, NextResponse } from "next/server";
import { ImageAnnotatorClient } from '@google-cloud/vision';

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
	// In a real app, you would receive the image file here.
	// For now, we'll use a placeholder for the image data.
	// You'll need to handle the image upload from the client-side.
	const imageBytes = '...'; // This would be the base64 encoded image string

	try {
        // Creates a client
        const client = new ImageAnnotatorClient();

        // Performs text detection on the image file
        const [result] = await client.textDetection(Buffer.from(imageBytes, 'base64'));
        const detections = result.textAnnotations;

        // Check if detections is not null or undefined before accessing its properties
        const recognizedText = detections && detections.length > 0 && detections[0].description
            ? detections[0].description
            : null;


		return NextResponse.json({
			success: true,
			code: recognizedText, // Changed 'text' to 'code'
		});
	} catch (error: unknown) {
		const message =
			error instanceof Error ? error.message : "Unknown error occurred";
		return NextResponse.json({ success: false, error: message }, { status: 500 });
	}
}
