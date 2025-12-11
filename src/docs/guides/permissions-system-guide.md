# Guia do Sistema de Permissões (useUserPermissions)

Este documento é a **fonte única da verdade** sobre como o sistema de permissões do usuário funciona. Ele detalha a lógica e a hierarquia de concessão de acesso que o hook `useUserPermissions` implementa.

---

## 1. Visão Geral e Propósito

O hook `useUserPermissions` é o ponto central de controle de acesso em toda a aplicação. Sua responsabilidade é determinar, com base em uma série de regras e contextos, quais permissões o usuário logado possui. **Nenhum outro componente deve tentar calcular ou adivinhar permissões.**

Ele retorna um objeto contendo:
-   `permissions`: Um objeto onde as chaves são as `PermissionId` e os valores são `true` ou `false`.
-   `hasPermission(permissionKey)`: Uma função helper que deve ser usada para verificar se o usuário tem uma permissão específica.
-   `isLoadingPermissions`: Um booleano que indica se a lógica de permissão ainda está em execução.
-   `authStatus`: O status da autenticação do Firebase ('loading', 'authenticated', 'unauthenticated').
-   `currentUser`: O objeto de usuário do Firebase.

## 2. A Hierarquia de Concessão de Permissão

O hook funciona com uma hierarquia de prioridade estrita para determinar as permissões. Ele para no primeiro nível que se aplica, garantindo que os níveis mais altos sempre sobrescrevam os mais baixos.

### Nível 1 (Máxima Prioridade): Modo Desenvolvedor

-   **Condição:** A variável de ambiente `NEXT_PUBLIC_DEV_MODE` está definida como `"true"`.
-   **Lógica:** Se esta condição for atendida, o hook **imediatamente** concede **TODAS as permissões disponíveis no sistema** (`ALL_PERMISSIONS_TRUE`).
-   **Propósito:** Fornecer aos desenvolvedores acesso irrestrito para testar todas as funcionalidades sem se preocupar com as regras de acesso. É a "chave mestra".

### Nível 2: Contexto Master Global

-   **Condição:** O usuário está autenticado, não está no Modo Dev, e está operando no contexto "Master Global" (ou seja, não está "atuando como" uma instância). O hook verifica isso com a condição `!actingAsInstanceId && !subInstanceId`.
-   **Lógica:** Se estas condições forem atendidas, o hook concede **TODAS as permissões disponíveis**, tratando o usuário como um superadministrador do sistema.
-   **Propósito:** Dar aos administradores principais do sistema controle total sobre todas as instâncias e configurações globais.

### Nível 3: Permissões de Instância (Baseadas em Nível de Acesso)

-   **Condição:** O usuário está autenticado, não está em nenhum dos modos acima, e está atuando no contexto de uma instância (`actingAsInstanceId` está definido).
-   **Lógica:** Esta é a lógica padrão para usuários de uma instância:
    1.  O hook busca o documento do usuário dentro da coleção de usuários da instância (ex: `Global/{instanceId}/users/{userId}`).
    2.  Ele lê a propriedade `accessLevelTemplateId` deste documento.
    3.  Se um ID de template for encontrado, o hook busca o documento correspondente na coleção de templates globais (`Global/master/config/access_levels/templates/{templateId}`).
    4.  Ele então carrega o objeto `permissions` de dentro do template e define o estado de permissões do usuário com base nele.
-   **Propósito:** Implementar o sistema de Role-Based Access Control (RBAC), onde as permissões de um usuário são definidas pelo "Nível de Acesso" que lhe foi atribuído.

### Nível 4 (Fallback): Sem Permissões

-   **Condição:** Se nenhuma das condições acima for atendida (ex: usuário não autenticado, ou usuário de instância sem um nível de acesso definido).
-   **Lógica:** O hook retorna um objeto onde todas as permissões são `false`.
-   **Propósito:** Garantir que, por padrão, o acesso seja negado (princípio de "fail-safe").

## 3. Resolução do Bug "Permissions (0)"

O bug persistente que exibia "Permissions (0)" no painel de debug, mesmo para um desenvolvedor com acesso total, era causado por uma **condição de corrida** entre o `useUserPermissions` e o `useInstanceActingContext`.

A correção definitiva envolveu tornar o `useInstanceActingContext` mais robusto, garantindo que o estado `isActingAsMaster` só fosse atualizado **após** a leitura do `localStorage` estar completa. Isso eliminou a inconsistência de estado que fazia o `useUserPermissions` executar sua lógica com dados obsoletos.

**Conclusão:** O sistema agora está estável. O painel de debug reflete corretamente as permissões concedidas, e a hierarquia de acesso funciona conforme projetado.
