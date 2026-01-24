import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useConsent } from '../hooks/useConsent';
import { useTheme } from '../contexts/ThemeContext';
import TermsAcceptanceScreen from '../components/TermsAcceptanceScreen';

interface ConsentGateProps {
    children: React.ReactNode;
}

/**
 * ConsentGate - Wrapper component that ensures users have accepted required terms
 * before accessing the app. Shows TermsAcceptanceScreen if consent is missing.
 */
export default function ConsentGate({ children }: ConsentGateProps) {
    const { user, loading: authLoading } = useAuth();
    const { needsConsent, loading: consentLoading, refresh } = useConsent();
    const { theme } = useTheme();
    const [showTerms, setShowTerms] = useState(false);

    useEffect(() => {
        // Only check consent if user is authenticated and consent data is loaded
        if (!authLoading && !consentLoading && user) {
            setShowTerms(needsConsent);
        }
    }, [user, authLoading, consentLoading, needsConsent]);

    // Handle consent completion
    const handleConsentComplete = async () => {
        // Refresh consent data
        await refresh();
        setShowTerms(false);
    };

    // Show loading while checking auth and consent status
    if (authLoading || consentLoading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
                <ActivityIndicator size="large" color={theme.primary} />
            </View>
        );
    }

    // Show terms acceptance screen if user needs to provide consent
    if (user && showTerms) {
        return <TermsAcceptanceScreen onComplete={handleConsentComplete} />;
    }

    // User has valid consent or is not authenticated - show children
    return <>{children}</>;
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
