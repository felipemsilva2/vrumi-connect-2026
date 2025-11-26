import { useState, useEffect } from 'react';
import { X, Download, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showPrompt, setShowPrompt] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);

    useEffect(() => {
        // Check if running in standalone mode
        const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches ||
            (window.navigator as any).standalone ||
            document.referrer.includes('android-app://');

        setIsStandalone(isInStandaloneMode);

        // Check if iOS
        const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
        setIsIOS(iOS);

        // Listen for beforeinstallprompt event (Android/Chrome)
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            const promptEvent = e as BeforeInstallPromptEvent;
            setDeferredPrompt(promptEvent);

            // Check if user has dismissed the prompt before
            const dismissed = localStorage.getItem('pwa-install-dismissed');
            if (!dismissed) {
                setShowPrompt(true);
            }
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // Show iOS prompt if applicable
        if (iOS && !isInStandaloneMode) {
            const dismissed = localStorage.getItem('pwa-install-dismissed-ios');
            if (!dismissed) {
                // Delay showing iOS prompt to avoid overwhelming the user
                setTimeout(() => setShowPrompt(true), 3000);
            }
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            console.log('User accepted the install prompt');
        } else {
            console.log('User dismissed the install prompt');
        }

        setDeferredPrompt(null);
        setShowPrompt(false);
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        if (isIOS) {
            localStorage.setItem('pwa-install-dismissed-ios', 'true');
        } else {
            localStorage.setItem('pwa-install-dismissed', 'true');
        }
    };

    // Don't show if already installed or dismissed
    if (!showPrompt || isStandalone) return null;

    return (
        <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-md animate-in slide-in-from-bottom-5">
            <Card className="relative overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-background to-primary/5 shadow-2xl backdrop-blur-sm">
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-2 h-8 w-8 rounded-full"
                    onClick={handleDismiss}
                >
                    <X className="h-4 w-4" />
                </Button>

                <div className="p-6 pt-8">
                    <div className="mb-4 flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-lg">
                            <Smartphone className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">Instale o App Vrumi</h3>
                            <p className="text-sm text-muted-foreground">
                                Acesse rapidamente do seu celular
                            </p>
                        </div>
                    </div>

                    {isIOS ? (
                        <div className="space-y-3">
                            <p className="text-sm text-muted-foreground">
                                Para instalar este app no seu iPhone:
                            </p>
                            <ol className="space-y-2 text-sm">
                                <li className="flex items-start gap-2">
                                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                                        1
                                    </span>
                                    <span>
                                        Toque no botão <strong>Compartilhar</strong> (
                                        <svg className="inline h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5a2.5 2.5 0 0 1 5 0v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5a2.5 2.5 0 0 0 5 0V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5z" />
                                        </svg>
                                        ) na barra inferior
                                    </span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                                        2
                                    </span>
                                    <span>
                                        Role para baixo e toque em <strong>"Adicionar à Tela de Início"</strong>
                                    </span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                                        3
                                    </span>
                                    <span>Toque em <strong>"Adicionar"</strong> no canto superior direito</span>
                                </li>
                            </ol>
                            <Button
                                onClick={handleDismiss}
                                className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                            >
                                Entendi
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <p className="text-sm text-muted-foreground">
                                Instale o app para acesso rápido e experiência completa offline
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    onClick={handleInstallClick}
                                    className="flex-1 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                                >
                                    <Download className="mr-2 h-4 w-4" />
                                    Instalar App
                                </Button>
                                <Button
                                    onClick={handleDismiss}
                                    variant="outline"
                                    className="flex-1"
                                >
                                    Agora não
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Decorative gradient */}
                <div className="absolute -bottom-2 -right-2 h-24 w-24 rounded-full bg-primary/10 blur-2xl" />
                <div className="absolute -left-2 -top-2 h-24 w-24 rounded-full bg-primary/10 blur-2xl" />
            </Card>
        </div>
    );
}
