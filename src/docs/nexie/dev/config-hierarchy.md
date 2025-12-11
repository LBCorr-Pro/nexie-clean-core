# Guia da Hierarquia de Configuração (Cascata de Herança)

Este documento detalha a arquitetura de fallback em 8 níveis para a busca de configurações, como aparência e menus. Esta é a fonte da verdade para a lógica que será implementada no hook `useNxDynamicMenu`.

## O Princípio: Do Mais Específico ao Mais Geral

A aplicação sempre tentará encontrar uma configuração no nível mais específico possível. Se não encontrar uma configuração personalizada nesse nível, ela "cai" para o próximo nível superior, e assim por diante, até chegar à configuração padrão codificada no sistema (`hardcoded`).

## A Cascata de Herança de 8 Níveis

A ordem exata de busca para uma configuração é a seguinte:

1.  **Sub-instância Atual:**
    -   **Caminho:** `/Global/{instanceId}/subinstances/{subInstanceId}/config/...`
    -   **Verificação:** O sistema verifica se existe um documento de configuração (ex: `appearance_settings`) e se o campo `customized` neste documento é `true`.

2.  **Sub-instância Master do Plano:**
    -   **Caminho:** `/Global/{instanceId}/subinstances/{master-plan-subinstance-id}/config/...`
    -   **Lógica:** O sistema identifica o plano da instância pai e procura por uma sub-instância que esteja marcada como "master" para aquele plano.

3.  **Sub-instância Master Geral:**
    -   **Caminho:** `/Global/{instanceId}/subinstances/{general-master-subinstance-id}/config/...`
    -   **Lógica:** Procura por uma sub-instância dentro da instância pai que esteja marcada como "master geral".

4.  **Instância Pai:**
    -   **Caminho:** `/Global/{instanceId}/config/...`
    -   **Verificação:** Verifica o documento de configuração da própria instância pai.

5.  **Instância Master do Plano:**
    -   **Caminho:** `/Global/{master-plan-instance-id}/config/...`
    -   **Lógica:** Procura por uma instância global marcada como "master" para o plano da instância pai.

6.  **Instância Master Geral:**
    -   **Caminho:** `/Global/{general-master-instance-id}/config/...`
    -   **Lógica:** Procura por uma instância global marcada como "master geral".

7.  **Master (Global):**
    -   **Caminho:** `/Global/master/config/...`
    -   **Lógica:** A configuração padrão de todo o sistema.

8.  **Hardcoded (Código):**
    -   **Local:** Ex: `src/lib/default-appearance.ts`
    -   **Lógica:** Se nenhum documento for encontrado em toda a cascata do Firestore, a aplicação usa o objeto de configuração padrão definido no código como último recurso.

## Implementação

Esta lógica será encapsulada dentro do novo hook `useNxDynamicMenu`. Ele realizará uma série de `getDoc` condicionais, seguindo a ordem acima, até encontrar a primeira configuração válida e personalizada (ou chegar ao `master` ou `hardcoded`). O resultado será um único objeto de configuração que o resto da aplicação poderá consumir de forma transparente, sem precisar conhecer a complexidade da busca.