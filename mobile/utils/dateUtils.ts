export const isLessonExpired = (
    scheduledDate: string,
    scheduledTime: string,
    toleranceMinutes: number = 30
): boolean => {
    try {
        // Construct the full scheduled date object
        // scheduledDate is typically YYYY-MM-DD
        // scheduledTime is typically HH:mm:ss or HH:mm
        const dateStr = scheduledDate.split('T')[0]; // Ensure we just have the date part
        const timeStr = scheduledTime.includes('T')
            ? scheduledTime.split('T')[1].substring(0, 5)
            : scheduledTime.substring(0, 5);

        const scheduledDateTime = new Date(`${dateStr}T${timeStr}:00`);

        // Add tolerance
        const expirationTime = new Date(scheduledDateTime.getTime() + toleranceMinutes * 60000);

        const now = new Date();

        return now > expirationTime;
    } catch (error) {
        console.error('Error checking lesson expiration:', error);
        return false; // Fail safe: don't hide if error
    }
}


export const isCheckInAvailable = (
    scheduledDate: string,
    scheduledTime: string,
    durationMinutes: number = 50 // Default lesson duration
): { available: boolean; reason: 'too_early' | 'too_late' | 'available' } => {
    try {
        const dateStr = scheduledDate.split('T')[0];
        const timeStr = scheduledTime.includes('T')
            ? scheduledTime.split('T')[1].substring(0, 5)
            : scheduledTime.substring(0, 5);

        const scheduledStart = new Date(`${dateStr}T${timeStr}:00`);

        // Window starts 15 minutes before
        const windowStart = new Date(scheduledStart.getTime() - 15 * 60000);

        // Window ends 30 minutes after start (tolerance) - OR should it be based on end time?
        // User said: "Fecha: 30 minutos após o horário agendado (tolerância)." 
        // This implies 30 min after START time, not end time, based on previous "tolerance" context.
        // But usually check-in is for attendance.
        // Let's stick to "30 minutes after scheduled time" as per approval.
        const windowEnd = new Date(scheduledStart.getTime() + 30 * 60000);

        const now = new Date();

        if (now < windowStart) return { available: false, reason: 'too_early' };
        if (now > windowEnd) return { available: false, reason: 'too_late' };

        return { available: true, reason: 'available' };
    } catch (error) {
        console.error('Error checking check-in availability:', error);
        return { available: false, reason: 'too_late' }; // Fail safe
    }
};

export const formatLessonDate = (dateStr: string, timeStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    const formattedDate = date.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' });
    const formattedTime = timeStr.substring(0, 5);
    return `${formattedDate} às ${formattedTime}`;
};
