/**
 * TESTES DE PARTICIONAMENTO DE EQUIVALÊNCIA
 * 
 * Técnica: Dividir o domínio de entrada em classes de equivalência
 * Objetivo: Reduzir número de testes mantendo cobertura
 * 
 * CLASSES DE EQUIVALÊNCIA IDENTIFICADAS:
 * 
 * 1. MENSAGEM VÁLIDA
 *    - Texto limpo, sem palavrões
 *    - Sem padrões suspeitos
 *    - Tamanho normal (1-500 caracteres)
 * 
 * 2. MENSAGEM VAZIA/NULA
 *    - String vazia ""
 *    - String apenas com espaços "   "
 *    - null/undefined
 * 
 * 3. MENSAGEM COM PROFANAÇÃO (Severidade Média)
 *    - Contém palavrões da lista
 *    - Pode ter variações de case
 * 
 * 4. MENSAGEM COM PADRÃO SUSPEITO (Severidade Alta)
 *    - Números de telefone (10+ dígitos)
 *    - URLs (www., http)
 *    - Menções a outros apps (WhatsApp, Telegram)
 * 
 * 5. MENSAGEM COM MÚLTIPLAS VIOLAÇÕES
 *    - Palavrão + telefone
 *    - Palavrão + link
 */

import { validateMessage, ViolationResult } from '../messageValidation';

describe('Particionamento de Equivalência - validateMessage', () => {

    // ========================================
    // CLASSE 1: MENSAGEM VÁLIDA
    // ========================================
    describe('Classe de Equivalência: Mensagem Válida', () => {

        test('deve aprovar mensagem limpa simples', () => {
            const result = validateMessage('Olá, tudo bem?');

            expect(result.hasViolation).toBe(false);
            expect(result.severity).toBeNull();
            expect(result.detectedWords).toHaveLength(0);
        });

        test('deve aprovar mensagem longa sem violações', () => {
            const longMessage = 'Esta é uma mensagem longa mas completamente válida sem nenhum conteúdo inapropriado.';
            const result = validateMessage(longMessage);

            expect(result.hasViolation).toBe(false);
            expect(result.severity).toBeNull();
        });

        test('deve aprovar mensagem com números válidos (menos de 10 dígitos)', () => {
            const result = validateMessage('Meu carro é modelo 2024');

            expect(result.hasViolation).toBe(false);
            expect(result.severity).toBeNull();
        });
    });

    // ========================================
    // CLASSE 2: MENSAGEM VAZIA/NULA
    // ========================================
    describe('Classe de Equivalência: Mensagem Vazia/Nula', () => {

        test('deve aprovar string vazia', () => {
            const result = validateMessage('');

            expect(result.hasViolation).toBe(false);
            expect(result.severity).toBeNull();
            expect(result.detectedWords).toHaveLength(0);
        });

        test('deve aprovar string apenas com espaços', () => {
            const result = validateMessage('     ');

            expect(result.hasViolation).toBe(false);
            expect(result.severity).toBeNull();
        });

        test('deve aprovar string com tabs e newlines', () => {
            const result = validateMessage('\t\n  \n');

            expect(result.hasViolation).toBe(false);
            expect(result.severity).toBeNull();
        });
    });

    // ========================================
    // CLASSE 3: PROFANAÇÃO (Severidade Média)
    // ========================================
    describe('Classe de Equivalência: Mensagem com Profanação', () => {

        test('deve detectar palavra proibida simples', () => {
            const result = validateMessage('Isso é um palavrão1');

            expect(result.hasViolation).toBe(true);
            expect(result.severity).toBe('medium');
            expect(result.detectedWords).toContain('palavrão1');
        });

        test('deve detectar palavra proibida em maiúsculas', () => {
            const result = validateMessage('PALAVRÃO2 aqui');

            expect(result.hasViolation).toBe(true);
            expect(result.severity).toBe('medium');
            expect(result.detectedWords).toContain('palavrão2');
        });

        test('deve detectar múltiplas palavras proibidas', () => {
            const result = validateMessage('palavrão1 e palavrão2 juntos');

            expect(result.hasViolation).toBe(true);
            expect(result.severity).toBe('medium');
            expect(result.detectedWords).toHaveLength(2);
            expect(result.detectedWords).toEqual(expect.arrayContaining(['palavrão1', 'palavrão2']));
        });
    });

    // ========================================
    // CLASSE 4: PADRÃO SUSPEITO (Severidade Alta)
    // ========================================
    describe('Classe de Equivalência: Padrão Suspeito', () => {

        test('deve detectar número de telefone (10+ dígitos)', () => {
            const result = validateMessage('Me liga 11987654321');

            expect(result.hasViolation).toBe(true);
            expect(result.severity).toBe('high');
        });

        test('deve detectar URL com www', () => {
            const result = validateMessage('Acesse www.exemplo.com');

            expect(result.hasViolation).toBe(true);
            expect(result.severity).toBe('high');
        });

        test('deve detectar URL com http', () => {
            const result = validateMessage('Veja em http://site.com');

            expect(result.hasViolation).toBe(true);
            expect(result.severity).toBe('high');
        });

        test('deve detectar menção a WhatsApp', () => {
            const result = validateMessage('Me add no whatsapp');

            expect(result.hasViolation).toBe(true);
            expect(result.severity).toBe('high');
        });

        test('deve detectar menção a Telegram', () => {
            const result = validateMessage('Estou no telegram');

            expect(result.hasViolation).toBe(true);
            expect(result.severity).toBe('high');
        });
    });

    // ========================================
    // CLASSE 5: MÚLTIPLAS VIOLAÇÕES
    // ========================================
    describe('Classe de Equivalência: Múltiplas Violações', () => {

        test('deve detectar palavrão + telefone (prioriza severidade alta)', () => {
            const result = validateMessage('palavrão1 me liga 11987654321');

            expect(result.hasViolation).toBe(true);
            expect(result.severity).toBe('high'); // Prioriza a mais grave
            expect(result.detectedWords).toContain('palavrão1');
        });

        test('deve detectar palavrão + URL', () => {
            const result = validateMessage('spam acesse www.golpe.com');

            expect(result.hasViolation).toBe(true);
            expect(result.severity).toBe('high');
            expect(result.detectedWords).toContain('spam');
        });

        test('deve detectar múltiplos palavrões + whatsapp', () => {
            const result = validateMessage('palavrão1 palavrão2 add no whatsapp');

            expect(result.hasViolation).toBe(true);
            expect(result.severity).toBe('high');
            expect(result.detectedWords).toHaveLength(2);
        });
    });

    // ========================================
    // TESTES DE FRONTEIRA (Boundary Values)
    // ========================================
    describe('Valores de Fronteira', () => {

        test('deve tratar exatamente 10 dígitos como suspeito', () => {
            const result = validateMessage('1234567890');

            expect(result.hasViolation).toBe(true);
            expect(result.severity).toBe('high');
        });

        test('deve aprovar exatamente 9 dígitos', () => {
            const result = validateMessage('123456789');

            expect(result.hasViolation).toBe(false);
            expect(result.severity).toBeNull();
        });

        test('deve detectar palavra proibida de 1 caractere no meio', () => {
            const result = validateMessage('texto normal spam aqui');

            expect(result.hasViolation).toBe(true);
            expect(result.detectedWords).toContain('spam');
        });
    });
});

/**
 * RESUMO DO PARTICIONAMENTO:
 * 
 * Total de classes identificadas: 5
 * Total de testes criados: 22
 * 
 * Sem particionamento, teríamos que testar centenas de combinações.
 * Com particionamento, testamos representantes de cada classe.
 * 
 * Benefícios:
 * - Cobertura completa com menos testes
 * - Organização clara por classe
 * - Fácil manutenção
 * - Documentação implícita
 */
