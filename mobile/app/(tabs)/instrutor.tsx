import { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../src/lib/supabase';
import InstructorLandingView from '../../components/InstructorLandingView';
import InstructorOnboardingView from '../../components/InstructorOnboardingView';
import InstructorDashboardView from '../../components/InstructorDashboardView';

export default function InstrutorTab() {
    const { theme } = useTheme();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [instructorId, setInstructorId] = useState<string | null>(null);
    const [instructorStatus, setInstructorStatus] = useState<string | null>(null);

    const checkStatus = useCallback(async () => {
        if (!user?.id) return;

        try {
            const { data: instructor, error } = await supabase
                .from('instructors')
                .select('id, status')
                .eq('user_id', user.id)
                .single();

            if (error || !instructor) {
                setInstructorId(null);
                setInstructorStatus(null);
                return;
            }
            setInstructorId(instructor.id);
            setInstructorStatus(instructor.status);

        } catch (error) {
            console.error('Error fetching status:', error);
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    useEffect(() => {
        checkStatus();
    }, [checkStatus]);

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.primary} />
                </View>
            </SafeAreaView>
        );
    }

    // 1. Not an instructor (or not found) -> Landing Page (Become Instructor)
    if (!instructorId) {
        return <InstructorLandingView />;
    }

    // 2. Pending or Suspended -> Onboarding/Checklist
    // We explicitly check for 'pending' to show the checklist.
    if (instructorStatus === 'pending' || instructorStatus === 'suspended') {
        return <InstructorOnboardingView />;
    }

    // 3. Approved -> Full Dashboard
    return <InstructorDashboardView />;
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
