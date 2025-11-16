export interface ErrorMessage {
  title: string;
  message: string;
}

const AUTH_ERRORS: Record<string, ErrorMessage> = {
  'invalid_credentials': {
    title: 'Credenciais Inválidas',
    message: 'Email ou senha incorretos. Por favor, verifique suas credenciais.',
  },
  'invalid_email': {
    title: 'Email Inválido',
    message: 'O email fornecido não é válido.',
  },
  'user_not_found': {
    title: 'Usuário Não Encontrado',
    message: 'Não encontramos uma conta com este email.',
  },
  'email_already_in_use': {
    title: 'Email Já Cadastrado',
    message: 'Este email já está em uso. Faça login ou use outro email.',
  },
  'weak_password': {
    title: 'Senha Fraca',
    message: 'Sua senha deve ter pelo menos 6 caracteres.',
  },
  'too_many_requests': {
    title: 'Muitas Tentativas',
    message: 'Aguarde alguns minutos antes de tentar novamente.',
  },
  'default': {
    title: 'Erro',
    message: 'Ocorreu um erro inesperado. Tente novamente.',
  },
};

export const getErrorMessage = (error: any): ErrorMessage => {
  if (error?.code) {
    const errorKey = error.code.toLowerCase().replace(/_/g, '');
    const message = AUTH_ERRORS[errorKey as keyof typeof AUTH_ERRORS];
    if (message) return message;
  }
  
  if (error?.message) {
    const msgLower = error.message.toLowerCase();
    if (msgLower.includes('invalid') && msgLower.includes('credentials')) {
      return AUTH_ERRORS.invalid_credentials;
    }
    if (msgLower.includes('email') && msgLower.includes('use')) {
      return AUTH_ERRORS.email_already_in_use;
    }
    if (msgLower.includes('weak') || msgLower.includes('password')) {
      return AUTH_ERRORS.weak_password;
    }
  }
  
  return AUTH_ERRORS.default;
};
