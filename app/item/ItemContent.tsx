// FILE: app/item/ItemContent.tsx

'use client'; 

import { useSearchParams } from 'next/navigation';

export default function ItemContent() {
  const searchParams = useSearchParams();
  const itemId = searchParams.get('id');

  // You can add more complex logic here
  if (!itemId) {
    return <p className="text-red-500">Error: No item ID was found in the URL.</p>;
  }

  return (
    <div className="mt-4 p-4 border rounded-lg">
      <h1 className="text-xl font-bold">Showing Details for Item ID: {itemId}</h1>
      <p>Your item data can be fetched and displayed here...</p>
    </div>
  );
}