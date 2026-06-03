// modules/auth/routes.ts
// Auth module only has public routes (login).
// These are registered separately in AppRoutes as they don't go through
// AuthGuard — exported here for completeness and future use.

import { lazy } from "react";
import type { RouteConfig } from "@/app/routes";

const LoginPage = lazy(() => import("./pages/LoginPage"));

export const authRoutes: RouteConfig[] = [
    {
        path: "/auth/login",
        element: LoginPage,
        roles: [],
        showInSidebar: false,
    },
];