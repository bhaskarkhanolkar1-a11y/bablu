// FILE: app/item/ItemPageContent.tsx

"use client"; // Marks this as a Client Component

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type ItemState =
	| { status: "idle" | "loading" }
	| { status: "not_found"; code: string }
	| { status: "ready"; code: string; quantity: number };

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
				setState({ status: "ready", code: codeParam, quantity: data.quantity });
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
			<div className="min-h-screen flex items-center justify-center p-6">
				<div className="space-y-4 text-center">
					<p className="text-lg">No code provided.</p>
					<Button onClick={() => router.push("/")}>Go to home</Button>
				</div>
			</div>
		);
	}

	if (state.status === "loading" || state.status === "idle") {
		return (
			<div className="min-h-screen flex items-center justify-center p-6">
				<p>Loading…</p>
			</div>
		);
	}

	if (state.status === "not_found") {
		return (
			<div className="min-h-screen flex items-center justify-center p-6">
				<div className="space-y-4 text-center">
					<p className="text-lg">
						No product found with this code:{" "}
						<span className="font-mono">{state.code}</span>
					</p>
					<Button onClick={() => router.push("/")}>Try another code</Button>
				</div>
			</div>
		);
	}

	if (state.status !== "ready") {
		return null;
	}
	const { code, quantity } = state;

	function applyUpdate(next: number) {
		setState({ status: "ready", code, quantity: next });
		setUpdating(true);
		fetch(`/api/item`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ code, quantity: next }),
		})
			.then(res => {
				if (!res.ok) throw new Error("Update failed");
			})
			.catch(() => {
				fetch(`/api/item?code=${encodeURIComponent(code)}`)
					.then(r => r.json())
					.then(data =>
						setState({
							status: "ready",
							code,
							quantity: data.quantity,
						})
					)
					.catch(() => setState({ status: "not_found", code }));
			})
			.finally(() => setUpdating(false));
	}

	const dec = () => applyUpdate(Math.max(0, quantity - 1));
	const inc = () => applyUpdate(quantity + 1);

	return (
		<div className="min-h-screen flex items-center justify-center p-6">
			<div className="w-full max-w-md space-y-6">
				<div className="space-y-1">
					<p className="text-sm text-muted-foreground">Code</p>
					<p className="text-lg font-mono">{code}</p>
				</div>
				<div className="flex items-center gap-4 justify-center">
					<Button
						variant="outline"
						size="icon"
						onClick={dec}
						disabled={updating || quantity <= 0}
					>
						−
					</Button>
					<div className="w-24 text-center text-3l font-semibold tabular-nums">
						{quantity}
					</div>
					<Button
						variant="outline"
						size="icon"
						onClick={inc}
						disabled={updating}
					>
						+
					</Button>
				</div>
				<div className="flex justify-center">
					<Button variant="ghost" onClick={() => router.push("/")}>
						Change code
					</Button>
				</div>
			</div>
		</div>
	);
}