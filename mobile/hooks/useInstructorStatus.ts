import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../src/lib/supabase';

export type InstructorStatus = 'none' | 'pending' | 'approved' | 'rejected';

interface InstructorInfo {
    id: string;
    status: InstructorStatus;
    full_name: string;
    photo_url: string | null;
}

interface UseInstructorStatusReturn {
    isInstructor: boolean;
    instructorStatus: InstructorStatus;
    instructorInfo: InstructorInfo | null;
    loading: boolean;
    refresh: () => Promise<void>;
}

export function useInstructorStatus(): UseInstructorStatusReturn {
    const { user } = useAuth();
    const [instructorInfo, setInstructorInfo] = useState<InstructorInfo | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchInstructorStatus = useCallback(async () => {
        if (!user?.id) {
            setInstructorInfo(null);
            setLoading(false);
            return;
        }

        try {
            const { data, error } = await supabase
                .from('instructors')
                .select('id, status, full_name, photo_url')
                .eq('user_id', user.id)
                .single();

            if (error) {
                // No instructor record found
                setInstructorInfo(null);
            } else {
                setInstructorInfo({
                    id: data.id,
                    status: data.status as InstructorStatus,
                    full_name: data.full_name,
                    photo_url: data.photo_url,
                });
            }
        } catch (error) {
            console.error('Error fetching instructor status:', error);
            setInstructorInfo(null);
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    useEffect(() => {
        fetchInstructorStatus();
    }, [fetchInstructorStatus]);

    const isInstructor = instructorInfo?.status === 'approved';
    const instructorStatus: InstructorStatus = instructorInfo?.status || 'none';

    return {
        isInstructor,
        instructorStatus,
        instructorInfo,
        loading,
        refresh: fetchInstructorStatus,
    };
}
