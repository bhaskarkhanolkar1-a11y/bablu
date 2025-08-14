// FILE: app/item/page.tsx

import * as React from 'react';
import ItemPageContent from './ItemPageContent';

// This is a simple fallback component that will be displayed while the main content is loading.
function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <p className="animate-pulse">Loading item...</p>
    </div>
  );
}

export default function ItemPage() {
  return (
    <React.Suspense fallback={<Loading />}>
      <ItemPageContent />
    </React.Suspense>
  );
}
