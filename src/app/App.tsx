import { Toaster } from "sonner";
import { Providers } from "./providers";
import { AppRoutes } from "./routes";

function App() {
    return (
        <Providers>
            <AppRoutes />
            <Toaster position="top-right" richColors />
        </Providers>
    );
}

export default App;