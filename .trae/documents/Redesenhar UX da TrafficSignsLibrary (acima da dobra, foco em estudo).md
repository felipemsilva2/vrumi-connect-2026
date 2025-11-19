## Objetivos de UX
- Tornar o modo de estudo visível imediatamente, sem rolagem.
- Priorizar funcionalidades principais (estudar, buscar, filtrar) na área acima da dobra.
- Simplificar interações e reduzir ações desnecessárias.
- Garantir navegação clara, hierarquia visual forte e responsividade.

## Arquitetura da Página
- Cabeçalho compacto com título, breadcrumb e breve descrição.
- Barra de ferramentas acima da dobra com:
  - Painel de "Modalidades de Estudo" (StudyModesPanel) sempre visível e expandido.
  - Busca e filtro de categoria em um layout compacto e responsivo.
- Grade de placas abaixo, mantendo performance e feedback de carregamento.

## Layout Acima da Dobra
- Inserir `StudyModesPanel` logo após o cabeçalho, antes de busca/filtros:
  - Props: `signsCount={filteredSigns.length}`, `category={selectedCategory === 'Todas' ? 'Todas as Categorias' : selectedCategory}`.
  - Callbacks: `onStartLinear={startFlashcardMode}`, `onStartSmart={startSmartFlashcardMode}`, `onStartChallenge={startTimedChallenge}`, `onOpenModal={() => setStudyModeModalOpen(true)}`.
  - `isInitiallyOpen={true}` para manter expandido e visível.
- Reestruturar busca/filtros para ocupar uma única linha com prioridade de foco:
  - Campo de busca à esquerda (largura flexível).
  - Seleção de categoria à direita (dropdown).
  - Botão "Limpar" quando houver filtros ativos.

## Comportamento Responsivo
- Desktop: duas linhas acima da dobra (1) Painel de estudo; (2) Barra de busca/filtro.
- Mobile:
  - Usar grid/tailwind para empilhar Painel de estudo acima e a barra de busca/filtro logo abaixo.
  - Manter botões grandes, toque-friendly e textos legíveis.

## Interações e Fluxos
- Início dos modos de estudo imediato via `StudyModesPanel` (sem necessidade de rolagem).
- Link "Ver todas as opções" abre `StudyModeModal` com detalhes e ação direta.
- Ao iniciar modo, manter a página no topo (já implementado) e destacar o painel com contagem de placas.

## Acessibilidade
- Manter e ampliar ARIA roles no painel (já existem em `StudyModesPanel`).
- Garantir foco visível ao navegar por teclado nos controles de busca/filtro e nos botões de estudo.
- Títulos e descrições com contraste adequado (dark/light).

## Implementação Técnica
- `src/pages/TrafficSignsLibrary.tsx`
  - Importar e renderizar `StudyModesPanel` logo após o cabeçalho, antes da `Card` de busca/filtros.
  - Passar os callbacks existentes (`startFlashcardMode`, `startSmartFlashcardMode`, `startTimedChallenge`).
  - Usar `studyModeModalOpen` para abrir/fechar `StudyModeModal` (atualmente declarado e não utilizado).
  - Compactar `Card` de busca/filtros em uma barra horizontal, reduzindo espaçamento superior.
  - Remover duplicação da grid (há dois blocos similares; manter apenas um). Referências atuais: `src/pages/TrafficSignsLibrary.tsx:254-297` e `src/pages/TrafficSignsLibrary.tsx:357-400`.
  - Opcional: adicionar `SmartBreadcrumb` no topo para navegação clara.
- `src/components/study/StudyModesPanel.tsx`
  - Utilizar como componente primário para acesso aos modos (já pronto, com tracking e ARIA).
- `src/components/study/StudyModeModal.tsx`
  - Abrir via botão "Ver todas as opções" do painel; fechar retornando à biblioteca.

## Hierarquia Visual
- Hero simples com título "Biblioteca de Placas" e breadcrumb.
- Painel de estudo com destaque (borda esquerda colorida e sombra), ícone, contagem e botões principais.
- Barra de busca/filtros com ícones discretos, campo de busca de largura total e dropdown de categoria.
- Conteúdo secundário (grade) abaixo, sem competir com as ações primárias.

## Testes Automatizados
- Atualizar/expandir testes em `src/__tests__/TrafficSignsLibrary.spec.tsx`:
  - Verificar render imediato de: "Estudo Linear", "Estudo Inteligente", "Desafio 60s", campo de busca e seletor de categoria.
  - Garantir que `StudyModesPanel` está expandido na primeira renderização.
  - Testar callbacks: clicar nos botões inicia o modo e mantém o topo.

## Testes de Usabilidade com Usuários
- Cenários:
  - Tarefa 1: Iniciar "Estudo Inteligente" a partir da página inicial sem rolar.
  - Tarefa 2: Filtrar por categoria e iniciar "Desafio 60s" sem rolar.
  - Tarefa 3: Usar busca, ver resultados e iniciar "Estudo Linear".
- Métricas: tempo para iniciar modo (<5s), cliques até iniciar (≤2), taxa de sucesso (>90%).
- Execução: 5–8 usuários, moderado remoto (30–40 min), registrar telas e eventos (usar `utils/studyAnalytics.ts`).

## Instrumentação e Métricas
- Eventos: expand/collapse do painel, clique em cada modo, interação com busca e categoria, inicia/encerra modos.
- Dashboards: usar logs existentes e exportações simples para análise inicial.

## Rollout e Mitigação
- Lançar como atualização direta (sem alterar rotas).
- Reverter facilmente mantendo os componentes originais.
- Riscos: saturação visual em telas pequenas — endereçado por ordem e espaçamentos otimizados.

## Próximos Passos
- Implementar a realocação do `StudyModesPanel` e compactar busca/filtros.
- Conectar `studyModeModalOpen` ao painel.
- Unificar grid duplicada.
- Escrever/rodar testes e validar.
- Conduzir teste com usuários e coletar métricas para iteração.