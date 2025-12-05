import React from "react";
import { Bell, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileHeaderProps {
    user: any;
    profile: any;
    title?: string;
    subtitle?: string;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
    user,
    profile,
    subtitle = "Confira as novidades"
}) => {
    // Extract first name for the greeting
    const getFirstName = () => {
        if (profile?.full_name) {
            return profile.full_name.split(' ')[0];
        }
        if (user?.email) {
            return user.email.split('@')[0];
        }
        return "Estudante";
    };

    const name = getFirstName();

    return (
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 pt-[calc(env(safe-area-inset-top)+1.5rem)] pb-12 px-6 shadow-md relative z-0">
            <div className="flex justify-between items-start">
                <div className="flex flex-col text-white">
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        Olá, {name} <span className="animate-wave">👋</span>
                    </h1>
                    <p className="text-green-50 text-sm font-medium mt-1">
                        {subtitle}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => window.location.reload()}
                        className="p-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors backdrop-blur-sm"
                        aria-label="Atualizar página"
                    >
                        <RotateCcw className="w-5 h-5" />
                    </button>

                    <button
                        className="p-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors backdrop-blur-sm relative"
                        aria-label="Notificações"
                    >
                        <Bell className="w-5 h-5" />
                        <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 border-2 border-green-600 rounded-full"></span>
                    </button>
                </div>
            </div>
        </div>
    );
};
