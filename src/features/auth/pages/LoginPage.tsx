// LoginPage
// Orchestrates the 60/40 login layout and owns the auth side-effect.
//
// The critical fix vs the previous version:
//   getMeApi() is called with the raw token passed as a header argument.
//   The token is NOT written to the Zustand store until AFTER the role
//   check passes. This prevents the useEffect that watches `accessToken`
//   from firing early and navigating to /dashboard before validation runs.

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import BrandingCard from "../components/BrandingCard";
import LoginCard from "../components/LoginCard";
import LoginForm from "../components/LoginForm";

import { loginApi, getMeApi } from "../api";
import { useAuthStore } from "../store";
import { ROLE_LABELS } from "../types";
import type { LoginRequest } from "../types";

// ---------------------------------------------------------------------------
// Map backend HTTP errors to readable messages
// ---------------------------------------------------------------------------

function parseServerError(error: unknown): string {
    if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as {
            response?: { status?: number; data?: { detail?: unknown } };
        };
        const status = axiosError.response?.status;
        const detail = axiosError.response?.data?.detail;

        if (status === 401) return "Invalid username or password. Please try again.";
        if (status === 403) return "Your account does not have permission for the selected role.";
        if (status === 422 && detail) {
            if (Array.isArray(detail)) {
                return (detail[0] as { msg?: string })?.msg ?? "Invalid request. Check your inputs.";
            }
            return String(detail);
        }
        if (status === 429) return "Too many login attempts. Please wait a moment and try again.";
        if (status && status >= 500) return "Server error. Please try again in a few moments.";
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

    // Redirect if already fully authenticated
    useEffect(() => {
        if (accessToken && user) {
            navigate("/dashboard", { replace: true });
        }
    }, [accessToken, user, navigate]);

    // -------------------------------------------------------------------------
    // Login handler
    // -------------------------------------------------------------------------

    const handleLogin = async (data: LoginRequest): Promise<void> => {
        setIsLoading(true);
        setServerError(null);

        try {
            // Step 1: get tokens from the backend
            const { access_token } = await loginApi(data);

            // Step 2: fetch the user profile by passing the token directly as a
            // header argument -- NOT via the store. This means `accessToken` in
            // Zustand stays null, so the useEffect above cannot fire yet.
            const me = await getMeApi(access_token);

            // Step 3: check that the role the user selected on the form is
            // actually assigned to their account and is active.
            const hasSelectedRole = me.roles.some(
                (r) => r.role_name === data.role && r.is_active
            );

            if (!hasSelectedRole) {
                // Token never enters the store -- session is not established.
                setServerError(
                    `Your account is not assigned the "${ROLE_LABELS[data.role]}" role. ` +
                    `Please select the correct role and try again.`
                );
                return;
            }

            // Step 4: role check passed -- now write to the store and navigate.
            setAuth(access_token, me, data.role);
            navigate("/dashboard", { replace: true });

        } catch (err: unknown) {
            setServerError(parseServerError(err));
        } finally {
            setIsLoading(false);
        }
    };

    // -------------------------------------------------------------------------
    // Render
    // -------------------------------------------------------------------------

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