# Guia de Referências do Firestore: Master vs. Instance

Este documento detalha a arquitetura e o uso correto do módulo `src/lib/firestore-refs.ts`, que é fundamental para garantir a consistência e a integridade dos dados no Firestore, especialmente em um ambiente multi-instância (multi-tenant).

## O Problema: Consistência de Dados em Múltiplas Instâncias

Em uma arquitetura multi-instância, os dados são segregados em duas categorias principais:

1.  **Dados Master:** Dados globais que não pertencem a nenhuma instância específica. Exemplos incluem configurações de templates, módulos disponíveis e permissões de superusuário.
2.  **Dados de Instância:** Dados que pertencem a uma instância (tenant) específica. Exemplos incluem usuários, configurações, campanhas e qualquer outro dado operacional de um cliente.

Construir manualmente os caminhos das coleções e documentos do Firestore é uma prática perigosa que leva a erros difíceis de depurar, como:

-   Salvar dados de uma instância na coleção de outra.
-   Salvar dados de instância na coleção master (ou vice-versa).
-   Inconsistência na estrutura de subcoleções (ex: `instances/{instanceId}/users` vs. `users/{userId}`).

## A Solução: `firestore-refs.ts`

O arquivo `src/lib/firestore-refs.ts` é a **única fonte da verdade** para a criação de referências (`CollectionReference` e `DocumentReference`) do Firestore. Ele centraliza toda a lógica de construção de caminhos, garantindo que a estrutura do banco de dados seja sempre respeitada.

### Arquitetura e Uso

O módulo exporta um objeto `refs` que é dividido em duas seções principais: `master` e `instance`.

#### `refs.master`

Contém funções para acessar coleções e documentos globais.

**Exemplo:**

```typescript
import { refs } from '@/lib/firestore-refs';

// Obter a referência para a coleção de todos os módulos
const modulesRef = refs.master.moduleDefinitions();

// Obter a referência para o documento de um módulo específico
const moduleDocRef = refs.master.moduleDefinitionDoc('calc-genius');
```

#### `refs.instance`

Contém funções que **requerem um `instanceId`** como primeiro argumento para acessar dados específicos de uma instância.

**Exemplo:**

```typescript
import { refs } from '@/lib/firestore-refs';

const currentInstanceId = '...obtenha o ID da instância atual...';

// Referência para a coleção de usuários da instância atual
const usersRef = refs.instance.users(currentInstanceId);

// Referência para um usuário específico dentro da instância
const userDocRef = refs.instance.user(currentInstanceId, 'some-user-id');
```

### O Erro `instance.subinstance`

Um erro comum que pode surgir ao usar `firestore-refs.ts` de forma incorreta é a criação de um caminho inválido como `.../instances/subinstance/...`.

**Causa Raiz:**

Este erro ocorre quando uma função de `refs.instance` é chamada, mas o `instanceId` fornecido é, na verdade, uma subcoleção ou um nome de documento que não representa um ID de instância válido. Por exemplo:

```typescript
// Incorreto!
const instanceId = 'subinstances'; // Isso não é um ID de instância
const wrongRef = refs.instance.users(instanceId);
// Resultado: .../instances/subinstances/users - Inválido!
```

O erro também pode acontecer se a lógica de obtenção do ID da instância falhar e retornar um valor inesperado, como o nome de uma subcoleção.

**Solução:**

1.  **Garantir a Origem do `instanceId`:** Sempre valide de onde o `instanceId` está vindo. Ele deve ser obtido a partir do contexto de autenticação, dos parâmetros da URL ou de uma fonte confiável que represente a instância ativa.
2.  **Depuração:** Se encontrar um caminho inválido, rastreie a chamada para `refs.instance` e inspecione o valor da variável `instanceId` que está sendo passada. Isso revelará a origem do caminho incorreto.

### Regra de Ouro

**NUNCA construa caminhos do Firestore manualmente com `doc(db, ...)` ou `collection(db, ...)` para coleções e documentos dinâmicos. SEMPRE use o `refs` para garantir a consistência.**

O uso de `doc` e `collection` é permitido apenas para dados estáticos ou dentro do próprio `firestore-refs.ts`.