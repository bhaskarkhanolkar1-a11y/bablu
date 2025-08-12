// FILE: app/item/page.tsx

import { Suspense } from 'react';
import ItemPageContent from './ItemPageContent'; // We will create this next

export default function ItemPage() {
  return (
    // This Suspense boundary shows a fallback UI
    // while the client component below is loading.
    <Suspense fallback={<LoadingState />}>
      <ItemPageContent />
    </Suspense>
  );
}

// A simple component for the loading fallback
function LoadingState() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <p className="animate-pulse">Loading item...</p>
    </div>
  );
}
