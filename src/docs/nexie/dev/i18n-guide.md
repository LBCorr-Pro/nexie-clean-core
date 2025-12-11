# Guia de Internacionalização (i18n) com `next-intl`

Este documento detalha o processo para adicionar e gerenciar traduções no projeto, que utiliza a biblioteca `next-intl`.

## 1. O Fluxo de Detecção de Idioma

O sistema é projetado para determinar o idioma do usuário de forma inteligente e persistente.

1.  **Cookie Primeiro:** O `middleware.ts` primeiro verifica se existe um cookie chamado `NEXT_LOCALE`. Se existir, seu valor será usado como o idioma preferido, garantindo que a escolha do usuário seja mantida entre as sessões.
2.  **Fallback para o Navegador:** Se o cookie não for encontrado, o middleware inspeciona o cabeçalho `Accept-Language` da requisição para determinar o idioma preferido do navegador do usuário.
3.  **Fallback para Inglês:** Se o idioma do navegador não for um dos idiomas suportados pela aplicação (definidos na lista `locales`), o sistema redirecionará o usuário para a versão em **Inglês (`/en`)** como um padrão seguro.
4.  **Padrão do Sistema:** Se nenhuma das opções acima funcionar, ele usará o `defaultLocale` definido, que é Português (`pt-BR`).

## 2. A Estrutura de Tradução Correta

A estrutura de arquivos de tradução é centralizada em um único diretório na **raiz do projeto**.

### ⚠️ Ponto Crítico: Localização do Diretório

**O diretório `locales` DEVE estar na raiz do projeto.** Não deve haver nenhum outro diretório `locales` dentro de `src/app` ou em qualquer outro lugar. A existência de pastas duplicadas causa inconsistências e erros de tradução.

```
/
├── locales/      <-- CORRETO. Única fonte da verdade.
│   ├── en.json
│   ├── es.json
│   └── pt-BR.json
├── src/
│   └── app/
│       └── ...
└── ...
```

Dentro de cada arquivo, os textos são organizados em **namespaces**. Estes são objetos JSON de nível superior que agrupam traduções por contexto (ex: `common`, `dashboard`).

## 3. Passo a Passo para Adicionar Novas Traduções

1.  **Vá para a Pasta Raiz:** Navegue até o diretório `locales` na raiz do projeto.
2.  **Abra os Arquivos de Idioma:** Abra os arquivos `en.json`, `pt-BR.json`, e `es.json`.
3.  **Identifique ou Crie o Namespace:** Decida a qual grupo o texto pertence (ex: `common`). Se necessário, crie um novo namespace em **todos** os arquivos.
4.  **Adicione a Chave de Tradução:** Dentro do namespace, adicione a nova chave e o texto. Faça isso para **todos os idiomas**.
5.  **Use o Hook no Componente:** No seu componente (`"use client";`), chame `useTranslations` com o nome do namespace para acessar os textos.

    ```tsx
    "use client";

    import { useTranslations } from 'next-intl';

    export default function UserMenu() {
      const t = useTranslations('common');
      return <button>{t('logout')}</button>;
    }
    ```
