// FILE: app/item/ItemPageContent.tsx

"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { ThemeToggleButton } from "@/components/ThemeToggleButton";
import { QRCodeModal } from "@/components/QRCodeModal"; // <-- ADD THIS IMPORT

type ItemState =
	| { status: "idle" | "loading" }
	| { status: "not_found"; code: string }
	| { status: "ready"; code: string; quantity: number; location: string };

export default function ItemPageContent() {
	const params = useSearchParams();
	const router = useRouter();
	const codeParam = params.get("code")?.trim() || "";
	const [state, setState] = React.useState<ItemState>({ status: "idle" });
	const [updating, setUpdating] = React.useState(false);
	const [isEditingLocation, setIsEditingLocation] = React.useState(false);
	const [newLocation, setNewLocation] = React.useState("");
	// NEW: State to control the QR code modal
	const [isQrModalOpen, setIsQrModalOpen] = React.useState(false);

	React.useEffect(() => {
		if (!codeParam) return;
		let canceled = false;
		setState({ status: "loading" });
		fetch(`/api/item?code=${encodeURIComponent(codeParam)}`)
			.then(async res => {
				if (res.status === 404) return { found: false } as const;
				if (!res.ok) throw new Error(await res.text());
				return res.json();
			})
			.then(data => {
				if (canceled) return;
				if (!("found" in data) || data.found === false) {
					setState({ status: "not_found", code: codeParam });
					return;
				}
				setState({
					status: "ready",
					code: data.code,
					quantity: data.quantity,
					location: data.location ?? "",
				});
                setNewLocation(data.location ?? "");
			})
			.catch(() => {
				if (canceled) return;
				setState({ status: "not_found", code: codeParam });
			});
		return () => {
			canceled = true;
		};
	}, [codeParam]);

	// ... (The next three functions: if (!codeParam), if (loading), if (not_found) are unchanged)

	if (state.status !== "ready") {
		return null;
	}
	const { code, quantity, location } = state;

	function applyUpdate(data: { quantity?: number, location?: string }) {
		setUpdating(true);
		fetch(`/api/item`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ code, ...data }),
		})
			.then(() => {
                const optimisticState = { ...state, ...data } as ItemState;
		        setState(optimisticState);
            })
			.catch(() => {
				fetch(`/api/item?code=${encodeURIComponent(code)}`)
					.then(r => r.json())
					.then(serverData =>
						setState({
							status: "ready",
							code,
							quantity: serverData.quantity,
							location: serverData.location ?? "",
						})
					)
					.catch(() => setState({ status: "not_found", code }));
			})
			.finally(() => {
                setUpdating(false);
                setIsEditingLocation(false);
            });
	}

	const dec = () => applyUpdate({ quantity: Math.max(0, quantity - 1) });
	const inc = () => applyUpdate({ quantity: quantity + 1 });
    const handleLocationSave = () => applyUpdate({ location: newLocation });

	return (
		<main className="min-h-screen flex items-center justify-center p-6">
			<ThemeToggleButton />
			<div className="w-full max-w-sm">
                <div className="flex justify-center mb-6">
                    <Image
                        src="/logo.png"
                        alt="Crompton Greaves Logo"
                        width={128}
                        height={38}
                        priority
                    />
                </div>
                <div className="bg-background/80 backdrop-blur-sm border rounded-lg shadow-lg p-8 space-y-8">
                    <div className="text-center">
                        <p className="text-sm text-muted-foreground">Product Code</p>
                        <h1 className="text-3xl font-bold font-mono tracking-wider mt-2 break-words">{code}</h1>
                    </div>
                    {/* ... (Location and Quantity sections are unchanged) */}
                </div>

				<div className="mt-6 flex flex-col items-center gap-2">
					{/* NEW: Button to show the QR code */}
					<Button onClick={() => setIsQrModalOpen(true)}>
						Show QR Code
					</Button>
					<Button variant="ghost" onClick={() => router.push("/")}>
						← Search for another item
					</Button>
				</div>
			</div>

			{/* NEW: Render the modal when isQrModalOpen is true */}
			{isQrModalOpen && (
				<QRCodeModal
					itemCode={code}
					onClose={() => setIsQrModalOpen(false)}
				/>
			)}
		</main>
	);
}
