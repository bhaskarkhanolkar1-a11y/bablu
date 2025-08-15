// FILE: app/dashboard/page.tsx

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { ThemeToggleButton } from "@/components/ThemeToggleButton";

type InventoryItem = {
	name: string;
	quantity: number;
};

// You can change this number to define what you consider "low stock"
const LOW_STOCK_THRESHOLD = 5;

export default function DashboardPage() {
	const router = useRouter();
	const [items, setItems] = React.useState<InventoryItem[]>([]);
	const [loading, setLoading] = React.useState(true);
	const [error, setError] = React.useState<string | null>(null);

	React.useEffect(() => {
		async function fetchData() {
			try {
				const response = await fetch("/api/dashboard");
				if (!response.ok) {
					throw new Error("Failed to fetch inventory data");
				}
				const data: InventoryItem[] = await response.json();
				setItems(data);
			} catch (err) {
				if (err instanceof Error) {
					setError(err.message);
				} else {
					setError("An unknown error occurred.");
				}
			} finally {
				setLoading(false);
			}
		}
		fetchData();
	}, []);

	const lowStockItems = items
		.filter(item => item.quantity <= LOW_STOCK_THRESHOLD)
		.sort((a, b) => a.quantity - b.quantity);

	const allItems = items.sort((a, b) => a.name.localeCompare(b.name));

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<p className="animate-pulse">Loading Dashboard...</p>
			</div>
		);
	}

	if (error) {
		return (
			<div className="min-h-screen flex items-center justify-center text-center p-4">
				<div>
					<p className="text-red-500 mb-4">Error: {error}</p>
					<Button onClick={() => router.push("/")}>Go Back Home</Button>
				</div>
			</div>
		);
	}

	return (
		<main className="min-h-screen p-4 sm:p-6 md:p-8">
			<ThemeToggleButton />
			<div className="max-w-4xl mx-auto">
				<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
					<div className="flex items-center gap-4">
						<Image src="/logo.png" alt="Logo" width={120} height={36} />
						<h1 className="text-3xl font-bold">Inventory Dashboard</h1>
					</div>
					<Button variant="outline" onClick={() => router.push("/")}>
						← Back to Search
					</Button>
				</div>

				{/* Low Stock Items Section */}
				<section className="mb-10">
					<h2 className="text-2xl font-semibold mb-4 border-b pb-2 text-red-600 dark:text-red-500">
						Low Stock Items ({lowStockItems.length})
					</h2>
					{lowStockItems.length > 0 ? (
						<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
							{lowStockItems.map(item => (
								<div key={item.name} className="border rounded-lg p-4 bg-background/80 flex justify-between items-center">
									<span className="font-semibold break-words pr-2">{item.name}</span>
									<span className="font-bold text-red-600 dark:text-red-500 text-xl bg-red-100 dark:bg-red-900/50 rounded-full w-10 h-10 flex items-center justify-center">
										{item.quantity}
									</span>
								</div>
							))}
						</div>
					) : (
						<p className="text-muted-foreground">No items are low on stock. Great job!</p>
					)}
				</section>

				{/* Full Inventory List Section */}
				<section>
					<h2 className="text-2xl font-semibold mb-4 border-b pb-2">
						Full Inventory ({allItems.length})
					</h2>
					<div className="space-y-2">
						{allItems.map(item => (
							<div key={item.name} className="border rounded-lg p-3 bg-background/50 flex justify-between items-center hover:bg-foreground/5 transition-colors">
								<span className="break-words pr-2">{item.name}</span>
								<span className="font-mono bg-foreground/10 text-foreground rounded-md px-2 py-1 text-sm">
									Qty: {item.quantity}
								</span>
							</div>
						))}
					</div>
				</section>
			</div>
		</main>
	);
}
