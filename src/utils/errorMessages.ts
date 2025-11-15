interface ErrorContext {
  operation: string;
  component: string;
  userAction?: string;
  expectedOutcome?: string;
  technicalDetails?: string;
}

interface ErrorMessage {
  title: string;
  description: string;
  action: string;
  technical?: string;
}

const errorMessages: Record<string, ErrorMessage> = {
  // Authentication errors
  'auth/invalid-credentials': {
    title: 'Email ou senha incorretos',
    description: 'Verifique se digitou seu email e senha corretamente.',
    action: 'Tente novamente ou clique em "Esqueci minha senha" para recuperar seu acesso.'
  },
  'auth/user-not-found': {
    title: 'Usuário não encontrado',
    description: 'Não encontramos uma conta com este email.',
    action: 'Verifique se o email está correto ou crie uma nova conta.'
  },
  'auth/email-already-in-use': {
    title: 'Email já cadastrado',
    description: 'Já existe uma conta com este email.',
    action: 'Tente fazer login ou use um email diferente.'
  },
  'auth/weak-password': {
    title: 'Senha muito fraca',
    description: 'Sua senha deve ter pelo menos 6 caracteres.',
    action: 'Crie uma senha mais forte com letras, números e símbolos.'
  },
  'auth/too-many-requests': {
    title: 'Muitas tentativas',
    description: 'Você excedeu o limite de tentativas de login.',
    action: 'Aguarde alguns minutos antes de tentar novamente.'
  },

  // Database errors
  'database/connection-failed': {
    title: 'Erro de conexão',
    description: 'Não foi possível conectar ao banco de dados.',
    action: 'Verifique sua conexão com a internet e tente novamente.'
  },
  'database/permission-denied': {
    title: 'Permissão negada',
    description: 'Você não tem permissão para realizar esta ação.',
    action: 'Entre em contato com o suporte se você acredita que isso é um erro.'
  },
  'database/not-found': {
    title: 'Dados não encontrados',
    description: 'Os dados solicitados não foram encontrados.',
    action: 'Tente atualizar a página ou entre em contato com o suporte.'
  },

  // Network errors
  'network/offline': {
    title: 'Sem conexão com a internet',
    description: 'Você parece estar offline.',
    action: 'Verifique sua conexão e tente novamente.'
  },
  'network/timeout': {
    title: 'Tempo limite excedido',
    description: 'A solicitação demorou muito para responder.',
    action: 'Tente novamente. Se o problema persistir, entre em contato com o suporte.'
  },
  'network/server-error': {
    title: 'Erro no servidor',
    description: 'Ocorreu um erro em nossos servidores.',
    action: 'Tente novamente em alguns instantes. Se o problema persistir, entre em contato com o suporte.'
  },

  // Validation errors
  'validation/required': {
    title: 'Campo obrigatório',
    description: 'Este campo não pode ficar vazio.',
    action: 'Preencha o campo com as informações solicitadas.'
  },
  'validation/invalid-email': {
    title: 'Email inválido',
    description: 'O email digitado não é válido.',
    action: 'Verifique se o email está no formato correto (ex: usuario@email.com).'
  },
  'validation/password-mismatch': {
    title: 'Senhas não coincidem',
    description: 'As senhas digitadas são diferentes.',
    action: 'Digite a mesma senha nos dois campos.'
  },

  // Generic fallback
  'generic/unknown': {
    title: 'Algo deu errado',
    description: 'Ocorreu um erro inesperado.',
    action: 'Tente novamente. Se o problema persistir, entre em contato com o suporte.'
  }
};

export function getErrorMessage(error: unknown, context?: ErrorContext): ErrorMessage {
  // Extract error code from different error formats
  let errorCode = 'generic/unknown';
  
  if (typeof error === 'string') {
    errorCode = error;
  } else if (error?.code) {
    errorCode = error.code;
  } else if (error?.message) {
    // Try to extract code from message
    const message = error.message.toLowerCase();
    if (message.includes('invalid') && message.includes('credential')) {
      errorCode = 'auth/invalid-credentials';
    } else if (message.includes('user') && message.includes('not found')) {
      errorCode = 'auth/user-not-found';
    } else if (message.includes('email') && message.includes('already')) {
      errorCode = 'auth/email-already-in-use';
    } else if (message.includes('weak') && message.includes('password')) {
      errorCode = 'auth/weak-password';
    } else if (message.includes('too many') && message.includes('request')) {
      errorCode = 'auth/too-many-requests';
    } else if (message.includes('offline') || message.includes('network')) {
      errorCode = 'network/offline';
    } else if (message.includes('timeout')) {
      errorCode = 'network/timeout';
    } else if (message.includes('permission') || message.includes('denied')) {
      errorCode = 'database/permission-denied';
    } else if (message.includes('not found')) {
      errorCode = 'database/not-found';
    }
  }

  // Get the error message or fallback
  const errorMessage = errorMessages[errorCode] || errorMessages['generic/unknown'];

  // Enhance with context if provided
  if (context) {
    return {
      ...errorMessage,
      technical: context.technicalDetails || `Erro em ${context.component} durante ${context.operation}`,
      description: context.userAction 
        ? `${errorMessage.description} Isso aconteceu quando você tentou ${context.userAction}.`
        : errorMessage.description
    };
  }

  return errorMessage;
}

export function getErrorTitle(error: any): string {
  return getErrorMessage(error).title;
}

export function getErrorDescription(error: any): string {
  return getErrorMessage(error).description;
}

export function getErrorAction(error: any): string {
  return getErrorMessage(error).action;
}