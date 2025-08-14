// FILE: app/page.tsx

"use client";
import { useRouter } from "next/navigation";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";

export default function HomePage() {
	const router = useRouter();
	const [code, setCode] = React.useState("");
	const [open, setOpen] = React.useState(false);
	const [loading, setLoading] = React.useState(false);
	const [suggestions, setSuggestions] = React.useState<
		Array<{ code: string; quantity: number }>
	>([]);
	const [activeIndex, setActiveIndex] = React.useState(-1);

	function submit() {
		if (!code.trim()) return;
		const value = code.trim().toUpperCase();
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
					if (!res.ok) {
                        const errorText = await res.text();
                        throw new Error(`API Error: ${res.status} - ${errorText}`);
                    }
					return res.json();
				})
				.then((data: Array<{ code: string; quantity: number }>) => {
					setSuggestions(data);
					setOpen(true);
					setActiveIndex(data.length ? 0 : -1);
				})
				.catch((err) => {
					console.error("Failed to fetch search suggestions:", err);
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
					`/item?code=${encodeURIComponent(chosen.code.toUpperCase())}`
				);
			} else {
				submit();
			}
		} else if (e.key === "Escape") {
			setOpen(false);
		}
	}

	return (
		<main className="min-h-screen flex items-center justify-center p-6">
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
                        Enter a product code to check its quantity and location.
                    </
