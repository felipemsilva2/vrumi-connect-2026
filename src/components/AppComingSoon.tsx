import React from "react";
import { Smartphone, Bell } from "lucide-react";

const AppComingSoon = () => {
    return (
        <section className="py-16 sm:py-20 px-4 bg-gradient-to-br from-emerald-50 via-white to-cyan-50 dark:from-emerald-950/20 dark:via-background dark:to-cyan-950/20">
            <div className="container mx-auto max-w-4xl">
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500 to-cyan-600 p-8 sm:p-12 shadow-2xl">
                    {/* Background decorations */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl" />

                    <div className="relative z-10 text-center">
                        {/* Icon */}
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl mb-6">
                            <Smartphone className="w-8 h-8 text-white" />
                        </div>

                        {/* Badge */}
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white text-sm font-medium mb-6">
                            <Bell className="w-4 h-4 animate-pulse" />
                            <span>Em Desenvolvimento</span>
                        </div>

                        {/* Title */}
                        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4">
                            App Nativo em Breve!
                        </h2>

                        {/* Description */}
                        <p className="text-white/90 text-base sm:text-lg max-w-2xl mx-auto mb-8">
                            Estamos trabalhando em um aplicativo nativo para <span className="font-semibold">Android</span> e <span className="font-semibold">iOS</span>.
                            Em breve você poderá estudar para sua CNH de forma ainda mais prática, diretamente do seu smartphone!
                        </p>

                        {/* Store icons */}
                        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
                            {/* App Store */}
                            <div className="group flex items-center gap-3 bg-black/80 hover:bg-black rounded-xl px-5 py-3 transition-all duration-300 hover:scale-105 cursor-default shadow-lg">
                                <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                                </svg>
                                <div className="text-left">
                                    <div className="text-[10px] text-white/70 leading-tight">Em breve na</div>
                                    <div className="text-base font-semibold text-white leading-tight">App Store</div>
                                </div>
                            </div>

                            {/* Google Play */}
                            <div className="group flex items-center gap-3 bg-black/80 hover:bg-black rounded-xl px-5 py-3 transition-all duration-300 hover:scale-105 cursor-default shadow-lg">
                                <svg className="w-8 h-8" viewBox="0 0 24 24">
                                    <path fill="#EA4335" d="M3.609 1.814a1.986 1.986 0 00-.479 1.363V20.82c0 .517.18.96.479 1.363l.073.065 10.66-10.672v-.252L3.682 1.749l-.073.065z" />
                                    <path fill="#FBBC04" d="M17.893 15.103l-3.551-3.555v-.252l3.551-3.555.08.046 4.21 2.393c1.201.683 1.201 1.8 0 2.483l-4.21 2.393-.08.047z" />
                                    <path fill="#4285F4" d="M17.973 15.057L14.342 11.4 3.609 22.184c.396.419 1.05.443 1.79.026l12.574-7.153" />
                                    <path fill="#34A853" d="M17.973 7.741L5.399 .588c-.74-.417-1.394-.393-1.79.026L14.342 11.4l3.631-3.66z" />
                                </svg>
                                <div className="text-left">
                                    <div className="text-[10px] text-white/70 leading-tight">Em breve no</div>
                                    <div className="text-base font-semibold text-white leading-tight">Google Play</div>
                                </div>
                            </div>
                        </div>

                        {/* PWA instructions */}
                        <div className="mt-8 p-4 bg-white/10 backdrop-blur-sm rounded-xl">
                            <p className="text-white font-medium mb-2">
                                💡 Dica: Instale o app no seu celular agora mesmo!
                            </p>
                            <p className="text-white/80 text-sm">
                                Acesse <span className="font-semibold">vrumi.com.br</span> pelo navegador do seu celular,
                                toque em <span className="font-semibold">"Adicionar à tela inicial"</span> e tenha o Vrumi
                                funcionando como um app nativo, com acesso offline e notificações!
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default AppComingSoon;
