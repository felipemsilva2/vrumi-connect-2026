# 🚗 Vrumi - Build in Public

## 📌 Sobre o Projeto

**Vrumi** é uma plataforma completa que conecta alunos a instrutores de autoescola particulares, oferecendo uma experiência moderna e eficiente para aprendizado de direção.

### 🎯 Proposta de Valor

- **Para Alunos:** Encontre instrutores qualificados, agende aulas práticas e pague com segurança
- **Para Instrutores:** Gerencie sua agenda, receba pagamentos automaticamente e construa sua reputação
- **Para o Mercado:** Democratização do acesso a instrutores independentes com a nova lei da CNH

---

## 🏗️ Stack Tecnológica

### Frontend Web
- **Framework:** React 18 + TypeScript
- **Build Tool:** Vite 5
- **UI Library:** shadcn/ui + Radix UI
- **Styling:** Tailwind CSS + Framer Motion
- **State Management:** React Query + Context API
- **Routing:** React Router v6

### Mobile App
- **Framework:** React Native 0.76+
- **Platform:** Expo SDK 54
- **Navigation:** Expo Router (File-based)
- **Styling:** NativeWind (Tailwind for RN)
- **Build:** EAS Build + Development Builds

### Backend & Infraestrutura
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **Realtime:** Supabase Realtime
- **Storage:** Supabase Storage
- **Edge Functions:** Supabase Edge Functions (Deno)
- **Payments:** Stripe + Stripe Connect
- **Maps:** Google Maps API + React Native Maps

### DevOps & Tools
- **Hosting:** Vercel (Web)
- **Version Control:** Git + GitHub
- **Package Manager:** npm
- **Testing:** Vitest + Testing Library
- **PWA:** vite-plugin-pwa + Workbox

---

## ✨ Features Implementadas

### 🌐 Plataforma Web

#### 1. **Landing Page Vrumi Connect**
- Design moderno e responsivo inspirado em Apple e Duolingo
- Seções: Hero, Como Funciona, Benefícios, Testemunhos, FAQ
- SEO otimizado para "instrutor independente" e "CNH gratuita"
- Integração com Google Maps para busca de instrutores

#### 2. **Sistema de Autenticação**
- Login/Registro com email e senha
- Recuperação de senha
- Persistência de sessão
- Proteção de rotas

#### 3. **Marketplace de Instrutores**
- Listagem de instrutores aprovados
- Filtros por categoria (A/B/C/D/E), veículo, preço, avaliação
- Perfil detalhado com fotos, biografia, avaliações
- Sistema de avaliações e reviews

#### 4. **Sistema de Agendamento**
- Calendário de disponibilidade do instrutor
- Seleção de data, horário e duração
- Pacotes de aulas com desconto
- Confirmação e gestão de agendamentos

#### 5. **Pagamentos (Stripe)**
- Checkout seguro com cartão de crédito
- Sistema de cupons de desconto
- Compra de pacotes de aulas
- Histórico de transações
- Split payment automático (15% plataforma / 85% instrutor)

#### 6. **Painel do Instrutor**
- Dashboard com métricas (aulas, ganhos, avaliações)
- Gestão de disponibilidade semanal
- Onboarding Stripe Connect
- Edição de perfil (foto, bio, veículo, preços)
- Upload de foto do veículo
- Gestão de pacotes de aulas

#### 7. **Chat em Tempo Real**
- Mensagens entre aluno e instrutor
- Supabase Realtime para comunicação instantânea
- **Moderação automática de conteúdo** (Edge Function)
- Detecção de linguagem inapropriada e spam
- Bloqueio automático de mensagens suspeitas
- Sistema de reportar mensagens
- Notificações de novas mensagens

#### 8. **Sistema de Notificações**
- Notificações in-app
- Modal redesenhado (inspirado em Apple/Duolingo)
- Marcar como lido/limpar notificações
- Configurações de preferências

#### 9. **Painel Administrativo**
- Aprovação de instrutores
- Verificação de documentos
- Gestão de usuários
- Métricas da plataforma

#### 10. **SEO & Marketing**
- Meta tags otimizadas
- Structured data (LocalBusiness, Service, FAQ)
- Sitemap.xml automático
- robots.txt configurado
- Páginas dedicadas: "Nova Lei da CNH", "Instrutor Independente"

---

### 📱 Aplicativo Mobile (iOS & Android)

#### 1. **Autenticação Biométrica**
- Face ID / Touch ID
- Armazenamento seguro com SecureStore
- Fallback para senha

#### 2. **Busca de Instrutores**
- Lista de instrutores com filtros
- Mapa interativo com Google Maps
- Perfil detalhado do instrutor
- Sistema de favoritos

#### 3. **Agendamento de Aulas**
- Fluxo completo de booking
- Calendário nativo
- Seleção de pacotes
- Pagamento integrado

#### 4. **Pagamentos Mobile**
- Stripe SDK nativo
- Checkout in-app
- Histórico de transações
- Compra de pacotes

#### 5. **Chat Mobile**
- Mensagens em tempo real
- Notificações push
- Interface nativa otimizada

#### 6. **Painel do Instrutor Mobile**
- Dashboard com métricas
- Gestão de agendamentos
- Configuração de disponibilidade
- Onboarding Stripe Connect via expo-web-browser
- Upload de fotos (perfil e veículo)

#### 7. **Notificações Push**
- Expo Notifications
- Novo agendamento
- Confirmação/cancelamento
- Lembrete de aula (24h antes)
- Nova mensagem

#### 8. **Experiência Offline**
- Cache de dados com React Query
- Sincronização automática
- Feedback visual de conectividade

---

### 🔧 Backend & Infraestrutura

#### 1. **Database Schema**
- 15+ tabelas otimizadas
- Row Level Security (RLS) em todas as tabelas
- Índices para performance
- Triggers para automação
- Políticas de segurança otimizadas

#### 2. **Edge Functions (Supabase)**
- `connect-create-account`: Criação de conta Stripe Connect
- `connect-onboarding-link`: Link de onboarding Stripe
- `create-checkout`: Checkout com split payment
- `moderate-message`: Moderação de chat
- Cron jobs para reconciliação de pagamentos

#### 3. **Stripe Integration**
- Stripe Connect para instrutores
- Split payment automático (15%/85%)
- Webhooks para eventos
- Localização brasileira (BRL)
- Transferências semanais automáticas

#### 4. **Storage & Media**
- Upload de fotos de perfil
- Upload de fotos de veículos
- Upload de documentos (CNH, CRLV)
- Compressão e otimização de imagens
- Buckets públicos e privados

#### 5. **Realtime Features**
- Chat em tempo real
- Notificações instantâneas
- Atualização de status de agendamentos
- Sincronização de disponibilidade

#### 6. **Security & Performance**
- RLS otimizado com `(select auth.uid())`
- Funções com `SET search_path = public`
- Rate limiting em endpoints críticos
- Validação de dados no backend
- Índices únicos para evitar duplicação

---

## 🎨 Design & UX

### Princípios de Design
- **Minimalista e Moderno:** Inspirado em Apple, Duolingo e Stripe
- **Mobile-First:** Responsivo em todos os dispositivos
- **Acessibilidade:** Contraste adequado, navegação por teclado
- **Performance:** Lazy loading, otimização de imagens, code splitting

### Paleta de Cores
- **Verde Escuro:** #1a3a2e (Confiança e crescimento)
- **Azul Petróleo:** #2c5f6f (Profissionalismo)
- **Grafite:** #2d3748 (Sofisticação)
- **Cards Claros:** Contraste para dados importantes

### Componentes Reutilizáveis
- 50+ componentes shadcn/ui customizados
- Design system consistente
- Animações com Framer Motion
- Feedback visual em todas as ações

---

## 📊 Métricas & Conquistas

### Desenvolvimento
- **Linhas de Código:** ~50.000+ (Web + Mobile + Backend)
- **Componentes:** 100+ componentes React/React Native
- **Edge Functions:** 10+ funções serverless
- **Migrations:** 30+ migrações de banco de dados
- **Commits:** 500+ commits

### Performance
- **Lighthouse Score:** 95+ (Performance, Accessibility, Best Practices, SEO)
- **First Contentful Paint:** < 1.5s
- **Time to Interactive:** < 3s
- **Bundle Size:** Otimizado com code splitting

### Segurança
- **RLS:** 100% das tabelas protegidas
- **HTTPS:** Certificado SSL em produção
- **PCI Compliance:** Via Stripe
- **LGPD:** Políticas de privacidade implementadas

---

## 🚀 Roadmap

### ✅ Fase 1: MVP Interno (Concluído)
- [x] Plataforma web completa
- [x] App mobile iOS/Android
- [x] Sistema de pagamentos
- [x] Chat em tempo real
- [x] Painel do instrutor
- [x] Painel administrativo

### 🔄 Fase 2: Beta Fechado (Em Andamento)
- [ ] TestFlight (iOS) + Internal Testing (Android)
- [ ] Recrutar 5-10 instrutores beta
- [ ] Recrutar 20-30 alunos beta
- [ ] Coletar feedback e bugs
- [ ] Modo escuro
- [ ] Filtros avançados

### 📅 Fase 3: Soft Launch (Próximo)
- [ ] Publicação App Store + Play Store
- [ ] Campanha local (1 cidade piloto)
- [ ] Onboarding de instrutores reais
- [ ] Ajustes baseados em dados reais

### 🎯 Fase 4: Escala
- [ ] Expansão para múltiplas cidades
- [ ] Programa de indicação
- [ ] Parcerias com autoescolas
- [ ] Relatórios financeiros avançados

---

## 🔥 Destaques Técnicos

### 1. **Otimização de Performance RLS**
Refatoração completa das políticas de segurança do Supabase, reduzindo tempo de consulta em 70% através de:
- Uso de `(select auth.uid())` em vez de `auth.uid()`
- Índices estratégicos
- Funções com `SET search_path = public`

### 2. **Stripe Connect Integration**
Implementação completa de split payment com:
- Onboarding automático de instrutores
- Transferências semanais
- Webhook handling
- Localização brasileira

### 3. **Real-time Chat com Moderação Automática**
Sistema de chat escalável e seguro com:
- **Supabase Realtime** para mensagens instantâneas
- **Moderação automática via Edge Function:**
  - Detecção de palavras ofensivas e linguagem inapropriada
  - Bloqueio de spam e mensagens repetitivas
  - Verificação de URLs suspeitas
  - Score de confiança para cada mensagem
  - Bloqueio automático de conteúdo inadequado
- **Notificações push** para novas mensagens
- **Sincronização offline** com cache local
- **Sistema de denúncia** para usuários reportarem abusos

### 4. **Mobile Biometric Auth**
Autenticação biométrica nativa com:
- Face ID / Touch ID
- SecureStore para credenciais
- Fallback seguro
- UX inspirada em apps bancários

### 5. **SEO Strategy**
Estratégia completa de SEO para posicionamento em:
- "Instrutor independente"
- "CNH gratuita"
- "Aulas de direção particulares"
- Structured data para rich snippets

### 6. **Sistema de Moderação Automática de Conteúdo**
Proteção completa contra conteúdo inadequado no chat:

**Detecção Automática:**
- Palavras ofensivas e linguagem inapropriada
- Spam e mensagens repetitivas
- URLs suspeitas e tentativas de phishing
- Solicitações de contato externo (WhatsApp, telefone, email)
- Tentativas de pagamento fora da plataforma

**Implementação Técnica:**
- **Edge Function** (Supabase/Deno) que processa cada mensagem antes de salvar
- **Score de Confiança** (0-100) calculado com base em múltiplos fatores
- **Bloqueio Automático** de mensagens com score < 50
- **Rate Limiting** para prevenir spam (máx. 10 mensagens/minuto)
- **Regex Patterns** para detectar padrões suspeitos (telefones, URLs, etc.)
- **Blacklist de Palavras** customizável via admin
- **Logging Completo** de todas as mensagens bloqueadas para auditoria

**Fluxo de Moderação:**
1. Usuário envia mensagem
2. Edge Function `moderate-message` é acionada
3. Análise de conteúdo (palavras-chave, URLs, padrões)
4. Cálculo do score de confiança
5. Se aprovado: mensagem salva no banco
6. Se bloqueado: usuário recebe feedback + admin notificado
7. Admin pode revisar e desbloquear se falso positivo

**Segurança Adicional:**
- Sistema de denúncia para usuários reportarem abusos
- Histórico de mensagens bloqueadas por usuário
- Suspensão automática após 3 mensagens bloqueadas
- Compliance com LGPD (dados sensíveis protegidos)

**Próximas Melhorias:**
- Machine Learning para detecção mais precisa
- Análise de sentimento com IA
- Sistema de reputação de usuários
- Moderação assistida por GPT-4



## 🛠️ Limpeza e Refatoração

### Remoção do Módulo Education
- Removidos 50+ arquivos relacionados a placas de trânsito e simulados
- Foco 100% no marketplace Vrumi Connect
- Codebase reduzido em ~30%
- Manutenibilidade melhorada

### Deep Code Cleanup
- Remoção de código morto
- Padronização de componentes
- Otimização de imports
- Melhoria de tipos TypeScript

---

## 📱 Distribuição Beta

### Android
- **Build:** EAS Build (APK/AAB)
- **Distribuição:** Google Play Internal Testing
- **Tamanho:** ~50MB
- **Min SDK:** 21 (Android 5.0+)

### iOS
- **Build:** EAS Build (IPA)
- **Distribuição:** TestFlight
- **Tamanho:** ~60MB
- **Min iOS:** 13.0+

---

## 🎓 Aprendizados

### Técnicos
1. **Supabase RLS:** Políticas otimizadas são cruciais para performance
2. **Stripe Connect:** Onboarding flow requer atenção especial à UX
3. **React Native:** Development builds são essenciais para produtividade
4. **Real-time:** Supabase Realtime é poderoso mas requer gerenciamento de conexões
5. **Mobile Payments:** expo-web-browser oferece melhor UX que Linking.openURL

### Produto
1. **Build in Public:** Transparência gera engajamento
2. **MVP Focused:** Melhor lançar rápido e iterar
3. **User Feedback:** Beta testers são essenciais
4. **Market Timing:** Nova lei da CNH é oportunidade única
5. **Two-sided Marketplace:** Equilibrar oferta e demanda é desafiador

### Negócio
1. **Comissão 15%:** Competitivo vs. concorrentes (20-30%)
2. **Stripe Connect:** Melhor solução para marketplaces no Brasil
3. **SEO:** Fundamental para aquisição orgânica
4. **Mobile-First:** Maioria dos usuários acessa via mobile
5. **Trust & Safety:** Verificação de instrutores é crítica

---

## 📈 Próximos Passos

### Curto Prazo (1-2 meses)
1. Lançar beta fechado com 10 instrutores
2. Recrutar 30 alunos beta testers
3. Coletar feedback e iterar
4. Implementar modo escuro
5. Adicionar notificações push completas

### Médio Prazo (3-6 meses)
1. Soft launch em 1 cidade (São Paulo)
2. Campanha de marketing local
3. Onboarding de 20-30 instrutores
4. Atingir 100 aulas/mês
5. Publicar nas lojas (App Store + Play Store)

### Longo Prazo (6-12 meses)
1. Expansão para 5 cidades
2. 200+ instrutores ativos
3. 1.000+ aulas/mês
4. GMV de R$ 100.000+/mês
5. Parcerias com autoescolas

---

## 🤝 Tecnologias & Serviços Utilizados

| Categoria | Tecnologia | Uso |
|-----------|------------|-----|
| **Frontend** | React 18 + TypeScript | Web App |
| **Mobile** | React Native + Expo | iOS/Android App |
| **UI** | shadcn/ui + Tailwind | Design System |
| **Backend** | Supabase | Database, Auth, Realtime |
| **Payments** | Stripe + Connect | Pagamentos e Repasses |
| **Maps** | Google Maps API | Geolocalização |
| **Hosting** | Vercel | Web Hosting |
| **Build** | EAS Build | Mobile Builds |
| **Analytics** | (A implementar) | Métricas de uso |
| **Monitoring** | (A implementar) | Error tracking |

---

## 💡 Por Que Vrumi?

### Problema
- Instrutores independentes têm dificuldade de encontrar alunos
- Alunos não sabem como encontrar instrutores particulares confiáveis
- Nova lei da CNH permite instrutores independentes, mas falta infraestrutura

### Solução
- Marketplace que conecta alunos e instrutores
- Sistema de avaliações para confiança
- Pagamentos seguros e automáticos
- Gestão completa de agendamentos

### Diferencial
- **Mobile-First:** App nativo para melhor experiência
- **Comissão Justa:** 15% vs. 20-30% dos concorrentes
- **Real-time:** Chat e notificações instantâneas
- **Stripe Connect:** Pagamentos automáticos semanais
- **SEO Otimizado:** Posicionamento para nova lei da CNH

---

## 📞 Contato & Links

- **Website:** [vrumi.com.br](https://vrumi.com.br)
- **Status:** MVP em desenvolvimento ativo
- **Fase Atual:** Preparando beta fechado
- **Lançamento Beta:** Q1 2025

---

## 🙏 Agradecimentos

Este projeto foi construído com muito aprendizado, iteração e dedicação. Obrigado a todos que contribuíram com feedback, ideias e suporte!

---

**#BuildInPublic #Startup #Marketplace #ReactNative #Supabase #Stripe #CNH #AutoEscola #TechBrasil**

---

*Última atualização: Dezembro 2024*
