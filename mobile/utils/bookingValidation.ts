// Função para validação de agendamento - aplicar Análise de Valor Limite
export interface BookingData {
    duration: number; // Duração em minutos
    advanceNotice: number; // Horas de antecedência
    studentAge: number; // Idade do aluno
    packageSize: number; // Quantidade de aulas no pacote
}

export interface BookingValidation {
    isValid: boolean;
    errors: string[];
}

const LIMITS = {
    MIN_DURATION: 30,
    MAX_DURATION: 180,
    MIN_ADVANCE_HOURS: 2,
    MAX_ADVANCE_HOURS: 720, // 30 dias
    MIN_AGE: 18,
    MAX_AGE: 100,
    MIN_PACKAGE_SIZE: 1,
    MAX_PACKAGE_SIZE: 50,
};

export function validateBooking(data: BookingData): BookingValidation {
    const errors: string[] = [];

    // Validar duração
    if (data.duration < LIMITS.MIN_DURATION) {
        errors.push(`Duração mínima: ${LIMITS.MIN_DURATION} minutos`);
    }
    if (data.duration > LIMITS.MAX_DURATION) {
        errors.push(`Duração máxima: ${LIMITS.MAX_DURATION} minutos`);
    }

    // Validar antecedência
    if (data.advanceNotice < LIMITS.MIN_ADVANCE_HOURS) {
        errors.push(`Agendar com mínimo ${LIMITS.MIN_ADVANCE_HOURS}h de antecedência`);
    }
    if (data.advanceNotice > LIMITS.MAX_ADVANCE_HOURS) {
        errors.push(`Agendar com máximo ${LIMITS.MAX_ADVANCE_HOURS}h de antecedência`);
    }

    // Validar idade
    if (data.studentAge < LIMITS.MIN_AGE) {
        errors.push(`Idade mínima: ${LIMITS.MIN_AGE} anos`);
    }
    if (data.studentAge > LIMITS.MAX_AGE) {
        errors.push(`Idade máxima: ${LIMITS.MAX_AGE} anos`);
    }

    // Validar tamanho do pacote
    if (data.packageSize < LIMITS.MIN_PACKAGE_SIZE) {
        errors.push(`Mínimo ${LIMITS.MIN_PACKAGE_SIZE} aula por pacote`);
    }
    if (data.packageSize > LIMITS.MAX_PACKAGE_SIZE) {
        errors.push(`Máximo ${LIMITS.MAX_PACKAGE_SIZE} aulas por pacote`);
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
}

export { LIMITS };
