# Guia Definitivo de Tradução (next-intl)

Este documento é a **única fonte da verdade** sobre como o sistema de internacionalização (i18n) funciona neste projeto.

## O Princípio Fundamental: Um Arquivo por Idioma

Para simplificar a manutenção, a estrutura foi consolidada. Agora, **cada idioma possui um único arquivo JSON**, que contém todos os namespaces de tradução.

### Estrutura de Arquivos

A estrutura é estritamente a seguinte na **raiz do projeto**:

`locales/[código-do-idioma].json`

-   **[código-do-idioma]:** `pt-BR`, `en`, `es`.
-   Dentro de cada arquivo, os textos são organizados em **namespaces** (objetos JSON de nível superior como `common`, `dashboard`).

**Exemplo (`locales/pt-BR.json`):**
```json
{
  "common": {
    "save": "Salvar",
    "cancel": "Cancelar"
  },
  "dashboard": {
    "title": "Painel de Controle"
  }
}
```

## Como Usar em Componentes (Padrão Obrigatório)

Para usar as traduções, siga **exatamente** este padrão.

### 1. Importe `useTranslations`

```javascript
import { useTranslations } from 'next-intl';
```

### 2. Carregue o Namespace

Dentro do seu componente (`"use client"`), chame o hook `useTranslations` passando o **nome do namespace** que você deseja usar como uma string.

### 3. Chame a Função de Tradução `t`

O hook retorna uma **função** (geralmente chamada de `t`). Você **deve chamar esta função** passando a chave da tradução como um argumento.

### Exemplo de Código Funcional e Completo
```tsx
// src/app/components/ExemploDeComponente.tsx
"use client";
import { useTranslations } from 'next-intl';

export default function ExemploDeComponente() {
  const tUser = useTranslations('userManagement');
  const tCommon = useTranslations('common');

  return (
    <div>
      {/* PADRÃO CORRETO ✅: Chama a função com a string da chave. */}
      <h1>{tUser('title')}</h1>
      <p>{tUser('description')}</p>
      
      <button type="button">{tCommon('save')}</button>

      {/* ERRO INACEITÁVEL ❌: Tentar acessar como uma propriedade. */}
      {/* <h1>{tUser.title}</h1> */}
    </div>
  );
}
```

---

## Resumo das Regras Inquebráveis

1.  A estrutura de arquivos é `locales/[idioma].json` na raiz do projeto.
2.  Para carregar um grupo de traduções, use `useTranslations('namespace')`.
3.  **SEMPRE** chame a função `t` para obter o texto: `t('minha-chave')`.

A violação desses princípios, especialmente tentar acessar `t.chave`, é um erro inaceitável que introduz bugs conhecidos.
