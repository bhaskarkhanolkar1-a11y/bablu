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

        // Check if labels were found and get the description of the most likely one
        const recognizedObject = labels && labels.length > 0 && labels[0].description
            ? labels[0].description
            : null;

		return NextResponse.json({
			success: true,
			code: recognizedObject, // We're now sending back the recognized object name
		});
	} catch (error: unknown) {
		const message =
			error instanceof Error ? error.message : "Unknown error occurred";
		return NextResponse.json({ success: false, error: message }, { status: 500 });
	}
}
