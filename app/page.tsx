// FILE: app/page.tsx

"use client";
import { useRouter } from "next/navigation";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import { ThemeToggleButton } from "@/components/ThemeToggleButton";

// A simple camera icon component
function CameraIcon(props: React.SVGProps<SVGSVGElement>) {
	return (
		<svg
			{...props}
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			viewBox="0 0 24 24"
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
    const [isScannerOpen, setScannerOpen] = React.useState(false);

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
				.then((data: Array<{ code: string; quantity: number }>) => {
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
		if (e.key === "Enter") {
			e.preventDefault();
		}
		if (!open || suggestions.length === 0) {
			if (e.key === "Enter") submit();
			return;
		}
		if (e.key === "ArrowDown") {
			e.preventDefault();
			setActiveIndex(i => (i + 1) % suggestions.length);
		} else if (e.key === "ArrowUp") {
			e.preventDefault();
			setActiveIndex(i => (i - 1 + suggestions.length) % suggestions.length);
		} else if (e.key === "Enter") {
			const chosen = suggestions[activeIndex];
			if (chosen) {
				setCode(chosen.code);
				setOpen(false);
				router.push(
					`/item?code=${encodeURIComponent(chosen.code)}`
				);
			} else {
				submit();
			}
		} else if (e.key === "Escape") {
			setOpen(false);
		}
	}

    function onScanSuccess(decodedText: string) {
        setScannerOpen(false);
        router.push(`/item?code=${encodeURIComponent(decodedText)}`);
    }

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
							placeholder="Enter product code..."
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
											<span className="font-mono">{s.code}</span>
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
                            onClick={() => setScannerOpen(true)}
                            className="h-11"
                            aria-label="Open barcode scanner"
                        >
                            <CameraIcon className="h-5 w-5"/>
                        </Button>
                    </div>
				</div>
			</div>

            {/* Scanner Modal */}
            {isScannerOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
                    <div className="bg-background rounded-lg p-4 shadow-lg w-full max-w-md relative">
                        <p className="text-center text-muted-foreground mb-2">
                            Point your camera at a barcode
                        </p>
                        <div className="overflow-hidden rounded-md">
						    <BarcodeScanner onScanSuccess={onScanSuccess} />
                        </div>
                        <Button
                            variant="ghost"
                            onClick={() => setScannerOpen(false)}
                            className="mt-4 w-full"
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            )}
		</main>
	);
}
