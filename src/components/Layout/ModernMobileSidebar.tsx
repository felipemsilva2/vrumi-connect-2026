import React from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Home,
    BookOpen,
    Target,
    FileText,
    BarChart3,
    User,
    LogOut,
    Trophy,
    Shield,
    TrafficCone,
    X,
    ChevronRight,
    Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModernMobileSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    userName: string;
    userPlan: string;
    hasActivePass: boolean;
    isAdmin: boolean;
    onNavigate: (path: string) => void;
    onLogout: () => void;
}

export const ModernMobileSidebar: React.FC<ModernMobileSidebarProps> = ({
    isOpen,
    onClose,
    userName,
    userPlan,
    hasActivePass,
    isAdmin,
    onNavigate,
    onLogout,
}) => {
    const location = useLocation();

    const isActiveRoute = (path: string) => {
        const [targetPath, targetQuery] = path.split('?');

        if (location.pathname !== targetPath) {
            return false;
        }

        if (targetQuery) {
            return location.search === `?${targetQuery}`;
        }

        return location.search === '';
    };

    const handleNavigate = (path: string) => {
        onNavigate(path);
        onClose();
    };

    const navigationItems = [
        {
            label: 'Sala de Estudos',
            icon: FileText,
            path: '/sala-de-estudos',
            description: 'Estude com IA'
        },
        {
            label: 'Estatísticas',
            icon: BarChart3,
            path: '/painel?tab=estatisticas',
            description: 'Seu desempenho'
        },
        {
            label: 'Biblioteca de Placas',
            icon: TrafficCone,
            path: '/biblioteca-de-placas',
            description: 'Consulte placas'
        },
        {
            label: 'Conquistas',
            icon: Trophy,
            path: '/painel?tab=conquistas',
            notif: 1,
            description: 'Suas medalhas'
        },
    ];

    const accountItems = [
        {
            label: 'Meu Perfil',
            icon: User,
            path: '/painel?tab=perfil',
            description: 'Configurações'
        },
    ];

    const overlayVariants: Variants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1 },
    };

    const sidebarVariants: Variants = {
        hidden: { x: '-100%' },
        visible: {
            x: '0%',
            transition: {
                type: 'spring',
                damping: 30,
                stiffness: 300,
            }
        },
        exit: {
            x: '-100%',
            transition: {
                type: 'spring',
                damping: 30,
                stiffness: 300,
            }
        },
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Overlay */}
                    <motion.div
                        variants={overlayVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
                    />

                    {/* Sidebar */}
                    <motion.div
                        variants={sidebarVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="fixed top-0 left-0 bottom-0 w-[85vw] max-w-sm bg-background z-[101] shadow-2xl pt-safe pb-safe"
                    >
                        {/* Content Container */}
                        <div className="flex flex-col h-full">
                            {/* Header with Gradient */}
                            <div className="relative bg-gradient-to-br from-primary/10 via-primary/5 to-transparent pb-6 pt-4 px-6">
                                {/* Close Button */}
                                <button
                                    onClick={onClose}
                                    className="absolute top-4 right-4 p-2 rounded-full bg-background/50 backdrop-blur-sm hover:bg-background transition-colors"
                                    aria-label="Fechar menu"
                                >
                                    <X className="h-5 w-5 text-foreground" />
                                </button>

                                {/* User Info */}
                                <div className="flex items-center gap-4 mt-8">
                                    {/* Avatar */}
                                    <div className="relative">
                                        <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg">
                                            <span className="text-2xl font-bold text-primary-foreground">
                                                {userName.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        {hasActivePass && (
                                            <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-green-500 border-2 border-background flex items-center justify-center">
                                                <Sparkles className="h-3 w-3 text-white" />
                                            </div>
                                        )}
                                    </div>

                                    {/* User Details */}
                                    <div className="flex-1 min-w-0">
                                        <h2 className="text-lg font-bold text-foreground truncate">
                                            {userName}
                                        </h2>
                                        <p className={cn(
                                            "text-sm font-medium truncate",
                                            hasActivePass
                                                ? "text-green-600 dark:text-green-400"
                                                : "text-muted-foreground"
                                        )}>
                                            {userPlan}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Scrollable Navigation */}
                            <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
                                {/* Main Navigation */}
                                <nav className="space-y-1">
                                    {navigationItems.map((item) => {
                                        const isActive = isActiveRoute(item.path);
                                        return (
                                            <motion.button
                                                key={item.path}
                                                onClick={() => handleNavigate(item.path)}
                                                whileTap={{ scale: 0.98 }}
                                                className={cn(
                                                    "w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200 group relative overflow-hidden",
                                                    isActive
                                                        ? "bg-primary/10 text-primary"
                                                        : "text-foreground hover:bg-accent/10"
                                                )}
                                            >
                                                {/* Active Indicator */}
                                                {isActive && (
                                                    <motion.div
                                                        layoutId="activeIndicator"
                                                        className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full"
                                                        transition={{ type: "spring", damping: 30, stiffness: 300 }}
                                                    />
                                                )}

                                                {/* Icon */}
                                                <div className={cn(
                                                    "p-2 rounded-lg transition-colors",
                                                    isActive
                                                        ? "bg-primary/20"
                                                        : "bg-accent/50 group-hover:bg-accent"
                                                )}>
                                                    <item.icon className="h-5 w-5" />
                                                </div>

                                                {/* Text */}
                                                <div className="flex-1 text-left">
                                                    <div className="font-medium text-sm">
                                                        {item.label}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {item.description}
                                                    </div>
                                                </div>

                                                {/* Notification Badge */}
                                                {item.notif && (
                                                    <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                                                        <span className="text-xs font-bold text-primary-foreground">
                                                            {item.notif}
                                                        </span>
                                                    </div>
                                                )}

                                                {/* Arrow */}
                                                <ChevronRight className={cn(
                                                    "h-4 w-4 transition-transform",
                                                    isActive ? "opacity-100" : "opacity-0 group-hover:opacity-50"
                                                )} />
                                            </motion.button>
                                        );
                                    })}
                                </nav>

                                {/* Admin Section */}
                                {isAdmin && (
                                    <div className="space-y-2">
                                        <div className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                            Administração
                                        </div>
                                        <motion.button
                                            onClick={() => handleNavigate('/admin/painel')}
                                            whileTap={{ scale: 0.98 }}
                                            className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-foreground hover:bg-accent/10 transition-all duration-200 group"
                                        >
                                            <div className="p-2 rounded-lg bg-purple-500/20">
                                                <Shield className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                            </div>
                                            <div className="flex-1 text-left">
                                                <div className="font-medium text-sm">Área Admin</div>
                                                <div className="text-xs text-muted-foreground">Gerenciar sistema</div>
                                            </div>
                                            <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-50 transition-opacity" />
                                        </motion.button>
                                    </div>
                                )}

                                {/* Account Section */}
                                <div className="space-y-2">
                                    <div className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                        Conta
                                    </div>
                                    {accountItems.map((item) => (
                                        <motion.button
                                            key={item.path}
                                            onClick={() => handleNavigate(item.path)}
                                            whileTap={{ scale: 0.98 }}
                                            className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-foreground hover:bg-accent/10 transition-all duration-200 group"
                                        >
                                            <div className="p-2 rounded-lg bg-accent/50 group-hover:bg-accent">
                                                <item.icon className="h-5 w-5" />
                                            </div>
                                            <div className="flex-1 text-left">
                                                <div className="font-medium text-sm">{item.label}</div>
                                                <div className="text-xs text-muted-foreground">{item.description}</div>
                                            </div>
                                            <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-50 transition-opacity" />
                                        </motion.button>
                                    ))}
                                </div>
                            </div>

                            {/* Footer with Logout */}
                            <div className="p-4 border-t border-border/50 bg-accent/5">
                                <motion.button
                                    onClick={onLogout}
                                    whileTap={{ scale: 0.98 }}
                                    className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-all duration-200 group"
                                >
                                    <div className="p-2 rounded-lg bg-red-500/10 group-hover:bg-red-500/20">
                                        <LogOut className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1 text-left">
                                        <div className="font-medium text-sm">Sair da conta</div>
                                        <div className="text-xs text-muted-foreground">Fazer logout</div>
                                    </div>
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
