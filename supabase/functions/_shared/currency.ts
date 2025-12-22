// Currency conversion helpers for Vrumi Connect
// Stripe uses cents, database uses reais (decimal)

/**
 * Convert reais (decimal) to centavos (integer)
 * Example: 150.00 -> 15000
 */
export function reaisToCents(reais: number): number {
    return Math.round(reais * 100);
}

/**
 * Convert centavos (integer) to reais (decimal)
 * Example: 15000 -> 150.00
 */
export function centsToReais(cents: number): number {
    return cents / 100;
}

/**
 * Format reais value as BRL currency string
 * Example: 150.00 -> "R$ 150,00"
 */
export function formatBRL(reais: number): string {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(reais);
}

/**
 * Calculate platform fee in cents
 * @param totalCents - Total amount in cents
 * @param feePercentage - Fee as decimal (e.g., 0.15 for 15%)
 */
export function calculatePlatformFee(totalCents: number, feePercentage: number = 0.15): number {
    return Math.round(totalCents * feePercentage);
}

/**
 * Calculate instructor amount after platform fee
 */
export function calculateInstructorAmount(totalCents: number, feePercentage: number = 0.15): number {
    const fee = calculatePlatformFee(totalCents, feePercentage);
    return totalCents - fee;
}
