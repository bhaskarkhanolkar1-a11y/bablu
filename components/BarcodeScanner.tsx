// FILE: components/BarcodeScanner.tsx

"use client";

import {
	Html5QrcodeScanner,
	Html5QrcodeSupportedFormats,
	type QrcodeSuccessCallback, // Corrected import for the type
} from "html5-qrcode";
import * as React from "react";

const qrcodeRegionId = "html5qr-code-full-region";

interface BarcodeScannerProps {
	onScanSuccess: QrcodeSuccessCallback;
	onScanFailure?: (error: string) => void;
}

export function BarcodeScanner({ onScanSuccess }: BarcodeScannerProps) {
	React.useEffect(() => {
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
				formatsToSupport: formatsToSupport,
			},
			/* verbose= */ false
		);

		scanner.render(onScanSuccess, (_error) => {
			// The library will log errors; we can ignore them here.
		});

		// Cleanup function to stop the scanner when the component unmounts
		return () => {
			// It's important to stop the scanner when the component is removed from the DOM.
			if (scanner && scanner.getState()) {
				scanner.clear().catch(error => {
					console.error("Failed to clear html5-qrcode scanner.", error);
				});
			}
		};
	}, [onScanSuccess]);

	return <div id={qrcodeRegionId} />;
}
