## Opções Avaliadas
- React PDF Viewer (`@react-pdf-viewer/core`): viewer modular, plugins prontos (toolbar, zoom, scroll, virtualização), boa responsividade.
- PDF.js Official Viewer embutido (iframe): UI completa e estável, pinch-zoom funciona, menos integração com React.
- Renderização por imagens (SSR ou pré-processamento): performance máxima em mobile, mas perde seleção de texto e aumenta complexidade.

## Recomendação
- Adotar React PDF Viewer com layout mínimo e plugins de zoom/scroll, mantendo integração 100% React e compatível com nossa arquitetura.
- Motivos: melhor UX mobile (scroll vertical, virtualização), zoom com UI pronta, fácil personalização e tema, sem dependência de iframe.

## Implementação Técnica (faseada)
### Fase 1: Introdução do novo leitor (sem remover o atual)
1. Instalar dependências:
   - `@react-pdf-viewer/core @react-pdf-viewer/default-layout @react-pdf-viewer/zoom @react-pdf-viewer/scroll-mode`
2. Criar componente `MobilePDFReader`:
   - Usa `Viewer` com opções `defaultScale: SpecialZoomLevel.PageWidth`, `scrollMode: Vertical`.
   - Plugins: Zoom, ScrollMode, Toolbar mínima (sem sidebar), loader leve.
   - Configurar `characterMap` e `workerSrc` via CDN para performance.
3. Encapsular em `PDFReaderAdapter`:
   - Interface comum: `getCurrentFile()`, `getCurrentPage()` (compatível com `StudyRoom`), callbacks de page change.
4. Switch de runtime em `StudyRoom` (mobile):
   - Se `isMobile`, usar `MobilePDFReader`; desktop mantém `PDFViewer` atual.

### Fase 2: UX Mobile avançada
1. Ativar `PageWidth` por padrão; oferecer zoom via popover.
2. Scroll suave e virtualização: renderizar apenas páginas visíveis.
3. Prefetch da próxima página.
4. Pinch-zoom: habilitar plugin/gesto (ou mapping para zoomTo) quando disponível.

### Fase 3: Integração e fallback
1. Fallback para o viewer atual se houver erro de renderização.
2. Métricas de uso (opcional): coletar tempo de carregamento, taxa de erro.

## Ajustes de UI/Design
- Toolbar compacta com botões grandes (≥48x48).
- Título de documento e paginação visíveis; remover elementos não essenciais para mobile.
- Tema alinhado às variáveis Tailwind (cores/contraste), mantendo identidade visual.

## Performance
- Worker/CMAP via CDN; lazy loading de páginas; virtualização.
- Carregamento rápido mesmo em 3G; redução de memória em docs longos.

## Testes
- Dispositivos: iOS Safari/Chrome, Android Chrome/Firefox.
- Orientações: retrato/paisagem; sem necessidade de pinch/zoom para leitura.
- Casos: troca de páginas, zoom, scroll contínuo, fallback.

## Entregáveis
- Componente `MobilePDFReader` com plugins configurados.
- Adapter e switch em `StudyRoom` apenas para mobile.
- Documentação de configuração e guia de testes.

## Próximo passo
- Ao aprovar, implemento a Fase 1 (componente, adapter e switch) e valido no app; depois sigo para Fases 2 e 3 conforme feedback.