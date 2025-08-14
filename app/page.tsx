// FILE: app/page.tsx

"use client";
import { useRouter } from "next/navigation";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { BarcodeScanner } from "@/components/BarcodeScanner";

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

// A simple X icon for the clear button
function XIcon(props: React.SVGProps<SVGSVGElement>) {
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
			<path d="M18 6 6 18" />
			<path d="m6 6 12 12" />
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
