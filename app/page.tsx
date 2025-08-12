// FILE: app/item/page.tsx

import { Suspense } from 'react';
import ItemContent from './ItemContent';

// This remains a Server Component for best performance
export default function ItemPage() {
  return (
    <main className="p-8">
      <h2 className="text-2xl font-semibold">Item Details Page</h2>
      <p>This part of the page is rendered on the server.</p>

      {/* This Suspense boundary shows a loading message */}
      {/* while the client-side component (ItemContent) loads. */}
      <Suspense fallback={<p className="mt-4 animate-pulse">Loading item details...</p>}>
        <ItemContent />
      </Suspense>
    </main>
  );
}
