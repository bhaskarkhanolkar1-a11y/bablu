// FILE: app/item/ItemPageContent.tsx

"use client";

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
					<Button onClick={() => router.push("/")}>Try another code</Button>
				</div>
			</div>
		);
	}

	if (state.status !== "ready") {
		return null;
	}
	const { code, quantity, location } = state;

	function applyUpdate(data: { newCode?: string, quantity?: number, location?: string }) {
		setUpdating(true);

		fetch(`/api/item`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ code, ...data }),
		})
			.then(() => {
                if (data.newCode) {
                    router.push(`/item?code=${encodeURIComponent(data.newCode)}`);
                } else {
                    const optimisticState = { ...state, ...data } as ItemState;
		            setState(optimisticState);
                }
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
                setIsEditingCode(false);
            });
	}

	const dec = () => applyUpdate({ quantity: Math.max(0, quantity - 1) });
	const inc = () => applyUpdate({ quantity: quantity + 1 });
    const handleLocationSave = () => applyUpdate({ location: newLocation });
    const handleCodeSave = () => {
        if (newCode.trim() && newCode.trim().toUpperCase() !== code) {
            applyUpdate({ newCode: newCode.trim().toUpperCase() });
        } else {
            setIsEditingCode(false);
        }
    }

	return (
		<main className="min-h-screen flex items-center justify-center p-6">
			<div className="w-full max-w-sm">
                <div className="flex justify-center mb-8">
                    <Image
                        src="/logo.png"
                        alt="Crompton Greaves Logo"
                        width={160}
                        height={48}
                        priority
                    />
                </div>
                <div className="bg-background border rounded-lg shadow-lg p-8 space-y-8">
                    <div className="text-center">
                        <p className="text-sm text-muted-foreground">Product Code</p>
                        {isEditingCode ? (
                            <div className="mt-2 space-y-2">
                                <Input
                                    type="text"
                                    value={
