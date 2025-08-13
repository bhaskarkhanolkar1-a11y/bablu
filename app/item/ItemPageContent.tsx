// FILE: app/item/ItemPageContent.tsx

"use client"; // Marks this as a Client Component

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Image from "next/image";

type ItemState =
	| { status: "idle" | "loading" }
	| { status: "not_found"; code: string }
	| { status: "ready"; code: string; quantity: number; location: string };

// The component is renamed to ItemPageContent
export default function ItemPageContent() {
	const params = useSearchParams();
	const router = useRouter();
	const codeParam = params.get("code")?.trim().toUpperCase() || "";
	const [state, setState] = React.useState<ItemState>({ status: "idle" });
	const [updating, setUpdating] = React.useState(false);

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
					code: codeParam,
					quantity: data.quantity,
					location: data.location ?? "",
				});
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

	function applyUpdate(next: number) {
        const optimisticState = { status: "ready" as const, code, quantity: next, location };
		setState(optimisticState);
		setUpdating(true);
		fetch(`/api/item`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ code, quantity: next }),
		})
			.catch(() => {
                // On failure, revert to the previous state (or re-fetch)
				fetch(`/api/item?code=${encodeURIComponent(code)}`)
					.then(r => r.json())
					.then(data =>
						setState({
							status: "ready",
							code,
							quantity: data.quantity,
							location: data.location ?? "",
						})
					)
					.catch(() => setState({ status: "not_found", code }));
			})
			.finally(() => setUpdating(false));
	}

	const dec = () => applyUpdate(Math.max(0, quantity - 1));
	const inc = () => applyUpdate(quantity + 1);

	return (
		<main className="min-h-screen flex items-center justify-center p-6">
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
                <div className="bg-background border rounded-lg shadow-lg p-8 space-y-8">
                    <div className="text-center">
                        <p className="text-sm text-muted-foreground">Product Code</p>
                        <h1 className="text-3xl font-bold font-mono tracking-wider">{code}</h1>
                    </div>
                    
                    <div className="text-center">
                        <p className="text-sm text-muted-foreground">Location</p>
                        <p className="text-2xl font-semibold break-words">{location || "N/A"}</p>
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

				<div className="mt-6 flex justify-center">
					<Button variant="ghost" onClick={() => router.push("/")}>
						← Search for another item
					</Button>
				</div>
			</div>
		</main>
	);
}
