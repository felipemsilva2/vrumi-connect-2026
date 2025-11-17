export interface ErrorMessage {
  title: string;
  message: string;
  description?: string;
  action?: string;
  technical?: string;
}

export interface ErrorContext {
  operation?: string;
  component?: string;
  technicalDetails?: string;
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

export const getErrorMessage = (error: any, context?: ErrorContext): ErrorMessage => {
  const baseMessage: ErrorMessage = { title: '', message: '' };
  if (error?.code) {
    const errorKey = error.code.toLowerCase().replace(/_/g, '');
    const message = AUTH_ERRORS[errorKey as keyof typeof AUTH_ERRORS];
    if (message) {
      baseMessage.title = message.title;
      baseMessage.message = message.message;
    }
  } else if (error?.message) {
    const msgLower = error.message.toLowerCase();
    if (msgLower.includes('invalid') && msgLower.includes('credentials')) {
      baseMessage.title = AUTH_ERRORS.invalid_credentials.title;
      baseMessage.message = AUTH_ERRORS.invalid_credentials.message;
    } else if (msgLower.includes('email') && msgLower.includes('use')) {
      baseMessage.title = AUTH_ERRORS.email_already_in_use.title;
      baseMessage.message = AUTH_ERRORS.email_already_in_use.message;
    } else if (msgLower.includes('weak') || msgLower.includes('password')) {
      baseMessage.title = AUTH_ERRORS.weak_password.title;
      baseMessage.message = AUTH_ERRORS.weak_password.message;
    } else {
      baseMessage.title = AUTH_ERRORS.default.title;
      baseMessage.message = AUTH_ERRORS.default.message;
    }
  } else {
    baseMessage.title = AUTH_ERRORS.default.title;
    baseMessage.message = AUTH_ERRORS.default.message;
  }
  
  // Add context if provided
  if (context) {
    baseMessage.description = baseMessage.message;
    if (context.operation) {
      baseMessage.action = `Tente ${context.operation} novamente ou recarregue a página.`;
    }
    if (context.technicalDetails) {
      baseMessage.technical = context.technicalDetails;
    }
  }
  
  return baseMessage;
};
