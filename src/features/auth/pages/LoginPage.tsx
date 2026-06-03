// modules/auth/pages/LoginPage.tsx
// Orchestrates the 60/40 login layout.
// Token is never written to the store until AFTER role validation passes.

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import BrandingCard from "../components/BrandingCard";
import LoginCard from "../components/LoginCard";
import LoginForm from "../components/LoginForm";

import { loginApi, getMeApi } from "../../../features/auth/api";
import { useAuthStore } from "../store";
import { ROLE_LABELS } from "../../../features/auth/types";
import type { LoginRequest } from "../../../features/auth/types";

// ---------------------------------------------------------------------------
// Error parser — extracts a readable message from any Axios error
// ---------------------------------------------------------------------------

function parseServerError(error: unknown): string {
    if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as {
            response?: { status?: number; data?: { detail?: unknown } };
        };
        const status = axiosError.response?.status;
        const detail = axiosError.response?.data?.detail;

        const detailMessage = (() => {
            if (!detail) return null;
            if (typeof detail === "string") return detail;
            if (Array.isArray(detail)) {
                return (detail[0] as { msg?: string })?.msg ?? null;
            }
            return null;
        })();

        if (status === 401) return detailMessage ?? "Invalid username or password. Please try again.";
        if (status === 403) return detailMessage ?? "Your account does not have permission for the selected role.";
        if (status === 422) return detailMessage ?? "Invalid request. Check your inputs.";
        if (status === 429) return detailMessage ?? "Too many login attempts. Please wait a moment and try again.";
        if (status && status >= 500) return "Server error. Please try again in a few moments.";
        if (detailMessage) return detailMessage;
    }
    return "Unable to reach the server. Check your connection and try again.";
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const LoginPage: React.FC = () => {
    const navigate = useNavigate();
    const { setAuth, user, accessToken } = useAuthStore();

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [serverError, setServerError] = useState<string | null>(null);

    // Redirect if already authenticated
    useEffect(() => {
        if (accessToken && user) {
            navigate("/dashboard", { replace: true });
        }
    }, [accessToken, user, navigate]);

    const handleLogin = async (data: LoginRequest): Promise<void> => {
        setIsLoading(true);
        setServerError(null);

        try {
            // Step 1: get tokens
            const { access_token } = await loginApi(data);

            // Step 2: fetch profile — pass token directly, do NOT write to store yet.
            // Writing to the store here would fire the useEffect above and redirect
            // to /dashboard before the role check below can run.
            const me = await getMeApi(access_token);

            // Step 3: validate that the selected role is assigned and active
            const hasSelectedRole = me.roles.some(
                (r) => r.role_name === data.role && r.is_active
            );

            if (!hasSelectedRole) {
                setServerError(
                    `Your account is not assigned the "${ROLE_LABELS[data.role]}" role. ` +
                    `Please select the correct role and try again.`
                );
                return;
            }

            // Step 4: role check passed — commit to store and navigate
            setAuth(access_token, me, data.role);
            navigate("/dashboard", { replace: true });

        } catch (err: unknown) {
            setServerError(parseServerError(err));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="flex min-h-screen">
            <BrandingCard />
            <LoginCard>
                <LoginForm
                    onSubmit={handleLogin}
                    isLoading={isLoading}
                    serverError={serverError}
                />
            </LoginCard>
        </main>
    );
};

export default LoginPage;