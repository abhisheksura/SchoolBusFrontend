import React from "react";

interface TextInputProps
    extends React.InputHTMLAttributes<HTMLInputElement> {}

export const TextInput: React.FC<TextInputProps> = (props) => {
    return (
        <input
            {...props}
            className="
                w-full rounded-xl border border-slate-200 bg-white
                px-4 py-3 text-sm text-slate-800 outline-none
                focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20
            "
        />
    );
};