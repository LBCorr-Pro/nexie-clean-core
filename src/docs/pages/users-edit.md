
# Documentação da Página: Edição de Usuário (Admin)

Este documento detalha o funcionamento e a lógica da página de "Edição de Usuário", localizada em `src/app/[locale]/(app)/users/user/[userId]/edit/page.tsx`.

---

## 1. Visão Geral e Propósito

Esta página permite que um administrador com as permissões adequadas (`'master.users.update_global'` ou `'instance.users.edit_details'`) edite as informações de um usuário existente.

A página é um **Componente "Master"** que é renderizado através de múltiplos pontos de entrada "Proxy", seguindo a arquitetura fundamental do sistema.

## 2. Lógica de Funcionamento

O componente `UserEditPage` utiliza o hook customizado `useUserProfile` para gerenciar o ciclo de vida dos dados do usuário.

### a. Carregamento de Dados (`loading`)

-   Ao montar, o hook `useUserProfile(userId)` é chamado.
-   Ele busca os dados do usuário e a configuração dos campos customizados (do Master ou da Instância) do Firestore.
-   Durante o carregamento, um componente `Skeleton` é exibido para manter a consistência da UI.

### b. Geração Dinâmica do Formulário

-   **Fonte da Verdade:** A configuração dos campos de usuário (padrão e customizados) é a única fonte da verdade para a construção do formulário.
-   **Schema Dinâmico com Zod:** Um schema de validação do Zod é gerado dinamicamente com base nos campos customizados carregados do Firestore. Isso garante que as validações reflitam sempre a configuração atual do sistema, sem hardcoding.
-   **Renderização de Campos:** O formulário itera sobre a lista de campos configurados e renderiza os componentes de input apropriados (`Input`, `Select`, `Checkbox`, etc.).

### c. Processo de Submissão

1.  **Validação:** Os dados do formulário são validados contra o schema Zod dinâmico.
2.  **Atualização no Firestore:** A função `onSubmit` monta um objeto com os dados atualizados e usa a função `updateDoc` do Firestore para salvar as alterações.
3.  **Redirecionamento:** Após salvar, o administrador é redirecionado de volta para a página de listagem de usuários.

#### **Exemplo de Código: Atualizando um Documento no Firestore**

O padrão de atualização de documentos deve ser feito na camada de serviço ou hook, encapsulando a chamada do Firestore. O componente da UI apenas invoca a função do hook, passando os dados validados.

```typescript
// Em um hook como: src/hooks/use-user-profile.ts

import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase'; // Instância do Firestore
import { refs } from '@/lib/firestore-refs'; // **OBRIGATÓRIO** usar as referências

// ...

// Função para atualizar o usuário
const updateUser = async (userId: string, data: Partial<UserProfile>) => {
  // A referência ao documento DEVE ser obtida através do objeto `refs`
  const userDocRef = doc(refs.users(), userId);

  try {
    // Usa updateDoc para alterar apenas os campos fornecidos
    await updateDoc(userDocRef, {
      ...data,
      updatedAt: new Date(), // Sempre atualiza a data de modificação
    });
    
    // Dispara um toast de sucesso para o usuário
    toast({
      title: "Sucesso",
      description: "Usuário atualizado com sucesso.",
    });

  } catch (error) {
    // Em caso de erro, loga e notifica o usuário
    console.error("Erro ao atualizar usuário:", error);
    toast({
      variant: "destructive",
      title: "Erro",
      description: "Não foi possível salvar as alterações.",
    });
  }
};

// No componente de página (ex: UserEditPage)
// O formulário, ao ser submetido, chama a função do hook.
// const { form, onSubmit, isSubmitting } = useUserProfile(userId);
// <form onSubmit={form.handleSubmit(onSubmit)}> ... </form>
```

-   **Boas Práticas:**
    -   **NUNCA** construa o caminho do documento manualmente (ex: `doc(db, 'users', userId)`). **SEMPRE** use o `refs`.
    -   A lógica de `updateDoc` e o tratamento de erros devem ficar no hook, não no componente.
    -   Sempre forneça feedback ao usuário (sucesso ou erro) usando o sistema de `toast`.
