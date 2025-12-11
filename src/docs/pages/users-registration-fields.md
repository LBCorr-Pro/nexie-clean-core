
# Documentação da Página: Campos de Registro de Usuário

Este documento detalha o funcionamento e a lógica da página de "Campos de Registro de Usuário", localizada em `src/app/[locale]/(app)/access/registration-fields-settings/page.tsx`.

---

## 1. Visão Geral e Propósito

Esta página permite que administradores configurem quais campos serão solicitados a um novo usuário durante o processo de registro. Ela é fundamental para a flexibilidade do sistema, permitindo que cada instância ou sub-instância defina seus próprios requisitos de dados.

## 2. Lógica de Funcionamento

O componente principal `RegistrationFieldsPage` utiliza o hook `useRegistrationFields` para abstrair toda a complexidade de busca, atualização e reordenação dos campos.

### a. Carregamento dos Campos

-   **Referência Dinâmica:** O hook `useRegistrationFields` utiliza o `instanceId` e `subInstanceId` (obtidos via `useParams`) para determinar qual coleção do Firestore deve ser consultada. Ele usa o objeto `refs` de `firestore-refs.ts` para construir a referência correta, seja para o Master, uma instância ou uma sub-instância.
-   **Busca e Ordenação:** Os campos são buscados da coleção `field_configs` e ordenados pela propriedade `order`.
-   **Estado de Carregamento:** Um `Skeleton` é exibido enquanto os dados estão sendo carregados.

### b. Drag-and-Drop (Arrastar e Soltar) para Reordenação

-   **Componente Reutilizável:** A funcionalidade de reordenação é implementada através de um componente `SortableList`, que utiliza a biblioteca `dnd-kit`.
-   **Atualização Otimista:** Ao arrastar e soltar um item, a UI é atualizada otimisticamente (o estado local é alterado imediatamente).
-   **Persistência em Lote:** Após a reordenação ser concluída (`onDrop`), uma única requisição em lote (`writeBatch` do Firestore) é enviada para atualizar a propriedade `order` de todos os campos afetados. Isso garante a atomicidade da operação e melhora a performance.

#### **Exemplo de Código: Atualização em Lote com `writeBatch`**

O uso de `writeBatch` é o padrão obrigatório para atualizar múltiplos documentos de forma atômica, especialmente em operações de reordenação.

```typescript
// Em um hook como: src/hooks/use-registration-fields.ts

import { writeBatch, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { refs } from '@/lib/firestore-refs'; // **OBRIGATÓRIO**

// ...

// Função chamada após o usuário reordenar os itens na UI
const handleReorder = async (reorderedFields: CustomField[]) => {
  // 1. Inicia um batch de escrita
  const batch = writeBatch(db);

  // 2. Itera sobre os campos reordenados para preparar as atualizações
  reorderedFields.forEach((field, index) => {
    // A referência ao documento DEVE vir do `refs`
    const fieldRef = doc(refs.userRegistrationFields(instanceId), field.id);
    
    // Adiciona a operação de atualização ao batch
    batch.update(fieldRef, { order: index });
  });

  try {
    // 3. Commita o batch - todas as operações são executadas atomicamente
    await batch.commit();
    toast({ title: "Ordem salva com sucesso!" });

  } catch (error) {
    console.error("Erro ao salvar a nova ordem:", error);
    toast({
      variant: "destructive",
      title: "Erro",
      description: "Não foi possível salvar a ordenação.",
    });
    // Reverte a UI para o estado anterior em caso de falha
  }
};
```

### c. Ações (Criar, Editar, Habilitar/Desabilitar)

-   **Diálogos de Formulário:** A criação e edição de campos são feitas através de um `Dialog` (`FormFieldDialog`) que contém um formulário validado com Zod.
-   **Toggle de Status:** A habilitação ou desabilitação de um campo é feita por um componente `Switch` que, ao ser alterado, chama diretamente uma função de atualização no hook, alterando o booleano `enabled` no documento do Firestore correspondente.
