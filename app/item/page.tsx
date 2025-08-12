// FILE: app/item/page.tsx

import { Suspense } from 'react';
import ItemPageContent from './ItemPageContent';

export default function ItemDetailsPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <ItemPageContent />
    </Suspense>
  );
}

function LoadingState() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <p className="animate-pulse">Loading item...</p>
    </div>
  );
}
