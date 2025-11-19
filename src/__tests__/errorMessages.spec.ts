import { describe, it, expect } from 'vitest';
import { getErrorMessage } from '@/utils/errorMessages';

describe('getErrorMessage', () => {
  it('mapa invalid_credentials corretamente via code', () => {
    const msg = getErrorMessage({ code: 'invalid_credentials' });
    expect(msg.title).toBe('Credenciais Inválidas');
    expect(msg.message).toContain('Email ou senha incorretos');
  });

  it('mapa email_already_in_use corretamente via code', () => {
    const msg = getErrorMessage({ code: 'email_already_in_use' });
    expect(msg.title).toBe('Email Já Cadastrado');
  });

  it('fallback por message contendo invalid credentials', () => {
    const msg = getErrorMessage({ message: 'Invalid credentials provided' });
    expect(msg.title).toBe('Credenciais Inválidas');
  });

  it('default quando sem code/message', () => {
    const msg = getErrorMessage({});
    expect(msg.title).toBe('Erro');
  });
});