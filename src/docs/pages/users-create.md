
# Documentação da Página: Criação de Usuário (Admin)

Este documento detalha o funcionamento e a lógica da página de "Criação de Usuário", localizada em `src/app/[locale]/(app)/users/create/page.tsx`.

---

## 1. Visão Geral e Propósito

Esta página permite que um administrador com as permissões adequadas (`'master.users.create_global'` ou `'instance.users.invite'`) crie ou convide um novo usuário para o sistema.

A página é um **Componente "Master"** que implementa a arquitetura de re-exportação (Proxy) para diferentes contextos, como instâncias e sub-instâncias.

## 2. Lógica de Funcionamento

A criação de um usuário é gerenciada pelo hook customizado `useUserForm`, que abstrai a complexidade do formulário e da comunicação com o backend.

### a. Carregamento dos Campos Customizados

-   Similar à página de edição, o formulário é construído dinamicamente.
-   O hook `useUserForm` busca as configurações de campos de usuário do Firestore (seja do Master ou da instância atual, dependendo do `instanceId`).
-   Enquanto os dados são carregados, um `Skeleton` é exibido.

### b. Geração do Schema de Validação

-   Um schema **Zod** é gerado dinamicamente com base nos campos (padrão e customizados) retornados. Isso garante que o formulário sempre obedeça às regras de negócio atuais, sem código hardcoded.
-   Campos obrigatórios no Firestore são marcados como tal no schema Zod para validação no client-side.

### c. Processo de Submissão e Criação

1.  **Validação:** Os dados do formulário são validados pelo `react-hook-form` usando o resolver do Zod.
2.  **Criação do Documento no Firestore:** A função `onSubmit` do hook `useUserForm` é chamada. Ela constrói o objeto do novo usuário e utiliza a função `addDoc` do Firestore para criar um novo documento.
3.  **Redirecionamento:** Após a criação, o administrador é redirecionado para a página de listagem de usuários.

#### **Exemplo de Código: Criando um Documento no Firestore**

O padrão para criar documentos é similar ao de atualização, sendo encapsulado no hook para manter os componentes da UI limpos.

```typescript
// Em um hook como: src/hooks/use-user-form.ts

import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { refs } from '@/lib/firestore-refs'; // **OBRIGATÓRIO**

// ...

// Função para criar um novo usuário no Firestore
const createUser = async (data: NewUserProfile) => {
  // A referência à coleção DEVE ser obtida através do objeto `refs`
  const usersCollectionRef = refs.users();

  try {
    // Adiciona um novo documento à coleção
    await addDoc(usersCollectionRef, {
      ...data,
      createdAt: serverTimestamp(), // Usa o timestamp do servidor para a criação
      updatedAt: serverTimestamp(), // Inicializa com o mesmo valor
    });

    toast({
      title: "Sucesso",
      description: "Novo usuário criado com sucesso.",
    });

  } catch (error) {
    console.error("Erro ao criar novo usuário:", error);
    toast({
      variant: "destructive",
      title: "Erro",
      description: "Não foi possível criar o novo usuário.",
    });
  }
};

// No componente de página (ex: UserCreatePage)
// O formulário invoca a função do hook na submissão.
// const { form, onSubmit, isSubmitting } = useUserForm();
// <form onSubmit={form.handleSubmit(onSubmit)}> ... </form>
```

-   **Boas Práticas:**
    -   **NUNCA** use `collection(db, 'users')`. **SEMPRE** utilize `refs.users()`.
    -   Use `serverTimestamp()` do Firestore para garantir que os registros de data e hora sejam consistentes e definidos pelo servidor.
    -   Centralize o feedback ao usuário (sucesso/erro) dentro da função de serviço para reutilização e consistência.
