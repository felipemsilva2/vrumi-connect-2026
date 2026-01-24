# Product Requirements Document (PRD) - Vrumi Connect Mobile

## 1. Visão Geral
**Produto:** Vrumi Connect Mobile  
**Plataforma:** iOS & Android (React Native / Expo)  
**Versão:** 1.0.0 (MVP)  
**Status:** Em Desenvolvimento Ativo  
**Última Atualização:** 27/12/2024

Vrumi Connect é um marketplace que conecta alunos a instrutores de autoescola particulares. O app mobile permite que alunos encontrem, agendem e paguem aulas práticas de direção diretamente no celular.

---

## 2. Proposta de Valor

### Para Alunos
- **Encontrar instrutores** próximos com avaliações e preços transparentes
- **Agendar aulas** de forma prática com calendário integrado
- **Pagar com segurança** via Stripe (cartão de crédito)
- **Comunicação direta** com o instrutor via chat in-app

### Para Instrutores
- **Painel de gestão** de agendamentos e disponibilidade
- **Recebimento automático** via Stripe Connect
- **Perfil profissional** com fotos, veículo e avaliações
- **Pacotes de aulas** com preços especiais

---

## 3. Requisitos Funcionais

### 3.1. Autenticação
- **RF-01:** Login/Registro com email e senha
- **RF-02:** Persistência de sessão segura (SecureStore)
- **RF-03:** Recuperação de senha via email
- **RF-04:** Logout com limpeza de dados locais

### 3.2. Busca e Descoberta de Instrutores
- **RF-05:** Listagem de instrutores aprovados na região
- **RF-06:** Filtros por: categoria (A/B/C/D/E), tipo de veículo, preço, avaliação
- **RF-07:** Visualização de mapa com instrutores próximos (Google Maps)
- **RF-08:** Perfil detalhado do instrutor com:
  - Foto de perfil e foto do veículo
  - Biografia e experiência
  - Categorias habilitadas
  - Avaliações de alunos
  - Preço por aula e pacotes disponíveis

### 3.3. Agendamento de Aulas
- **RF-09:** Visualização de disponibilidade do instrutor (calendário)
- **RF-10:** Seleção de data, horário e duração da aula
- **RF-11:** Opção de usar pacote de aulas (se adquirido)
- **RF-12:** Confirmação de agendamento com resumo

### 3.4. Pagamentos (Stripe)
- **RF-13:** Checkout seguro via Stripe
- **RF-14:** Suporte a cartão de crédito
- **RF-15:** Aplicação de cupons de desconto
- **RF-16:** Compra de pacotes de aulas com desconto
- **RF-17:** Histórico de transações

### 3.5. Chat entre Aluno e Instrutor
- **RF-18:** Sala de chat por agendamento
- **RF-19:** Mensagens em tempo real (Supabase Realtime)
- **RF-20:** Moderação automática de conteúdo
- **RF-21:** Notificações de novas mensagens

### 3.6. Gestão de Aulas (Aluno)
- **RF-22:** Lista de aulas agendadas (pendentes, confirmadas, concluídas)
- **RF-23:** Cancelamento de aula com política de reembolso
- **RF-24:** Avaliação do instrutor após aula concluída
- **RF-25:** Histórico completo de aulas

### 3.7. Painel do Instrutor
- **RF-26:** Onboarding completo com verificação de documentos
- **RF-27:** Configuração de disponibilidade semanal
- **RF-28:** Onboarding Stripe Connect para recebimentos
- **RF-29:** Dashboard com métricas (aulas, ganhos, avaliações)
- **RF-30:** Gestão de pacotes de aulas
- **RF-31:** Edição de perfil (foto, bio, veículo, preços)

### 3.8. Notificações Push
- **RF-32:** Novo agendamento recebido (instrutor)
- **RF-33:** Confirmação/cancelamento de aula
- **RF-34:** Lembrete de aula próxima (24h antes)
- **RF-35:** Nova mensagem no chat

---

## 4. Arquitetura Técnica

### 4.1. Stack Tecnológica
| Camada | Tecnologia |
|--------|------------|
| **Framework** | React Native 0.76+ |
| **Plataforma** | Expo SDK 54 |
| **Build** | EAS Build + Development Builds |
| **Linguagem** | TypeScript |
| **Navegação** | Expo Router (File-based) |
| **Estilização** | StyleSheet + NativeWind (Tailwind) |
| **Estado** | React Context + React Query |
| **Backend** | Supabase (Auth, Database, Realtime, Storage) |
| **Pagamentos** | Stripe + Stripe Connect |
| **Mapas** | React Native Maps + Google Maps API |
| **Notificações** | Expo Notifications + expo-web-browser |

### 4.2. Estrutura de Pastas
```text
mobile/
├── app/
│   ├── (auth)/              # Login, Register, Forgot Password
│   ├── (tabs)/              # Bottom Tab Navigator
│   │   ├── index.tsx        # Home / Buscar Instrutores
│   │   ├── aulas.tsx        # Minhas Aulas
│   │   ├── chat.tsx         # Lista de Conversas
│   │   └── perfil.tsx       # Perfil do Usuário
│   ├── connect/             # Telas do Marketplace
│   │   ├── instrutor/[id].tsx    # Perfil do Instrutor
│   │   ├── agendar/[id].tsx      # Fluxo de Agendamento
│   │   ├── mapa.tsx              # Mapa de Instrutores
│   │   └── painel-instrutor.tsx  # Dashboard do Instrutor
│   └── _layout.tsx          # Root Layout + Providers
├── components/              # Componentes Reutilizáveis
│   ├── BookingFlow.tsx      # Fluxo de Agendamento
│   ├── InstructorCard.tsx   # Card de Instrutor
│   ├── InstructorDashboardView.tsx
│   ├── InstructorOnboardingView.tsx
│   └── ...
├── contexts/                # Contextos Globais
├── hooks/                   # Custom Hooks
└── src/lib/                 # Configurações (Supabase, etc.)
```

### 4.3. Modelo de Dados Principal
```
profiles          # Dados básicos do usuário
instructors       # Perfil profissional do instrutor
instructor_availability  # Horários disponíveis
bookings          # Agendamentos
lesson_packages   # Pacotes de aulas
student_packages  # Pacotes comprados pelo aluno
reviews           # Avaliações
connect_chat_rooms    # Salas de chat
connect_chat_messages # Mensagens
transactions      # Histórico de pagamentos
notifications     # Notificações
```

---

## 5. Fluxos de UX

### 5.1. Jornada do Aluno - Agendar Aula
1. Usuário abre o app e faz login
2. Na Home, vê lista de instrutores ou acessa o mapa
3. Seleciona um instrutor e vê o perfil completo
4. Toca em "Agendar Aula"
5. Escolhe data e horário disponível
6. Seleciona pacote ou aula avulsa
7. Realiza pagamento via Stripe
8. Recebe confirmação e pode conversar com instrutor

### 5.2. Jornada do Instrutor - Onboarding
1. Usuário se registra e seleciona "Quero ser instrutor"
2. Preenche formulário de cadastro profissional
3. Envia documentos para verificação (CNH, CRLV)
4. Configura disponibilidade semanal
5. Realiza onboarding do Stripe Connect
6. Aguarda aprovação do admin
7. Após aprovado, aparece na busca de alunos

### 5.3. Jornada do Instrutor - Receber Pagamento
1. Aluno agenda e paga a aula
2. Instrutor recebe notificação
3. Aula é realizada
4. Pagamento é transferido automaticamente via Stripe Connect
5. Instrutor visualiza ganhos no dashboard

---

## 6. Políticas de Negócio

### 6.1. Comissões
- **Taxa da plataforma:** 15% sobre cada transação
- **Repasse ao instrutor:** 85% do valor da aula

### 6.2. Cancelamento
- **Até 24h antes:** Reembolso integral
- **Menos de 24h:** Instrutor recebe 50%
- **No-show do aluno:** Instrutor recebe 100%

### 6.3. Aprovação de Instrutores
- Admin verifica documentos manualmente
- Status: `pending` → `approved` / `rejected`
- Apenas instrutores `approved` aparecem na busca

---

## 7. Segurança

### 7.1. Implementado
- [x] Row Level Security (RLS) em todas as tabelas
- [x] Políticas otimizadas com `(select auth.uid())`
- [x] Funções com `SET search_path = public`
- [x] Validação de dados no backend (Edge Functions)
- [x] Stripe para processamento seguro de pagamentos
- [x] Índices únicos para evitar duplicação

### 7.2. Pendente
- [ ] Leaked Password Protection (Dashboard Supabase)
- [ ] Rate limiting em endpoints críticos
- [ ] Verificação de email obrigatória

---

## 8. Roadmap

### Fase 1: MVP Interno (Atual) ✅
Desenvolvimento das funcionalidades core, testadas apenas pela equipe.
- [x] Autenticação e perfis
- [x] Cadastro e busca de instrutores
- [x] Agendamento de aulas
- [x] Pagamento via Stripe
- [x] Chat entre aluno e instrutor
- [x] Painel do instrutor
- [x] Stripe Connect para repasses
- [x] Correções de segurança e performance RLS

### Fase 2: Beta Fechado (Próximo)
Distribuição via **TestFlight (iOS)** e **Internal Testing (Android)** para grupo controlado.
- [ ] Publicar APK/IPA para beta testers
- [ ] Recrutar 5-10 instrutores parceiros
- [ ] Recrutar 20-30 alunos beta testers
- [ ] Coletar feedback e bugs
- [ ] Notificações push completas
- [ ] Avaliações e reputação
- [ ] Modo escuro
- [ ] Filtros avançados de busca

### Fase 3: Soft Launch
Publicação nas lojas com **marketing limitado** em uma cidade/região piloto.
- [ ] App para iOS (App Store) e Android (Play Store)
- [ ] Campanha local (1 cidade)
- [ ] Painel admin web básico
- [ ] Onboarding de primeiros instrutores reais
- [ ] Ajustes baseados em dados reais

### Fase 4: Escala
Expansão para múltiplas cidades e crescimento agressivo.
- [ ] Relatórios financeiros avançados
- [ ] Programa de indicação
- [ ] Suporte a múltiplas cidades
- [ ] Campanhas de marketing digital
- [ ] Parcerias com autoescolas

---

## 9. Métricas de Sucesso (por Fase)

### Beta Fechado
| Métrica | Meta |
|---------|------|
| Instrutores beta | 5-10 |
| Alunos beta | 20-30 |
| Aulas agendadas (total) | 30-50 |
| Bugs críticos | 0 |
| NPS beta testers | > 40 |

### Soft Launch (1 cidade)
| Métrica | Meta |
|---------|------|
| Instrutores ativos | 20-30 |
| Alunos registrados | 200 |
| Aulas agendadas/mês | 100 |
| Taxa de conversão | 10% |
| Receita mensal | R$ 5.000+ |

### Escala
| Métrica | Meta |
|---------|------|
| Cidades ativas | 5+ |
| Instrutores ativos | 200+ |
| Aulas agendadas/mês | 1.000+ |
| GMV mensal | R$ 100.000+ |
| NPS geral | > 50 |

---

## 10. Dependências Externas

| Serviço | Uso | Status |
|---------|-----|--------|
| **Supabase** | Auth, DB, Realtime, Storage, Edge Functions | ✅ Configurado |
| **Stripe** | Pagamentos e Connect | ✅ Configurado |
| **Google Maps** | Mapas e geocoding | ✅ Configurado |
| **Expo/EAS** | Build e notificações | ✅ Configurado |
| **TestFlight** | Distribuição beta iOS | ⏳ Pendente |
| **Google Play Console** | Distribuição beta/prod Android | ⏳ Pendente |
| **App Store Connect** | Publicação iOS | ⏳ Pendente |

---

## 11. Distribuição Beta

### Android (Google Play Internal Testing)
1. Gerar APK via `eas build --platform android --profile preview`
2. Upload no Google Play Console → Internal Testing
3. Adicionar emails dos testers
4. Testers baixam via link privado

### iOS (TestFlight)
1. Gerar IPA via `eas build --platform ios --profile preview`
2. Upload no App Store Connect → TestFlight
3. Adicionar testers por email
4. Testers baixam via app TestFlight

### Alternativa: Distribuição Direta
- **Android:** Compartilhar APK diretamente (sideload)
- **iOS:** Usar `eas build --platform ios --profile development` + registro de dispositivos (mais limitado)

