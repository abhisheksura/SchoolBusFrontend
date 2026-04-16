// app/providers/AppProviders.tsx
// Composes all providers in the correct dependency order:
//
// Add new providers here. Keep each provider in its own file so the
// concern is obvious and the file stays small.
 
import React from "react";
import { BrowserRouter } from "react-router-dom";
import ThemeProvider from "./ThemeProvider";
import QueryProvider from "./QueryProvider";
import AuthProvider from "./AuthProvider";
import { TenantProvider } from "@/tenant/TenantProvider";

interface AppProvidersProps {
    children: React.ReactNode;
}

const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
    return (
        <QueryProvider>
            <AuthProvider>
                <TenantProvider>
                    <ThemeProvider>
                        <BrowserRouter>
                            {children}
                        </BrowserRouter>
                    </ThemeProvider>
                </TenantProvider>
            </AuthProvider>
        </QueryProvider>
    );
};

export default AppProviders;