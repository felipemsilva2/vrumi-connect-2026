import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Target, BookOpen, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileBottomNavProps {
    onMenuClick: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ onMenuClick }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

    useEffect(() => {
        // Initial check
        let initialHeight = window.visualViewport?.height || window.innerHeight;

        const handleResize = () => {
            const currentHeight = window.visualViewport?.height || window.innerHeight;
            // If height shrinks by more than 20%, it's likely the keyboard
            if (currentHeight < initialHeight * 0.8) {
                setIsKeyboardOpen(true);
            } else {
                setIsKeyboardOpen(false);
                // Update initial height if it grew (e.g. address bar collapsed)
                if (currentHeight > initialHeight) {
                    initialHeight = currentHeight;
                }
            }
        };

        const handleOrientationChange = () => {
            setTimeout(() => {
                initialHeight = window.visualViewport?.height || window.innerHeight;
                handleResize();
            }, 100);
        };

        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', handleResize);
        } else {
            window.addEventListener('resize', handleResize);
        }

        window.addEventListener('orientationchange', handleOrientationChange);

        return () => {
            if (window.visualViewport) {
                window.visualViewport.removeEventListener('resize', handleResize);
            } else {
                window.removeEventListener('resize', handleResize);
            }
            window.removeEventListener('orientationchange', handleOrientationChange);
        };
    }, []);

    const isActive = (path: string) => {
        if (path.includes('?')) {
            return location.pathname + location.search === path;
        }
        return location.pathname === path && location.search === '';
    };

    const navItems = [
        {
            label: 'Dashboard',
            icon: Home,
            path: '/painel',
        },
        {
            label: 'Simulados',
            icon: Target,
            path: '/painel?tab=simulados',
        },
        {
            label: 'Flashcards',
            icon: BookOpen,
            path: '/painel?tab=flashcards',
        },
    ];

    return (
        <div className={cn(
            "fixed bottom-0 left-0 right-0 z-[9999] bg-background/80 backdrop-blur-lg border-t border-border bottom-nav pb-safe transition-all duration-300",
            isKeyboardOpen ? "translate-y-full opacity-0 pointer-events-none" : "translate-y-0 opacity-100"
        )}>
            <div className="flex items-center justify-around h-16 px-2">
                {navItems.map((item) => {
                    const active = isActive(item.path);
                    return (
                        <button
                            key={item.label}
                            onClick={() => navigate(item.path)}
                            className={cn(
                                "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors duration-200 min-w-[64px]",
                                active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <item.icon className={cn("h-6 w-6 shrink-0", active && "fill-current")} strokeWidth={active ? 2.5 : 2} />
                            <span className="text-[10px] font-medium truncate w-full text-center px-1">{item.label}</span>
                        </button>
                    );
                })}

                <button
                    onClick={onMenuClick}
                    className="flex flex-col items-center justify-center w-full h-full space-y-1 text-muted-foreground hover:text-foreground transition-colors duration-200 min-w-[64px]"
                >
                    <Menu className="h-6 w-6 shrink-0" strokeWidth={2} />
                    <span className="text-[10px] font-medium truncate w-full text-center px-1">Menu</span>
                </button>
            </div>
        </div>
    );
};
