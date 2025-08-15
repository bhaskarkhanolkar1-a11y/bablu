// FILE: app/add-item/page.tsx

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { ThemeToggleButton } from "@/components/ThemeToggleButton";

export default function AddItemPage() {
	const router = useRouter();
	const [name, setName] = React.useState("");
	const [quantity, setQuantity] = React.useState("");
	const [location, setLocation] = React.useState("");
	const [isSubmitting, setIsSubmitting] = React.useState(false);
	const [error, setError] = React.useState<string | null>(null);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setIsSubmitting(true);
		setError(null);

		const quantityNum = parseInt(quantity, 10);
		if (isNaN(quantityNum)) {
			setError("Quantity must be a valid number.");
			setIsSubmitting(false);
			return;
		}

		try {
			const response = await fetch("/api/item", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					name: name,
					quantity: quantityNum,
					location: location,
				}),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to add item");
			}

			// On success, redirect to the home page
			router.push("/");
			
		} catch (err: any) {
			setError(err.message);
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<main className="min-h-screen flex items-center justify-center p-6">
			<ThemeToggleButton />
			<div className="w-full max-w-md mx-auto">
				<div className="flex justify-center mb-6">
					<Image
						src="/logo.png"
						alt="Crompton Greaves Logo"
						width={160}
						height={48}
						priority
					/>
				</div>
				<h1 className="text-2xl font-bold text-center mb-6">Add New Item</h1>
				<form onSubmit={handleSubmit} className="space-y-4">
					<div>
						<label htmlFor="name" className="block text-sm font-medium text-muted-foreground mb-1">
							Product Name
						</label>
						<Input
							id="name"
							type="text"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="e.g., Pressure Gauge"
							required
						/>
					</div>
					<div>
						<label htmlFor="quantity" className="block text-sm font-medium text-muted-foreground mb-1">
							Initial Quantity
						</label>
						<Input
							id="quantity"
							type="number"
							value={quantity}
							onChange={(e) => setQuantity(e.target.value)}
							placeholder="e.g., 10"
							required
						/>
					</div>
					<div>
						<label htmlFor="location" className="block text-sm font-medium text-muted-foreground mb-1">
							Location
						</label>
						<Input
							id="location"
							type="text"
							value={location}
							onChange={(e) => setLocation(e.target.value)}
							placeholder="e.g., Rack A-1"
							required
						/>
					</div>
					{error && <p className="text-sm text-red-500">{error}</p>}
					<Button type="submit" className="w-full h-11" disabled={isSubmitting}>
						{isSubmitting ? "Adding..." : "Add Item"}
					</Button>
					<Button type="button" variant="ghost" className="w-full" onClick={() => router.push("/")}>
						Cancel
					</Button>
				</form>
			</div>
		</main>
	);
}
