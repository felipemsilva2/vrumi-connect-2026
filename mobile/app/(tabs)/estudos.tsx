import { useEffect } from 'react';
import { router } from 'expo-router';

export default function EstudosScreen() {
    useEffect(() => {
        // Redirect to study room immediately
        router.replace('/study-room');
    }, []);

    // Return null while redirecting
    return null;
}
