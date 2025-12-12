# Product Requirements Document (PRD) - Vrumi Mobile App

## 1. Visão Geral
**Produto:** Vrumi Mobile  
**Plataforma:** iOS & Android (Via React Native / Expo)  
**Versão:** 1.0.0 (MVP)  
**Status:** Em Desenvolvimento Ativo  
**Baseado em:** [PRD Geral v1.1](./PRD_Vrumi.md)

Este documento especifica os requisitos e funcionalidades exclusivas da versão mobile do Vrumi, focando na experiência nativa, uso offline e interações touch.

---

## 2. Diferenciais da Versão Mobile
A versão mobile não é apenas uma réplica da web, mas tira proveito das capacidades do dispositivo:
*   **Estudo em Qualquer Lugar:** Foco em sessões curtas e intermitentes (ex: fila do ônibus).
*   **Acesso Offline:** Estudo de PDFs e Flashcards sem conexão.
*   **Interatividade Tátil:** Swipe em flashcards, zoom em placas.
*   **Notificações Push:** Lembretes de estudo e "palavra do dia".

---

## 3. Requisitos Funcionais Específicos (Mobile)

### 3.1. Autenticação e Onboarding Mobile
*   **RF-MOB-01:** Login com Google Nativo (sem webview redirect se possível).
*   **RF-MOB-02:** Persistência de sessão segura (SecureStore).
*   **RF-MOB-03 (Futuro):** Login biométrico (FaceID/TouchID) para retorno rápido.
*   **RF-MOB-04:** Onboarding com slides interativos apresentando as abas.

### 3.2. Sala de Estudos e PDF Nativo
*   **RF-MOB-05:** Visualizador de PDF Embutido Nativo (`react-native-pdf`).
    *   *Status:* Implementado.
    *   *Detalhe:* Renderização dentro do app, sem abrir browser externo.
    *   *Requisito Técnico:* Exige Development Build (`expo-dev-client`).
*   **RF-MOB-06:** Controle de Zoom e Navegação por página no PDF.
*   **RF-MOB-07:** Chat com IA sobreposto ao conteúdo (Modal ou Aba deslizante).

### 3.3. Flashcards com Gestos
*   **RF-MOB-08:** Navegação estilo "Tinder" (Swipe Left/Right) para flashcards.
    *   *Status:* Parcialmente implementado.
*   **RF-MOB-09:** Feedback tátil (Haptic Feedback) ao acertar/errar.
*   **RF-MOB-10:** Animações fluídas de virada de carta (Flip).

### 3.4. Simulados e Quiz
*   **RF-MOB-11:** Interface focada em questão única por tela.
*   **RF-MOB-12:** Bloqueio de navegação acidental durante o simulado (Exit Confirmation).
    *   *Status:* Implementado (QuizLockContext).
*   **RF-MOB-13:** Seleção de Simulado Regional (30 ou 40 questões) baseado no estado.
    *   *Status:* Implementado.

### 3.5. Gamificação e Engajamento
*   **RF-MOB-14:** Barra de progresso visual nas abas.
*   **RF-MOB-15:** Notificações Push locais para lembretes de estudo.

### 3.6. Funcionalidades Offline (Planejado)
*   **RF-MOB-16:** Cache de PDFs baixados para acesso sem internet.
    *   *Status:* Implementado no `study-room.tsx` (cache local).
*   **RF-MOB-17:** Sincronização de progresso quando a conexão retornar.

---

## 4. Arquitetura Técnica Mobile

### 4.1. Stack Tecnológica
*   **Framework:** React Native 0.76+
*   **Plataforma:** Expo SDK 54
*   **Build System:** Expo EAS & Development Builds (`expo-dev-client`)
*   **Linguagem:** TypeScript
*   **Navegação:** Expo Router (File-based routing)
*   **Estilização:** StyleSheet nativo + Design Tokens (Theming)
*   **Gerenciamento de Estado de UI:** React Context (Theme, QuizLock)
*   **Backend:** Supabase (padrão do projeto)

### 4.2. Estrutura de Pastas (Expo Router)
```text
mobile/
├── app/
│   ├── (auth)/         # Telas de Autenticação (Login/Register)
│   ├── (tabs)/         # Bottom Tab Navigator Principal
│   │   ├── index.tsx   # Dashboard/Home
│   │   ├── estudos.tsx # Sala de Estudos (Wrapper)
│   │   ├── flashcards.tsx
│   │   ├── simulados.tsx
│   │   └── perfil.tsx
│   ├── study-room.tsx  # Tela Fullscreen da Sala de Estudos
│   └── _layout.tsx     # Root Layout & Providers
├── components/         # Componentes Reutilizáveis (UI)
├── contexts/           # Contextos Globais (QuizLock, Theme)
├── assets/             # Imagens e Fontes
└── services/           # Lógica de API/Supabase (se separado)
```

### 4.3. Dependências Nativas Críticas
O projeto utiliza bibliotecas que exigem código nativo, portanto **não funciona no Expo Go padrão**.
1.  `react-native-pdf`: Renderização de PDF.
2.  `react-native-blob-util`: Manipulação de arquivos binários.
3.  `expo-dev-client`: Para permitir builds de desenvolvimento.

---

## 5. Fluxos de UX Mobile (User Journeys)

### 5.1. Jornada do Estudo Rápido
1.  Usuário abre o app.
2.  Dashboard mostra "Continuar de onde parou".
3.  Toque único leva direto ao PDF/Flashcard.
4.  Estuda por 5 minutos.
5.  Fecha o app -> Progresso salvo localmente e sincronizado.

### 5.2. Jornada do Simulado
1.  Usuário seleciona "Simulados".
2.  Escolhe "Prova Padrão" ou "Estendida" (Regional).
3.  App entra em modo imersivo (esconde abas).
4.  Resolve questões.
5.  Ao tentar sair, App pede confirmação para evitar perdas.
6.  Finaliza e vê resultado com animação de sucesso/falha.

---

## 6. Roadmap Mobile Específico

### Fase 1: Fundação & Conteúdo (Concluído/Atual)
*   [x] Estrutura Expo Router.
*   [x] Integração Supabase Auth.
*   [x] Sala de Estudos com PDF Nativo (Development Build).
*   [x] Simulados com cronômetro e lógica de aprovação.
*   [x] Busca Global no Dashboard.

### Fase 2: Polimento & Offline (Próximo)
*   [ ] Implementar modo escuro completo (Dark Mode).
*   [ ] Melhorar cache de imagens e flashcards para offline.
*   [ ] Refinar animações de transição.
*   [ ] Login Social Nativo (Google/Apple).

### Fase 3: Publicação
*   [ ] Configurar EAS Build para Production.
*   [ ] Assets de loja (Screenshots, Ícones Adaptativos).
*   [ ] Teste em dispositivos físicos variados.
