# 🏎️ Vrumi - O Uber das Aulas de Direção
O **Vrumi** é um marketplace inovador que conecta alunos a instrutores de trânsito de forma direta, simples e inteligente. O foco central é modernizar o processo de aprendizado prático, transformando a jornada de habilitação em uma experiência fluida, transparente e digital.
---
## 🎯 Hub de Conexão: Aluno ↔️ Instrutor
O Vrumi atua como o motor dessa conexão, oferecendo:
*   **Marketplace de Instrutores**: Alunos encontram profissionais próximos com avaliações reais, fotos dos veículos e preços transparentes.
*   **Agendamento Estilo On-Demand**: Sistema de reserva de aulas com calendário integrado, permitindo agendar e pagar em segundos.
*   **Validação Digital (QR Code)**: Sistema de segurança onde o aluno valida o início e fim da aula prática diretamente pelo app.
*   **Gestão de Pacotes e Checkout**: Integração completa com Stripe e Abacate Pay para compra de aulas avulsas ou pacotes promocionais.
## 🧠 Inteligência Artificial & Automação (Diferenciais)
Embora o foco seja o marketplace, a tecnologia de IA e automação é o que escala o negócio:
*   **Tutor IA Contextual**: Integrado no app para tirar dúvidas sobre legislação e conduta durante o processo de aprendizado.
*   **Automações de Pagamento**: Webhooks robustos que gerenciam repasses (Stripe Connect), cancelamentos e reembolsos automáticos.
*   **Traffic Data Scraper**: Ferramenta proprietária desenvolvida para coletar, categorizar e atualizar assets de legislação brasileira de forma automatizada.
## 🛠️ Stack Tecnológica
### **Mobile (iOS & Android)**
- **Expo / React Native**: App nativo com performance otimizada.
- **Supabase Realtime**: Para chat e atualizações de status de aulas em tempo real.
- **NativeWind (Tailwind CSS)**: UI moderna e responsiva.
### **Backend & Infra**
- **Supabase (PostgreSQL)**: Autenticação, banco de dados e Row Level Security (RLS).
- **Edge Functions (Deno)**: Processamento assíncrono e integração com APIs externas.
- **Google Gemini API**: Inteligência por trás do tutor e assistente.
---
Demonstração: https://youtu.be/O-6qCOXHoyo

## 🚀 Engenharia & Inovação
Este repositório reflete uma mentalidade de **"Construir para Escalar"**:
*   **Foco em IA**: A arquitetura foi desenhada para que a IA tenha contexto sobre o progresso do aluno e o perfil do instrutor.
*   **Autonomia Técnica**: Scripts personalizados (como o scraper de sinais) mostram a capacidade de resolver problemas de infraestrutura de dados de forma independente.
---
## 📂 Como Rodar o Projeto
1.  **Clone o repositório**:
    ```bash
    git clone https://github.com/seu-usuario/vrumi-dev.git
    ```
2.  **Instale as dependências**:
    ```bash
    npm install
    # ou para o mobile
    cd mobile && npm install
    ```
3.  **Inicie o projeto**:
    ```bash
    npm run dev
    ```
---
Vrumi: Movimentando o futuro do aprendizado de trânsito.
