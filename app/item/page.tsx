"use client";
import { useRouter } from "next/navigation";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Home() {
	const router = useRouter();
	const [code, setCode] = React.useState("");
	const isValid = /^[A-Za-z0-9]{5}$/.test(code.trim());

	function submit() {
		const value = code.trim().toUpperCase();
		if (!/^[A-Za-z0-9]{5}$/.test(value)) return;
		router.push(`/item?code=${encodeURIComponent(value)}`);
	}

	return (
		<div className="min-h-screen flex items-center justify-center p-6">
			<div className="w-full max-w-md space-y-4">
				<h1 className="text-2xl font-semibold tracking-tight">Lookup item</h1>
				<div className="flex gap-2">
					<Input
						placeholder="Enter 5-digit code"
						value={code}
						onChange={e => setCode(e.target.value)}
						onKeyDown={e => {
							if (e.key === "Enter") submit();
						}}
						maxLength={5}
					/>
					<Button onClick={submit} disabled={!isValid}>
						Go
					</Button>
				</div>
				<div className="text-sm text-muted-foreground">
					{code && !isValid ? (
						<p>Codes must be exactly 5 alphanumeric characters.</p>
					) : (
						<p>Tip: You can press Enter to submit.</p>
					)}
				</div>
			</div>
		</div>
	);
}
