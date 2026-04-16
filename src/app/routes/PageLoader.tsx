// app/routes/PageLoader.tsx
// Fallback UI shown by <Suspense> while a lazy page chunk is loading.

import React from "react";

const PageLoader: React.FC = () => (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-amber-500" />
    </div>
);

export default PageLoader;