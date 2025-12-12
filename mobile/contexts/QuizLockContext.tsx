import React, { createContext, useContext, useState, useRef, ReactNode } from 'react';
import { Alert } from 'react-native';

interface QuizLockContextType {
    isQuizActive: boolean;
    setQuizActive: (active: boolean) => void;
    showExitConfirmation: (onConfirm: () => void) => void;
    registerResetCallback: (callback: () => void) => void;
}

const QuizLockContext = createContext<QuizLockContextType | undefined>(undefined);

export function QuizLockProvider({ children }: { children: ReactNode }) {
    const [isQuizActive, setIsQuizActive] = useState(false);
    const resetCallbackRef = useRef<(() => void) | null>(null);

    const setQuizActive = (active: boolean) => {
        setIsQuizActive(active);
    };

    const registerResetCallback = (callback: () => void) => {
        resetCallbackRef.current = callback;
    };

    const showExitConfirmation = (onConfirm: () => void) => {
        Alert.alert(
            'Sair do Simulado?',
            'Você tem um simulado em andamento. Se sair agora, todo seu progresso será perdido.',
            [
                { text: 'Continuar Prova', style: 'cancel' },
                {
                    text: 'Sair e Perder Progresso',
                    style: 'destructive',
                    onPress: () => {
                        // Reset the quiz state via callback
                        if (resetCallbackRef.current) {
                            resetCallbackRef.current();
                        }
                        // Disable the lock
                        setIsQuizActive(false);
                        // Navigate after a short delay
                        setTimeout(() => {
                            onConfirm();
                        }, 50);
                    }
                }
            ]
        );
    };

    return (
        <QuizLockContext.Provider value={{ isQuizActive, setQuizActive, showExitConfirmation, registerResetCallback }}>
            {children}
        </QuizLockContext.Provider>
    );
}

export function useQuizLock() {
    const context = useContext(QuizLockContext);
    if (context === undefined) {
        throw new Error('useQuizLock must be used within a QuizLockProvider');
    }
    return context;
}

