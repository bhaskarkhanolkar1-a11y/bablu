// FILE: app/item/ItemPageContent.tsx

"use client"; // Marks this as a Client Component

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";

type ItemState =
	| { status: "idle" | "loading" }
	| { status: "not_found"; code: string }
	| { status: "ready"; code: string; quantity: number; location: string };

export default function ItemPageContent() {
	const params = useSearchParams();
	const router = useRouter();
	const codeParam = params.get("code")?.trim().toUpperCase() || "";
	const [state, setState] = React.useState<ItemState>({ status: "idle" });
	const [updating, setUpdating] = React.useState(false);

    // State for editing location and code
    const [isEditingLocation, setIsEditingLocation] = React.useState(false);
    const [newLocation, setNewLocation] = React.useState("");
    const [isEditingCode, setIsEditingCode] = React.useState(false);
    const [newCode, setNewCode] = React.useState("");


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
                setNewLocation(data.location ?? "");
                setNewCode(codeParam);
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
					<Button onClick
