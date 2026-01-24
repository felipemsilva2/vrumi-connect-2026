
# 🐞 Relatório de Debug: Links de Termos e Privacidade

**Agente:** Debugger (Antigravity)
**Alvo:** `mobile/app/(tabs)/perfil.tsx` e `mobile/app/connect/privacidade.tsx`

---

## 🔍 Problema Identificado
Os links para "Política de Privacidade" e "Termos de Uso" estão hardcoded para um domínio externo (`https://vrumi.com.br/...`), mas a tela de configurações de privacidade (`app/connect/privacidade.tsx`) já existe dentro do app e contém links internos que apenas recarregam a página atual (`router.push('/(tabs)/perfil')`).

Além disso, não encontramos o arquivo `app/connect/termos.tsx`, indicando que não há uma tela interna de termos de uso implementada.

### Situação Atual:
1.  **Tela de Perfil (`perfil.tsx`):**
    *   Botão "Política de Privacidade": Abre `https://vrumi.com.br/politica-de-privacidade` via `Linking`.
    *   Botão "Termos de Uso": Abre `https://vrumi.com.br/termos-de-uso` via `Linking`.
    *   Botão "Privacidade e Dados": Navega corretamente para interna `/connect/privacidade`.
2.  **Tela de Privacidade (`privacidade.tsx`):**
    *   Seção "Documentos Legais": Botões redirecionam de volta para `/(tabs)/perfil` (loop circular).

---

## 🛠️ Plano de Correção

### Passo 1: Padronizar Comportamento no Perfil
Vamos manter os links externos se o site for a fonte da verdade, **OU** (recomendado se o app for autônomo) apontar para telas internas se elas deveriam existir.
*Dado que `privacidade.tsx` existe, o botão de "Política de Privacidade" no perfil deveria levar para lá ou para uma rota interna que exiba o texto.*

### Passo 2: Corrigir Links Circulares em `privacidade.tsx`
Os botões em `privacidade.tsx` estão quebrados:
```typescript
onPress={() => {
    // Open privacy policy
    router.push('/(tabs)/perfil'); // ERRADO: Volta pro perfil
}}
```
Devem apontar para o link externo (consistência com o perfil) ou para uma tela de visualização de texto.

### 🚀 Ação Recomendada
Vou unificar a lógica para usar `Linking.openURL` em ambos os lugares, garantindo que o usuário acesse os documentos reais hospedados na web, já que não temos o conteúdo do texto legal no app (arquivo `termos.tsx` não existe).

**Correções a aplicar:**
1.  Em `privacidade.tsx`: Alterar `router.push` para `Linking.openURL` apontando para as URLs do site da Vrumi.
2.  Em `perfil.tsx`: Manter como está (já usa `Linking`), mas garantir que as URLs estão corretas/ativas.

Vou aplicar essa correção no arquivo `privacidade.tsx` agora.
