// FILE: app/item/ItemPageContent.tsx

"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { ThemeToggleButton } from "@/components/ThemeToggleButton";
import { QRCodeModal } from "@/components/QRCodeModal";

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

	if (!codeParam) {
		return (
			<div className="min-h-screen flex items-center justify-center p-6 text-center">
				<div className="space-y-4">
					<p className="text-lg">No item code provided.</p>
					<Button onClick={() => router.push("/")}>Back to Search</Button>
				</div>
			</div>
		);
	}

	if (state.status === "loading" || state.status === "idle") {
		return (
			<div className="min-h-screen flex items-center justify-center p-6">
				<p className="animate-pulse">Loading item...</p>
			</div>
		);
	}

	if (state.status === "not_found") {
		return (
			<div className="min-h-screen flex items-center justify-center p-6 text-center">
				<div className="space-y-4">
					<p className="text-lg">
						Product not found for code:{" "}
						<span className="font-mono bg-foreground/10 px-2 py-1 rounded-md">{state.code}</span>
					</p>
					<Button onClick={() => router.push("/")}>Try another code</Button>
				</div>
			</div>
		);
	}

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

	async function handleDelete() {
		const isConfirmed = window.confirm(
			`Are you sure you want to delete this item?\n\n"${code}"\n\nThis action cannot be undone.`
		);

		if (isConfirmed) {
			setUpdating(true);
			try {
				const response = await fetch("/api/item", {
					method: "DELETE",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ code: code }),
				});

				if (!response.ok) {
					throw new Error("Failed to delete item.");
				}
				router.push("/");
			} catch (error) {
				console.error(error);
				alert("An error occurred while deleting the item.");
				setUpdating(false);
			}
		}
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
                    
                    <div className="text-center">
                        <p className="text-sm text-muted-foreground">Location</p>
                        {isEditingLocation ? (
                            <div className="mt-2 space-y-2">
                                <Input
                                    type="text"
                                    value={newLocation}
                                    onChange={(e) => setNewLocation(e.target.value)}
                                    className="text-center text-lg"
                                    disabled={updating}
                                />
                                <div className="flex gap-2 justify-center">
                                    <Button onClick={handleLocationSave} disabled={updating} size="sm">
                                        {updating ? 'Saving...' : 'Save'}
                                    </Button>
                                    <Button variant="ghost" onClick={() => setIsEditingLocation(false)} disabled={updating} size="sm">
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center gap-2">
                                <p className="text-2xl font-semibold break-words">{location || "N/A"}</p>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setIsEditingLocation(true)}
                                    className="border border-transparent hover:border-gray-300 dark:hover:border-gray-700 transition-all"
                                >
                                    Edit
                                </Button>
                            </div>
                        )}
                    </div>

                    <div className="text-center space-y-4">
                        <p className="text-sm text-muted-foreground">Quantity</p>
                        <div className="flex items-center gap-4 justify-center">
                            <Button
                                variant="outline"
                                size="lg"
                                onClick={dec}
                                disabled={updating || quantity <= 0}
                                className="w-16 h-16 rounded-full text-2xl"
                            >
                                −
                            </Button>
                            <div
                                className={`w-32 text-center text-6xl font-bold tabular-nums transition-opacity ${updating ? 'opacity-50' : 'opacity-100'}`}
                            >
                                {quantity}
                            </div>
                            <Button
                                variant="outline"
                                size="lg"
                                onClick={inc}
                                disabled={updating}
                                className="w-16 h-16 rounded-full text-2xl"
                            >
                                +
                            </Button>
                        </div>
                    </div>
                </div>

				<div className="mt-6 flex flex-col items-center gap-2">
					<Button onClick={() => setIsQrModalOpen(true)}>
						Show QR Code
					</Button>
					<Button variant="ghost" onClick={() => router.push("/")}>
						← Search for another item
					</Button>
					<div className="w-full border-t mt-4 pt-4">
						<Button
							variant="destructive"
							onClick={handleDelete}
							disabled={updating}
							className="w-full"
						>
							{updating ? "Deleting..." : "Delete Item"}
						</Button>
					</div>
				</div>
			</div>

			{isQrModalOpen && (
				<QRCodeModal
					itemCode={code}
					onClose={() => setIsQrModalOpen(false)}
				/>
			)}
		</main>
	);
}
