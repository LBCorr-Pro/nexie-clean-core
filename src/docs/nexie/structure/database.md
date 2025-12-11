# Estrutura do Banco de Dados Firestore (Nexie)

Este documento descreve a arquitetura da estrutura de dados do Firestore para o projeto, com foco nas referências definidas em `src/lib/firestore-refs.ts`.

## Padrão de Nomenclatura

- **Coleções:** Usam `snake_case` (ex: `user_registration_fields`).
- **Documentos:** Usam `snake_case` (ex: `modules_config`).

## Estrutura Hierárquica

A estrutura do banco de dados segue um padrão hierárquico, começando com a coleção `Global`.

### Nível Raiz

- **Global (Coleção):** A coleção raiz que contém todas as instâncias e configurações globais.

### Nível de Instância

Dentro da coleção `Global`, cada documento representa uma instância ou a configuração "mestre".

- **master (Documento):** Contém as configurações e dados globais que se aplicam a todo o sistema.
- **[instanceId] (Documento):** Representa uma instância específica do aplicativo, com suas próprias configurações e dados.

### Padrão de Caminho: Coleção/Documento

O Firestore exige que os caminhos para documentos sempre tenham um número **par** de segmentos e os caminhos para coleções um número **ímpar**.

-   **Caminho para Coleção:** ÍMPAR (`colecao`, `colecao/documento/colecao`).
-   **Caminho para Documento:** PAR (`colecao/documento`, `colecao/documento/colecao/documento`).

**Exemplo Correto:**
`Global/master/config/modules_config` (4 segmentos)

**Exemplo Incorreto:**
`Global/master/ai_module_data` (3 segmentos) - Isso resultaria em um erro, pois tenta acessar um "documento" com um caminho ímpar. A solução é adicionar uma coleção intermediária, como `module_data`, tornando o caminho `Global/master/module_data/ai_module_data` (4 segmentos).

**Regra Absoluta:** Sempre conte os segmentos do caminho. Nunca utilize o conceito de "documento container" com um caminho ímpar.

### Estrutura Detalhada

#### Contexto `master`

O documento `master` contém as seguintes subcoleções e documentos:

- **config (Coleção):** Armazena todos os documentos de configuração global.
    - `access`: Documento que agrupa configurações de acesso.
        - `access_methods`: Coleção para diferentes métodos de acesso.
    - `modules_config`: Configurações de módulos.
        - `definitions`: Coleção de definições de módulos.
    - `app_menu_config`: Configurações do menu da aplicação.
        - `app_menu_groups`: Grupos de menu.
        - `app_menu_item_configs`: Itens de menu.
        - `menu_presets`: Presets de menu.
    - `general_settings`: Configurações gerais.
    - `appearance_settings`: Configurações de aparência.
        - `appearance_presets`: Presets de aparência.
        - `color_presets`: Presets de cor.
- **module_data (Coleção):** Uma coleção intermediária para armazenar dados de módulos.
    - `ai_module_data`: Documento que contém dados do módulo de IA.
        - `logs`: Coleção de logs de monitoramento.
    - `invite_module_data`: Documento que contém dados do módulo de convite.
        - `generated_invites`: Coleção de convites gerados.
- **plans (Coleção):** Coleção de planos de assinatura.
- **users (Coleção):** Coleção de usuários globais.
- **manual_articles (Coleção):** Coleção de artigos do manual.

#### Contexto de Instância (`instance`)

Cada documento de instância (`[instanceId]`) segue uma estrutura semelhante à do `master`, mas com configurações e dados específicos da instância.

- **config (Coleção):** Configurações específicas da instância.
- **users (Coleção):** Usuários da instância.
- **subinstances (Coleção):** Sub-instâncias da instância principal.

---

Este documento serve como uma referência para entender a estrutura do banco de dados e deve ser mantido atualizado conforme novas referências forem adicionadas ou modificadas em `src/lib/firestore-refs.ts`.
