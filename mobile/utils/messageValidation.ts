// Função de validação de mensagem para aplicar Particionamento de Equivalência
export type ViolationResult = {
    hasViolation: boolean;
    severity: 'low' | 'medium' | 'high' | null;
    detectedWords: string[];
};

const PROFANITY_WORDS = ['palavrão1', 'palavrão2', 'spam'];
const SUSPICIOUS_PATTERNS = /(\d{10,}|www\.|http|whatsapp|telegram)/i;

export function validateMessage(text: string): ViolationResult {
    if (!text || text.trim().length === 0) {
        return { hasViolation: false, severity: null, detectedWords: [] };
    }

    const lowercaseText = text.toLowerCase();
    const detectedWords: string[] = [];
    let maxSeverity: 'low' | 'medium' | 'high' | null = null;

    // Detectar palavrões
    for (const word of PROFANITY_WORDS) {
        if (lowercaseText.includes(word)) {
            detectedWords.push(word);
            maxSeverity = 'medium';
        }
    }

    // Detectar padrões suspeitos (telefone, links)
    if (SUSPICIOUS_PATTERNS.test(text)) {
        maxSeverity = 'high';
    }

    return {
        hasViolation: detectedWords.length > 0 || maxSeverity !== null,
        severity: maxSeverity,
        detectedWords
    };
}
