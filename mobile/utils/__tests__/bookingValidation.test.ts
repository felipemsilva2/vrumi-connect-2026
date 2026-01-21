/**
 * TESTES DE ANÁLISE DE VALOR LIMITE (Boundary Value Analysis)
 * 
 * Técnica: Testar nos limites exatos onde o comportamento muda
 * Objetivo: Encontrar bugs que ocorrem nas fronteiras
 * 
 * LIMITES IDENTIFICADOS:
 * 
 * 1. DURAÇÃO (30-180 minutos)
 *    - Mínimo: 30
 *    - Máximo: 180
 *    - Boundary: 29, 30, 31 | 179, 180, 181
 * 
 * 2. ANTECEDÊNCIA (2-720 horas)
 *    - Mínimo: 2h
 *    - Máximo: 720h (30 dias)
 *    - Boundary: 1, 2, 3 | 719, 720, 721
 * 
 * 3. IDADE (18-100 anos)
 *    - Mínimo: 18
 *    - Máximo: 100
 *    - Boundary: 17, 18, 19 | 99, 100, 101
 * 
 * 4. TAMANHO PACOTE (1-50 aulas)
 *    - Mínimo: 1
 *    - Máximo: 50
 *    - Boundary: 0, 1, 2 | 49, 50, 51
 */

import { validateBooking, LIMITS, BookingData } from '../bookingValidation';

describe('Análise de Valor Limite - validateBooking', () => {

    // Helper para criar booking válido base
    const createValidBooking = (): BookingData => ({
        duration: 60,
        advanceNotice: 24,
        studentAge: 25,
        packageSize: 10,
    });

    // ========================================
    // LIMITE 1: DURAÇÃO (30-180 minutos)
    // ========================================
    describe('Limite: Duração da Aula', () => {

        test('deve REJEITAR duração ABAIXO do mínimo (29 min)', () => {
            const booking = { ...createValidBooking(), duration: 29 };
            const result = validateBooking(booking);

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain(`Duração mínima: ${LIMITS.MIN_DURATION} minutos`);
        });

        test('deve ACEITAR duração EXATAMENTE no mínimo (30 min)', () => {
            const booking = { ...createValidBooking(), duration: 30 };
            const result = validateBooking(booking);

            // Não deve ter erro de duração mínima
            expect(result.errors).not.toContain(`Duração mínima: ${LIMITS.MIN_DURATION} minutos`);
        });

        test('deve ACEITAR duração LOGO ACIMA do mínimo (31 min)', () => {
            const booking = { ...createValidBooking(), duration: 31 };
            const result = validateBooking(booking);

            expect(result.errors).not.toContain(`Duração mínima: ${LIMITS.MIN_DURATION} minutos`);
        });

        test('deve ACEITAR duração LOGO ABAIXO do máximo (179 min)', () => {
            const booking = { ...createValidBooking(), duration: 179 };
            const result = validateBooking(booking);

            expect(result.errors).not.toContain(`Duração máxima: ${LIMITS.MAX_DURATION} minutos`);
        });

        test('deve ACEITAR duração EXATAMENTE no máximo (180 min)', () => {
            const booking = { ...createValidBooking(), duration: 180 };
            const result = validateBooking(booking);

            expect(result.errors).not.toContain(`Duração máxima: ${LIMITS.MAX_DURATION} minutos`);
        });

        test('deve REJEITAR duração ACIMA do máximo (181 min)', () => {
            const booking = { ...createValidBooking(), duration: 181 };
            const result = validateBooking(booking);

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain(`Duração máxima: ${LIMITS.MAX_DURATION} minutos`);
        });
    });

    // ========================================
    // LIMITE 2: ANTECEDÊNCIA (2-720 horas)
    // ========================================
    describe('Limite: Antecedência do Agendamento', () => {

        test('deve REJEITAR antecedência ABAIXO do mínimo (1h)', () => {
            const booking = { ...createValidBooking(), advanceNotice: 1 };
            const result = validateBooking(booking);

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain(`Agendar com mínimo ${LIMITS.MIN_ADVANCE_HOURS}h de antecedência`);
        });

        test('deve ACEITAR antecedência EXATAMENTE no mínimo (2h)', () => {
            const booking = { ...createValidBooking(), advanceNotice: 2 };
            const result = validateBooking(booking);

            expect(result.errors).not.toContain(`Agendar com mínimo ${LIMITS.MIN_ADVANCE_HOURS}h de antecedência`);
        });

        test('deve ACEITAR antecedência LOGO ACIMA do mínimo (3h)', () => {
            const booking = { ...createValidBooking(), advanceNotice: 3 };
            const result = validateBooking(booking);

            expect(result.errors).not.toContain(`Agendar com mínimo ${LIMITS.MIN_ADVANCE_HOURS}h de antecedência`);
        });

        test('deve ACEITAR antecedência LOGO ABAIXO do máximo (719h)', () => {
            const booking = { ...createValidBooking(), advanceNotice: 719 };
            const result = validateBooking(booking);

            expect(result.errors).not.toContain(`Agendar com máximo ${LIMITS.MAX_ADVANCE_HOURS}h de antecedência`);
        });

        test('deve ACEITAR antecedência EXATAMENTE no máximo (720h)', () => {
            const booking = { ...createValidBooking(), advanceNotice: 720 };
            const result = validateBooking(booking);

            expect(result.errors).not.toContain(`Agendar com máximo ${LIMITS.MAX_ADVANCE_HOURS}h de antecedência`);
        });

        test('deve REJEITAR antecedência ACIMA do máximo (721h)', () => {
            const booking = { ...createValidBooking(), advanceNotice: 721 };
            const result = validateBooking(booking);

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain(`Agendar com máximo ${LIMITS.MAX_ADVANCE_HOURS}h de antecedência`);
        });
    });

    // ========================================
    // LIMITE 3: IDADE DO ALUNO (18-100 anos)
    // ========================================
    describe('Limite: Idade do Aluno', () => {

        test('deve REJEITAR idade ABAIXO do mínimo (17 anos)', () => {
            const booking = { ...createValidBooking(), studentAge: 17 };
            const result = validateBooking(booking);

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain(`Idade mínima: ${LIMITS.MIN_AGE} anos`);
        });

        test('deve ACEITAR idade EXATAMENTE no mínimo (18 anos)', () => {
            const booking = { ...createValidBooking(), studentAge: 18 };
            const result = validateBooking(booking);

            expect(result.errors).not.toContain(`Idade mínima: ${LIMITS.MIN_AGE} anos`);
        });

        test('deve ACEITAR idade LOGO ACIMA do mínimo (19 anos)', () => {
            const booking = { ...createValidBooking(), studentAge: 19 };
            const result = validateBooking(booking);

            expect(result.errors).not.toContain(`Idade mínima: ${LIMITS.MIN_AGE} anos`);
        });

        test('deve ACEITAR idade LOGO ABAIXO do máximo (99 anos)', () => {
            const booking = { ...createValidBooking(), studentAge: 99 };
            const result = validateBooking(booking);

            expect(result.errors).not.toContain(`Idade máxima: ${LIMITS.MAX_AGE} anos`);
        });

        test('deve ACEITAR idade EXATAMENTE no máximo (100 anos)', () => {
            const booking = { ...createValidBooking(), studentAge: 100 };
            const result = validateBooking(booking);

            expect(result.errors).not.toContain(`Idade máxima: ${LIMITS.MAX_AGE} anos`);
        });

        test('deve REJEITAR idade ACIMA do máximo (101 anos)', () => {
            const booking = { ...createValidBooking(), studentAge: 101 };
            const result = validateBooking(booking);

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain(`Idade máxima: ${LIMITS.MAX_AGE} anos`);
        });
    });

    // ========================================
    // LIMITE 4: TAMANHO DO PACOTE (1-50 aulas)
    // ========================================
    describe('Limite: Tamanho do Pacote de Aulas', () => {

        test('deve REJEITAR pacote ABAIXO do mínimo (0 aulas)', () => {
            const booking = { ...createValidBooking(), packageSize: 0 };
            const result = validateBooking(booking);

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain(`Mínimo ${LIMITS.MIN_PACKAGE_SIZE} aula por pacote`);
        });

        test('deve ACEITAR pacote EXATAMENTE no mínimo (1 aula)', () => {
            const booking = { ...createValidBooking(), packageSize: 1 };
            const result = validateBooking(booking);

            expect(result.errors).not.toContain(`Mínimo ${LIMITS.MIN_PACKAGE_SIZE} aula por pacote`);
        });

        test('deve ACEITAR pacote LOGO ACIMA do mínimo (2 aulas)', () => {
            const booking = { ...createValidBooking(), packageSize: 2 };
            const result = validateBooking(booking);

            expect(result.errors).not.toContain(`Mínimo ${LIMITS.MIN_PACKAGE_SIZE} aula por pacote`);
        });

        test('deve ACEITAR pacote LOGO ABAIXO do máximo (49 aulas)', () => {
            const booking = { ...createValidBooking(), packageSize: 49 };
            const result = validateBooking(booking);

            expect(result.errors).not.toContain(`Máximo ${LIMITS.MAX_PACKAGE_SIZE} aulas por pacote`);
        });

        test('deve ACEITAR pacote EXATAMENTE no máximo (50 aulas)', () => {
            const booking = { ...createValidBooking(), packageSize: 50 };
            const result = validateBooking(booking);

            expect(result.errors).not.toContain(`Máximo ${LIMITS.MAX_PACKAGE_SIZE} aulas por pacote`);
        });

        test('deve REJEITAR pacote ACIMA do máximo (51 aulas)', () => {
            const booking = { ...createValidBooking(), packageSize: 51 };
            const result = validateBooking(booking);

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain(`Máximo ${LIMITS.MAX_PACKAGE_SIZE} aulas por pacote`);
        });
    });

    // ========================================
    // TESTES DE MÚLTIPLOS LIMITES VIOLADOS
    // ========================================
    describe('Múltiplos Limites Violados', () => {

        test('deve detectar TODOS os erros quando múltiplos limites violados', () => {
            const booking: BookingData = {
                duration: 200, // Acima do máximo
                advanceNotice: 1, // Abaixo do mínimo
                studentAge: 16, // Abaixo do mínimo
                packageSize: 60, // Acima do máximo
            };

            const result = validateBooking(booking);

            expect(result.isValid).toBe(false);
            expect(result.errors).toHaveLength(4);
            expect(result.errors).toContain(`Duração máxima: ${LIMITS.MAX_DURATION} minutos`);
            expect(result.errors).toContain(`Agendar com mínimo ${LIMITS.MIN_ADVANCE_HOURS}h de antecedência`);
            expect(result.errors).toContain(`Idade mínima: ${LIMITS.MIN_AGE} anos`);
            expect(result.errors).toContain(`Máximo ${LIMITS.MAX_PACKAGE_SIZE} aulas por pacote`);
        });

        test('deve ACEITAR quando TODOS os valores estão dentro dos limites', () => {
            const booking: BookingData = {
                duration: 60, // Entre 30-180
                advanceNotice: 24, // Entre 2-720
                studentAge: 30, // Entre 18-100
                packageSize: 10, // Entre 1-50
            };

            const result = validateBooking(booking);

            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });
    });

    // ========================================
    // TESTES DE VALORES EXTREMOS (Edge Cases)
    // ========================================
    describe('Valores Extremos e Edge Cases', () => {

        test('deve lidar com valores negativos corretamente', () => {
            const booking = { ...createValidBooking(), duration: -10 };
            const result = validateBooking(booking);

            expect(result.isValid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
        });

        test('deve lidar com zero em todos os campos', () => {
            const booking: BookingData = {
                duration: 0,
                advanceNotice: 0,
                studentAge: 0,
                packageSize: 0,
            };

            const result = validateBooking(booking);

            expect(result.isValid).toBe(false);
            expect(result.errors).toHaveLength(4);
        });

        test('deve lidar com valores muito grandes', () => {
            const booking: BookingData = {
                duration: 999999,
                advanceNotice: 999999,
                studentAge: 999999,
                packageSize: 999999,
            };

            const result = validateBooking(booking);

            expect(result.isValid).toBe(false);
            expect(result.errors).toHaveLength(4);
        });
    });
});

/**
 * RESUMO DA ANÁLISE DE VALOR LIMITE:
 * 
 * Total de testes: 31
 * Limites testados: 4 (cada com min/max)
 * Valores por limite: 6 (below, at, above para min e max)
 * 
 * Padrão BVA aplicado:
 * - Valor ABAIXO do mínimo (inválido)
 * - Valor EXATAMENTE no mínimo (válido)
 * - Valor LOGO ACIMA do mínimo (válido)
 * - Valor LOGO ABAIXO do máximo (válido)
 * - Valor EXATAMENTE no máximo (válido)
 * - Valor ACIMA do máximo (inválido)
 * 
 * Benefícios:
 * - Detecta off-by-one errors
 * - Valida limites inclusive/exclusive
 * - Cobre edge cases sistemicamente
 * - Complementa particionamento de equivalência
 */
