// modules/auth/components/LoginForm.tsx
// RHF + Zod login form. Injects platform:"web" at submit time.

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, User, Lock, Loader2 } from "lucide-react";

import RoleButton from "./RoleButton";
import { ADMIN_ROLES } from "@/features/auth/";
import type { UserRole, LoginRequest } from "@/features/auth/";

// ---------------------------------------------------------------------------
// Zod schema — mirrors backend LoginRequest (platform injected at submit)
// ---------------------------------------------------------------------------

const ROLES = ["SUPER_ADMIN", "SCHOOL_ADMIN", "BRANCH_ADMIN"] as const;
// type Role = (typeof ROLES)[number];

const loginSchema = z.object({
    user_name: z
        .string()
        .min(1, "Username is required")
        .max(50, "Username must be 50 characters or fewer")
        .regex(/^[a-zA-Z0-9_.-]+$/, "Only letters, numbers, underscores, dots and hyphens allowed"),
    password: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .max(128, "Password must be 128 characters or fewer"),
    role: z
        .string()
        .min(1, "Please select a role")
        .refine(
            (val) => ROLES.includes(val as any),
            { message: "Invalid role" }
        ),
});

type LoginFormValues = z.infer<typeof loginSchema>;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface LoginFormProps {
    onSubmit: (data: LoginRequest) => Promise<void>;
    isLoading: boolean;
    serverError: string | null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const LoginForm: React.FC<LoginFormProps> = ({ onSubmit, isLoading, serverError }) => {
    const [showPassword, setShowPassword] = useState<boolean>(false);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            user_name: "",
            password: "",
            role: "SCHOOL_ADMIN",
        },
    });

    const selectedRole = watch("role") as UserRole;

    const handleRoleSelect = (role: UserRole): void => {
        setValue("role", role as "SUPER_ADMIN" | "SCHOOL_ADMIN" | "BRANCH_ADMIN", {
            shouldValidate: true,
        });
    };

    const handleFormSubmit = async (values: LoginFormValues): Promise<void> => {
        // platform is always "web" on this app — injected here, not a form field
        await onSubmit({ ...values, platform: "web" } as LoginRequest);
    };

    return (
        <form onSubmit={handleSubmit(handleFormSubmit)} noValidate className="flex flex-col gap-5">

            {/* Role selector */}
            <fieldset className="flex flex-col gap-2">
                <legend className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                    Sign in as
                </legend>
                <div className="flex flex-col gap-2">
                    {ADMIN_ROLES.map((role) => (
                        <RoleButton
                            key={role}
                            role={role}
                            isSelected={selectedRole === role}
                            onSelect={handleRoleSelect}
                        />
                    ))}
                </div>
                <input type="hidden" {...register("role")} />
                {errors.role && (
                    <p className="text-xs text-red-500 mt-0.5">{errors.role.message}</p>
                )}
            </fieldset>

            {/* Divider */}
            <div className="relative flex items-center gap-3">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-xs text-slate-400 shrink-0">credentials</span>
                <div className="flex-1 h-px bg-slate-200" />
            </div>

            {/* Username */}
            <div className="flex flex-col gap-1.5">
                <label htmlFor="user_name" className="text-sm font-medium text-slate-700">
                    Username
                </label>
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                        <User size={16} strokeWidth={1.75} />
                    </span>
                    <input
                        id="user_name"
                        type="text"
                        autoComplete="username"
                        autoCapitalize="none"
                        autoCorrect="off"
                        spellCheck={false}
                        placeholder="your_username"
                        {...register("user_name")}
                        aria-invalid={!!errors.user_name}
                        className={[
                            "w-full rounded-lg border py-2.5 pl-9 pr-4",
                            "text-sm text-slate-800 placeholder:text-slate-400",
                            "outline-none transition-all duration-150",
                            "focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500",
                            errors.user_name
                                ? "border-red-400 bg-red-50/40"
                                : "border-slate-300 bg-white hover:border-slate-400",
                        ].join(" ")}
                    />
                </div>
                {errors.user_name && (
                    <p className="text-xs text-red-500">{errors.user_name.message}</p>
                )}
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                    <label htmlFor="password" className="text-sm font-medium text-slate-700">
                        Password
                    </label>
                    <a href="#" className="text-xs text-amber-600 hover:text-amber-700 font-medium transition-colors">
                        Forgot password?
                    </a>
                </div>
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                        <Lock size={16} strokeWidth={1.75} />
                    </span>
                    <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        placeholder="••••••••"
                        {...register("password")}
                        aria-invalid={!!errors.password}
                        className={[
                            "w-full rounded-lg border py-2.5 pl-9 pr-11",
                            "text-sm text-slate-800 placeholder:text-slate-400",
                            "outline-none transition-all duration-150",
                            "focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500",
                            errors.password
                                ? "border-red-400 bg-red-50/40"
                                : "border-slate-300 bg-white hover:border-slate-400",
                        ].join(" ")}
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        {showPassword
                            ? <EyeOff size={16} strokeWidth={1.75} />
                            : <Eye size={16} strokeWidth={1.75} />
                        }
                    </button>
                </div>
                {errors.password && (
                    <p className="text-xs text-red-500">{errors.password.message}</p>
                )}
            </div>

            {/* Server error banner */}
            {/* key=serverError forces React to remount on every new error message */}
            {serverError && (
                <div
                    key={serverError}
                    role="alert"
                    className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700"
                >
                    <span className="shrink-0 mt-0.5 text-red-500">&#9888;</span>
                    {serverError}
                </div>
            )}

            {/* Submit */}
            <button
                type="submit"
                disabled={isLoading}

bg-yellow-400
                className={[
                    "flex items-center justify-center gap-2 w-full",
                    "rounded-lg bg-yellow-400 py-2.5 px-5",
                    "text-sm font-semibold text-black",
                    "shadow-md shadow-amber-500/25 transition-all duration-150",
                    isLoading
                        ? "cursor-not-allowed opacity-70"
                        : "hover:bg-yellow-600 active:scale-[0.98]",
                ].join(" ")}
            >
                {isLoading ? (
                    <>
                        <Loader2 size={16} className="animate-spin" />
                        Signing in...
                    </>
                ) : (
                    "Sign in"
                )}
            </button>
        </form>
    );
};

export default LoginForm;