// app/App.tsx
// Root component — mounts providers, routes, and global toaster.

import { Toaster } from "sonner";
import { AppProviders } from "./providers";
import { AppRoutes } from "./routes";

function App() {
    return (
        <AppProviders>
            <AppRoutes />
            <Toaster position="top-right" richColors />
        </AppProviders>
    );
}

export default App;