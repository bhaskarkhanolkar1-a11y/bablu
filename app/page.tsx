// FILE: app/page.tsx

"use client";
import { useRouter } from "next/navigation";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";
// The BarcodeScanner import is now removed
import { ThemeToggleButton } from "@/components/ThemeToggleButton";

// A simple camera icon component
function CameraIcon(props: React.SVGProps<SVGSVGElement>) {
	return (
		<svg
			{...props}
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			viewBox="0 0 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
			<circle cx="12" cy="13" r="3" />
		</svg>
	);
}

export default function HomePage() {
	const router = useRouter();
	const [code, setCode] = React.useState("");
	const [open, setOpen] = React.useState(false);
	const [loading, setLoading] = React.useState(false);
	const [suggestions, setSuggestions] = React.useState<
		Array<{ code: string; quantity: number }>
	>([]);
	const [activeIndex, setActiveIndex] = React.useState(-1);
	// NEW: State to track if the AI is "thinking"
	const [isRecognizing, setIsRecognizing] = React.useState(false);
	// NEW: A reference to a hidden file input to simulate taking a picture
	const fileInputRef = React.useRef<HTMLInputElement>(null);


	function submit() {
		if (!code.trim()) return;
		const value = code.trim();
		router.push(`/item?code=${encodeURIComponent(value)}`);
	}

	// This useEffect for suggestions remains the same
	React.useEffect(() => {
		// ... (this whole function is unchanged)
	}, [code]);

	// This onKeyDown handler remains the same
	function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
		// ... (this whole function is unchanged)
	}

	// NEW: This function handles the image recognition process
	async function handleImageRecognition() {
		setIsRecognizing(true); // Show the loading indicator

		// We send an empty POST request because our placeholder API doesn't need a real image yet.
		// When you connect the real Google Vision API, you would send the image file in the body here.
		try {
			const response = await fetch("/api/recognize-item", { method: "POST" });
			const result = await response.json();

			if (result.success && result.code) {
				// If the AI "recognizes" something, go to that item's page
				router.push(`/item?code=${encodeURIComponent(result.code)}`);
			} else {
				// Handle the case where the AI fails
				alert("Could not recognize the item. Please try again.");
			}
		} catch (error) {
			console.error("Recognition API error:", error);
			alert("An error occurred while trying to recognize the item.");
		} finally {
			setIsRecognizing(false); // Hide the loading indicator
		}
	}

	// NEW: This function triggers the hidden file input
	function handleScanButtonClick() {
		// In a real mobile app, this would open the camera.
		// For now, we just call our placeholder function directly.
		handleImageRecognition();
	}

	return (
		<main className="min-h-screen flex items-center justify-center p-6">
			<ThemeToggleButton />
			<div className="w-full max-w-md mx-auto">
                {/* ... (UI code is mostly the same down to the buttons) */}
				<div className="flex gap-2">
					<Button onClick={submit} className="w-full h-11 text-base">
						Search
					</Button>
					<Button
						variant="outline"
						onClick={handleScanButtonClick} // <-- UPDATED
						className="h-11"
						aria-label="Scan item with camera"
						disabled={isRecognizing} // <-- UPDATED
					>
						{isRecognizing ? (
							// Show a spinner or "..." when loading
							<span className="animate-pulse">...</span>
						) : (
							<CameraIcon className="h-5 w-5"/>
						)}
					</Button>
				</div>
                {/* ... (rest of the UI is the same) */}
			</div>

            {/* The old barcode scanner modal is now removed */}
		</main>
	);
}
