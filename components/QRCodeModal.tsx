// FILE: components/QRCodeModal.tsx

"use client";

import * as React from "react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "./ui/button";

interface QRCodeModalProps {
	itemCode: string;
	onClose: () => void;
}

export function QRCodeModal({ itemCode, onClose }: QRCodeModalProps) {
	const url = `${window.location.origin}/item?code=${encodeURIComponent(
		itemCode
	)}`;

	function printQRCode() {
		const svgElement = document.getElementById("qr-code-svg");
		if (svgElement) {
			const svgData = new XMLSerializer().serializeToString(svgElement);
			const printWindow = window.open("", "_blank");
			printWindow?.document.write(`
        <html>
          <head><title>Print QR Code</title></head>
          <body style="text-align:center; margin-top: 50px;">
            <h2>Item Code: ${itemCode}</h2>
            ${svgData}
            <script>window.onload = () => { window.print(); window.close(); };</script>
          </body>
        </html>
      `);
			printWindow?.document.close();
		}
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
			<div className="bg-background rounded-lg p-6 shadow-lg w-full max-w-xs relative text-center">
				<h3 className="text-lg font-semibold mb-2">Item QR Code</h3>
				<p className="text-sm text-muted-foreground font-mono mb-4 break-words">
					{itemCode}
				</p>
				<div className="p-4 bg-white inline-block rounded-md">
					<QRCodeSVG
						id="qr-code-svg"
						value={url}
						size={200}
						bgColor={"#ffffff"}
						fgColor={"#000000"}
						level={"L"}
						includeMargin={false}
					/>
				</div>
				<div className="mt-6 flex flex-col gap-2">
					<Button onClick={printQRCode}>Print</Button>
					<Button variant="ghost" onClick={onClose}>
						Close
					</Button>
				</div>
			</div>
		</div>
	);
}
