/**
 * Greeting utilities for time-based personalization
 */

/**
 * Returns time-appropriate greeting based on current hour
 * - 00:00 - 11:59: "Bom dia"
 * - 12:00 - 17:59: "Boa tarde"  
 * - 18:00 - 23:59: "Boa noite"
 */
export const getTimeBasedGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
};

/**
 * Returns full greeting with user's first name
 * @param fullName User's full name (will extract first name)
 * @returns Personalized greeting like "Bom dia, João"
 */
export const getPersonalizedGreeting = (fullName?: string | null): string => {
    const firstName = fullName?.split(' ')[0] || 'Motorista';
    const greeting = getTimeBasedGreeting();
    return `${greeting}, ${firstName}`;
};
