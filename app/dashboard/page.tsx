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

// A new icon for the alert section
function AlertTriangleIcon(props: React.SVGProps<SVGSVGElement>) {
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
			<path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
			<path d="M12 9v4" />
			<path d="M12 17h.01" />
		</svg>
	);
}


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
				<p className="animate-pulse text-lg">Loading Dashboard...</p>
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
		<>
			<ThemeToggleButton />
			<main className="min-h-screen p-4 sm:p-6 md:p-8">
				<div className="max-w-7xl mx-auto">
					{/* Header */}
					<header className="flex items-center justify-between gap-4 mb-8 pb-4 border-b">
						<div className="flex items-center gap-4">
							<Image src="/logo.png" alt="Logo" width={120} height={36} />
							<div>
								<h1 className="text-2xl font-bold">Inventory Dashboard</h1>
								<p className="text-sm text-muted-foreground">A complete overview of your stock.</p>
							</div>
						</div>
						<Button variant="outline" onClick={() => router.push("/")}>
							← Back to Search
						</Button>
					</header>

					<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
						{/* Left Column: Low Stock Alerts */}
						<div className="lg:col-span-1">
							<section>
								<h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
									<AlertTriangleIcon className="h-6 w-6 text-red-500" />
									Low Stock Alerts
								</h2>
								<div className="space-y-3">
									{lowStockItems.length > 0 ? (
										lowStockItems.map(item => (
											<div key={item.name} className="border-l-4 border-red-500 bg-background/80 rounded-r-lg p-4 flex justify-between items-center shadow-sm">
												<span className="font-semibold break-words pr-2">{item.name}</span>
												<span className="font-bold text-red-500 text-xl">
													{item.quantity}
												</span>
											</div>
										))
									) : (
										<div className="border rounded-lg p-4 text-center text-muted-foreground bg-background/50">
											<p>No items are low on stock. Great job!</p>
										</div>
									)}
								</div>
							</section>
						</div>

						{/* Right Column: Full Inventory Table */}
						<div className="lg:col-span-2">
							<section>
								<h2 className="text-xl font-semibold mb-4">Full Inventory ({allItems.length} items)</h2>
								<div className="border rounded-lg overflow-hidden shadow-sm bg-background/50">
									<table className="w-full text-left">
										<thead className="bg-foreground/5">
											<tr>
												<th className="p-3 font-semibold">Product Name</th>
												<th className="p-3 font-semibold text-right">Quantity in Stock</th>
											</tr>
										</thead>
										<tbody>
											{allItems.map((item, index) => (
												<tr key={item.name} className={`border-t ${index % 2 === 0 ? 'bg-transparent' : 'bg-foreground/5'}`}>
													<td className="p-3 break-words">{item.name}</td>
													<td className="p-3 text-right font-mono">{item.quantity}</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							</section>
						</div>
					</div>
				</div>
			</main>
		</>
	);
}
