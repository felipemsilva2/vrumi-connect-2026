# Estrutura do Dashboard - Vrumi 3.0

## Visão Geral
O Dashboard é a área principal do usuário logado, acessível através da rota `/painel`. Ele utiliza um layout com barra lateral (sidebar) colapsável para navegação entre diferentes módulos de estudo.

## Arquitetura Principal

### Página Pai
- **Arquivo**: `src/pages/Dashboard.tsx`
- **Função**: 
  - Gerencia o estado de autenticação do usuário.
  - Busca o perfil do usuário.
  - Renderiza o componente de layout principal `DashboardWithSidebar`.
  - Exibe o tutorial de onboarding (`OnboardingTutorial`) para novos usuários.

### Layout e Navegação
- **Componente**: `DashboardWithSidebar` (`src/components/ui/dashboard-with-collapsible-sidebar.tsx`)
- **Responsabilidade**:
  - Gerencia a barra lateral (Sidebar) e a navegação móvel.
  - Controla qual "View" (visão) é renderizada na área de conteúdo principal através do estado `selected`.
  - Exibe informações do usuário e plano atual.

## Módulos e Sessões (Views)

O conteúdo principal alterna entre os seguintes componentes baseados na seleção do menu:

### 1. Dashboard (Home)
- **Componente**: `DashboardHome` (interno em `dashboard-with-collapsible-sidebar.tsx`)
- **Conteúdo**:
  - **Resumo**: Boas-vindas e resumo do plano.
  - **Atividades Recentes**: Lista das últimas ações do usuário.
  - **Revisões Pendentes**: Alerta sobre flashcards que precisam de revisão (SRS).
  - **Progresso por Categoria**: Gráficos de progresso nos módulos de estudo.
  - **Estatísticas Rápidas**: Resumo de desempenho em simulados e placas.

### 2. Flashcards
- **Componente**: `FlashcardsView` (`src/components/dashboard/FlashcardsView.tsx`)
- **Funcionalidade**:
  - Estudo de cartões com perguntas e respostas.
  - Sistema de virar o cartão (flip).
  - Feedback de "Acertei" ou "Errei" para cálculo de repetição espaçada.
  - Métricas de sessão (revisados, acertos, taxa).

### 3. Simulados
- **Componente**: `SimuladosView` (`src/components/dashboard/SimuladosView.tsx`)
- **Modos**:
  - **Simulado Oficial**: 30 questões, 40 minutos (idêntico ao DETRAN).
  - **Simulado de Prática**: 15 questões, 20 minutos.
- **Funcionalidades**:
  - Timer regressivo.
  - Navegação entre questões.
  - Revisão de respostas após finalização.
  - Histórico de tentativas.

### 4. Sala de Estudos (Link Externo)
- **Rota**: `/sala-de-estudos`
- **Descrição**: Redireciona para uma página dedicada de estudos com IA e materiais.

### 5. Materiais (Em breve/Oculto)
- **Componente**: `MateriaisView` (`src/components/dashboard/MateriaisView.tsx`)
- **Estrutura**:
  - **Módulos**: Visão geral dos módulos (ex: Direção Defensiva).
  - **Capítulos**: Lista de capítulos dentro de um módulo.
  - **Lições**: Conteúdo textual e visual das aulas.

### 6. Estatísticas
- **Componente**: `EstatisticasView` (`src/components/dashboard/EstatisticasView.tsx`)
- **Métricas**:
  - Base de Conhecimento (Total de Flashcards).
  - Comparação com a média da plataforma.
  - Nível de preparação para a prova (Score 0-100).
  - Padrões de estudo (horários de pico, consistência).
  - Análise detalhada por tipo de questão e categoria de placas.

### 7. Biblioteca de Placas (Link Externo)
- **Rota**: `/biblioteca-de-placas`
- **Descrição**: Acesso rápido à biblioteca completa de sinais de trânsito.

### 8. Conquistas
- **Componente**: `ConquistasView` (`src/components/dashboard/ConquistasView.tsx`)
- **Descrição**: Visualização de medalhas e marcos alcançados pelo usuário.

### 9. Meu Perfil
- **Componente**: `PerfilView` (`src/components/dashboard/PerfilView.tsx`)
- **Funcionalidade**: Gerenciamento de dados pessoais e configurações da conta.

## Estrutura de Pastas Relevante

```
src/
├── pages/
│   └── Dashboard.tsx              # Ponto de entrada
├── components/
│   ├── ui/
│   │   └── dashboard-with-collapsible-sidebar.tsx  # Layout Principal
│   └── dashboard/                 # Views do Dashboard
│       ├── EstatisticasView.tsx
│       ├── FlashcardsView.tsx
│       ├── SimuladosView.tsx
│       ├── MateriaisView.tsx
│       ├── ConquistasView.tsx
│       ├── PerfilView.tsx
│       └── ...
```
