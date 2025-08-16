// FILE: app/page.tsx

"use client";
import { useRouter } from "next/navigation";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { ThemeToggleButton } from "@/components/ThemeToggleButton";
import { BarcodeScanner } from "@/components/BarcodeScanner";

// ... (Icon components remain the same) ...

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
// Plus icon for the add button
function PlusIcon(props: React.SVGProps<SVGSVGElement>) {
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
			<line x1="12" y1="5" x2="12" y2="19" />
			<line x1="5" y1="12" x2="19" y2="12" />
		</svg>
	);
}
// Icon for the dashboard button
function LayoutDashboardIcon(props: React.SVGProps<SVGSVGElement>) {
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
			<rect width="7" height="9" x="3" y="3" rx="1" />
			<rect width="7" height="5" x="14" y="3" rx="1" />
			<rect width="7" height="9" x="14" y="12" rx="1" />
			<rect width="7" height="5" x="3" y="16" rx="1" />
		</svg>
	);
}

// Barcode icon for the new button
function BarcodeIcon(props: React.SVGProps<SVGSVGElement>) {
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
            <path d="M3 5v14" />
            <path d="M8 5v14" />
            <path d="M12 5v14" />
            <path d="M17 5v14" />
            <path d="M21 5v14" />
        </svg>
    );
}

export default function HomePage() {
	const router = useRouter();
	const [code, setCode] = React.useState("");
	const [open, setOpen] = React.useState(false);
	const [loading, setLoading] = React.useState(false);
	const [suggestions, setSuggestions] = React.useState<
		Array<{ code: string; quantity: number; name: string }>
	>([]);
	const [activeIndex, setActiveIndex] = React.useState(-1);
	const [isRecognizing, setIsRecognizing] = React.useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);
	const [isScanning, setIsScanning] = React.useState(false);

	function submit() {
		if (!code.trim()) return;
		const value = code.trim();
		router.push(`/item?code=${encodeURIComponent(value)}`);
	}

	React.useEffect(() => {
		const q = code.trim();
		if (q.length < 2) {
			setSuggestions([]);
			setOpen(false);
			setActiveIndex(-1);
			return;
		}
		setLoading(true);
		const id = setTimeout(() => {
			fetch(`/api/items?q=${encodeURIComponent(q)}&limit=10`)
				.then(async res => {
					if (!res.ok) throw new Error(await res.text());
					return res.json();
				})
				.then((data: Array<{ code: string; quantity: number; name: string }>) => {
					setSuggestions(data);
					setOpen(true);
					setActiveIndex(data.length ? 0 : -1);
				})
				.catch(() => {
					setSuggestions([]);
					setOpen(false);
					setActiveIndex(-1);
				})
				.finally(() => setLoading(false));
		}, 200);
		return () => clearTimeout(id);
	}, [code]);

	function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
		// ... (onKeyDown logic remains the same) ...
	}

	async function handleImageChange(event: React.ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];
        if (!file) return;

		setIsRecognizing(true);
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
            const base64Image = reader.result?.toString().split(',')[1];
            if (!base64Image) {
                setIsRecognizing(false);
                alert("Could not process the image. Please try again.");
                return;
            }

            try {
                const recogResponse = await fetch("/api/recognize-item", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ image: base64Image }),
                });
                const recogResult = await recogResponse.json();

                if (recogResult.success && recogResult.labels && recogResult.labels.length > 0) {
                    const searchTerm = recogResult.labels[0];
                    
                    // Now, search for this item in our inventory
                    const searchResponse = await fetch(`/api/items?q=${encodeURIComponent(searchTerm)}&limit=1`);
                    const searchResult = await searchResponse.json();

                    if (searchResult && searchResult.length > 0) {
                        // Item found, go to its page
                        router.push(`/item?code=${encodeURIComponent(searchResult[0].code)}`);
                    } else {
                        // Item not found, go to the item page with a 'notFound' flag
                        router.push(`/item?code=${encodeURIComponent(searchTerm)}&notFound=true`);
                    }
                } else {
                    alert("Could not recognize the item. Please try again.");
                }
            } catch (error) {
                console.error("Recognition API error:", error);
                alert("An error occurred while trying to recognize the item.");
            } finally {
                setIsRecognizing(false);
            }
        };
        reader.onerror = () => {
            setIsRecognizing(false);
            alert("Failed to read the image file.");
        };
	}

	const handleScanSuccess = (decodedText: string) => {
        setIsScanning(false);
        router.push(`/item?code=${encodeURIComponent(decodedText)}`);
    };


	return (
        <main className="min-h-screen flex items-center justify-center p-6">
			<ThemeToggleButton />
			<div className="w-full max-w-md mx-auto">
                <div className="flex flex-col items-center text-center mb-8">
                    <Image
                        src="/logo.png"
                        alt="Crompton Greaves Logo"
                        width={160}
                        height={48}
                        className="mb-6"
                        priority
                    />
                    <h1 className="text-3xl font-bold tracking-tight">Inventory Lookup</h1>
                    <p className="text-muted-foreground mt-2">
                        Enter or scan a product code to check its quantity and location.
                    </p>
                </div>
				<div className="space-y-4">
					<div className="relative">
						<Input
							placeholder="Enter product name..."
							value={code}
							onChange={e => setCode(e.target.value)}
							onKeyDown={onKeyDown}
							aria-autocomplete="list"
							aria-expanded={open}
							aria-controls="code-suggestions"
							role="combobox"
							className="h-12 text-lg"
						/>
						{open && (
							<div
								id="code-suggestions"
								role="listbox"
								className="absolute z-10 mt-2 w-full rounded-md border bg-background shadow-lg max-h-60 overflow-y-auto"
							>
								{loading && (
									<div className="px-3 py-2 text-sm text-muted-foreground">
										Searching...
									</div>
								)}
								{!loading && suggestions.length === 0 && (
									<div className="px-3 py-2 text-sm text-muted-foreground">
										No matches found.
									</div>
								)}
								{!loading &&
									suggestions.map((s, idx) => (
										<button
											key={s.code + idx}
											role="option"
											aria-selected={idx === activeIndex}
											onMouseDown={e => {
												e.preventDefault();
												setCode(s.code);
												setOpen(false);
												router.push(
													`/item?code=${encodeURIComponent(s.code)}`
												);
											}}
											className={`flex w-full items-center justify-between px-3 py-2 text-sm text-left hover:bg-foreground/5 dark:hover:bg-foreground/10 ${
												idx === activeIndex
													? "bg-foreground/5 dark:bg-foreground/10"
													: ""
											}`}
										>
											<span className="font-semibold">{s.name}</span>
											<span className="text-xs text-muted-foreground">
												{s.quantity} in stock
											</span>
										</button>
									))}
							</div>
						)}
					</div>
                    <div className="flex gap-2">
                        <Button onClick={submit} className="w-full h-11 text-base">
                            Search
                        </Button>

						<Button
                            variant="outline"
                            onClick={() => setIsScanning(true)}
                            className="h-11"
                            aria-label="Scan barcode"
                        >
                            <BarcodeIcon className="h-5 w-5" />
                        </Button>

                        <Button
                            variant="outline"
                            onClick={() => fileInputRef.current?.click()}
                            className="h-11"
                            aria-label="Scan item with camera"
							disabled={isRecognizing}
                        >
							{isRecognizing ? (
								<span className="animate-pulse">...</span>
							) : (
								<CameraIcon className="h-5 w-5"/>
							)}
                        </Button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImageChange}
                            className="hidden"
                            accept="image/*"
                        />
						<Button
							variant="outline"
							onClick={() => router.push('/add-item')}
							className="h-11"
							aria-label="Add new item"
						>
							<PlusIcon className="h-5 w-5"/>
						</Button>
                    </div>
				</div>

				<div className="mt-8 text-center">
					<Button variant="secondary" onClick={() => router.push('/dashboard')}>
						<LayoutDashboardIcon className="mr-2 h-4 w-4" />
						View Full Inventory Dashboard
					</Button>
				</div>
			</div>

			{isScanning && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
                    <div className="bg-background rounded-lg p-6 shadow-lg w-full max-w-md relative">
                        <h3 className="text-lg font-semibold mb-4 text-center">Scan Barcode</h3>
                        <div className="rounded-lg overflow-hidden">
							<BarcodeScanner onScanSuccess={handleScanSuccess} onScanFailure={()=>{}} />
						</div>
                        <Button variant="ghost" onClick={() => setIsScanning(false)} className="mt-4 w-full">
                            Cancel
                        </Button>
                    </div>
                </div>
            )}
		</main>
	);
}
