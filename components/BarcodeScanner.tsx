// FILE: components/BarcodeScanner.tsx

"use client";

import {
	Html5QrcodeScanner,
	Html5QrcodeSupportedFormats,
} from "html5-qrcode";
import type { QrCodeSuccessCallback } from "html5-qrcode/esm/core";
import * as React from "react";

const qrcodeRegionId = "html5qr-code-full-region";

interface BarcodeScannerProps {
	onScanSuccess: QrCodeSuccessCallback;
	onScanFailure?: (error: string) => void;
}

export function BarcodeScanner({ onScanSuccess }: BarcodeScannerProps) {
	React.useEffect(() => {
		// A list of common barcode formats to support.
		// This helps the scanner focus on what to look for.
		const formatsToSupport = [
			Html5QrcodeSupportedFormats.QR_CODE,
			Html5QrcodeSupportedFormats.EAN_13,
			Html5QrcodeSupportedFormats.UPC_A,
			Html5QrcodeSupportedFormats.UPC_E,
			Html5QrcodeSupportedFormats.CODE_128,
		];

		const scanner = new Html5QrcodeScanner(
			qrcodeRegionId,
			{
				qrbox: {
					width: 250,
					height: 250,
				},
				fps: 10,
				rememberLastUsedCamera: true,
				// Pass the formats to the scanner
				formatsToSupport: formatsToSupport,
			},
			/* verbose= */ false
		);

		scanner.render(onScanSuccess, error => {
			// The library will log errors, we can ignore them here.
		});

		// Cleanup function to stop the scanner when the component unmounts
		return () => {
			scanner.clear().catch(error => {
				console.error("Failed to clear html5-qrcode scanner. ", error);
			});
		};
	}, [onScanSuccess]);

	return <div id={qrcodeRegionId} />;
}