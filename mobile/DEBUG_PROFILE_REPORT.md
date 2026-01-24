
# 🐞 Relatório de Debug: Tela de Perfil

**Status:** Investigação Sistemática Concluída
**Agente:** Debugger (Antigravity)
**Alvo:** `mobile/app/(tabs)/perfil.tsx`

---

## 🔍 Resumo da Investigação
Uma análise estática profunda utilizando o protocolo "Systematic Debugging" identificou 3 problemas potenciais na lógica da tela de perfil, variando de **vazamento de recursos (storage bloat)** a **experiência do usuário inconsistente**.

---

## 1. Vazamento de Storage (Orphan Files)
### 🔴 O Problema
Sempre que um usuário altera a foto de perfil, um novo arquivo é criado e o antigo **permanece no storage para sempre**.

### 🔬 Análise de Causa Raiz (5 Whys)
1. **Por que o storage cresce indefinidamente?**
   R: O código de upload cria novos arquivos sem deletar os antigos.
2. **Por que cria novos arquivos?**
   R: O `fileName` é gerado usando `Date.now()`: 
   ```typescript
   const fileName = `${user?.id}/${Date.now()}.${fileExt}`;
   ```
3. **Por que isso é um problema se usamos `upsert: true`?**
   R: O `upsert` só sobrescreve se o nome do arquivo for idêntico. Como o timestamp muda, o nome nunca é igual.
4. **Resultado:** Se um usuário trocar de foto 10 vezes, terá 10 fotos no bucket `avatars`, ocupando espaço desnecessário e aumentando custos.

### ✅ Correção Recomendada
Alterar a estratégia de nomeação para um nome fixo por usuário (ex: `avatar.jpg`) OU implementar a deleção do arquivo anterior antes do upload.
**Sugestão:** Usar `${user?.id}/avatar.${fileExt}` com `upsert: true` garante que o arquivo seja substituído.

---

## 2. Falta de Feedback em Tempo Real (Instructor Status)
### 🟡 O Problema
O status do instrutor (`none`, `pending`, `approved`) é carregado apenas ao montar o componente. Se um admin aprovar o instrutor enquanto ele usa o app, a tela não atualiza.

### 🔬 Análise
- O hook `useInstructorStatus` busca dados apenas no `useEffect` inicial.
- Não há assinatura de eventos `realtime` do Supabase para a tabela `instructors`.
- O usuário precisa fazer um "pull-to-refresh" manual (que chama `onRefresh` -> `fetchStats` e `fetchAvatarUrl`), mas **NÃO** chama `useInstructorStatus().refresh()`.

### ✅ Correção Recomendada
Adicionar `refresh` do hook de instrutor na função `onRefresh` da tela de perfil:
```typescript
const { refresh: refreshInstructor } = useInstructorStatus();
// ...
const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
        fetchStats(),
        fetchAvatarUrl(),
        refreshInstructor() // Adicionar isso
    ]);
    setRefreshing(false);
}, [fetchStats, fetchAvatarUrl, refreshInstructor]);
```

---

## 3. Dados Estáticos (Study Streak)
### 🟡 O Problema
A estatística "Ofensiva" (Study Streak) está hardcoded como `0`.

### 🔬 Análise
Linha 89: 
```typescript
studyStreak: 0, // Would need to calculate from daily_study_activities
```
Isso desmotiva o usuário.

### ✅ Correção Recomendada
Criar uma Edge Function ou query RPC para calcular a ofensiva real baseada na tabela `daily_study_activities` ou implementar a lógica simples no client se a tabela estiver acessível.

---

## 🛠️ Plano de Ação Imediata

Vou aplicar as correções para os itens 1 (Storage Leaks) e 2 (Refresh Sync) agora mesmo, pois são correções de baixo risco e alto valor.

1. **Refatorar Upload:** Fixar nome do arquivo ou limpar anterior.
2. **Sincronizar Refresh:** Atualizar status de instrutor ao arrastar.

Deseja que eu prossiga com essas correções?
