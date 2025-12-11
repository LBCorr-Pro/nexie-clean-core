
# Documentação da Página: Gerenciamento de Usuários

Este documento detalha o funcionamento da página de "Gerenciamento de Usuários", localizada em `src/app/[locale]/(app)/users/page.tsx`.

---

## 1. Visão Geral e Propósito

Esta página serve como o painel central para visualizar, pesquisar e gerenciar todos os usuários do sistema (no contexto Master) ou de uma instância específica.

Ela exibe uma lista paginada de usuários em uma tabela (`DataTable`) e fornece ações como criar, editar e excluir usuários, condicionadas às permissões do administrador logado.

## 2. Lógica de Funcionamento

A página utiliza o hook customizado `useUsers` para buscar e gerenciar os dados da lista de usuários.

### a. Busca de Dados e Paginação

-   **Hook Central:** `useUsers` é o responsável por interagir com o Firestore.
-   **Consulta Paginada:** Ele utiliza as funções `query`, `collection`, `where`, `limit` e `startAfter` do Firestore para buscar os usuários de forma paginada. Isso é crucial para a performance, evitando carregar milhares de registros de uma só vez.
-   **Filtragem e Ordenação:** O hook também aceita parâmetros para filtrar por nome/email e para ordenar os resultados.
-   **Estado de Carregamento:** Um estado `loading` é exposto para que a UI possa exibir um componente `Skeleton` enquanto os dados são carregados.

#### **Exemplo de Código: Buscando uma Coleção Paginada no Firestore**

A busca paginada é um padrão essencial para listas longas. A lógica deve ser encapsulada em um hook para ser reutilizável.

```typescript
// Em um hook como: src/hooks/use-users.ts

import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter, 
  getDocs, 
  Query, 
  DocumentData 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { refs } from '@/lib/firestore-refs'; // **OBRIGATÓRIO**

// ...

const [users, setUsers] = useState<User[]>([]);
const [lastDoc, setLastDoc] = useState<DocumentData | null>(null);
const [loading, setLoading] = useState(true);
const PAGE_SIZE = 20;

// Função para buscar a próxima página de usuários
const fetchUsers = async (searchTerm: string = '') => {
  setLoading(true);
  try {
    // 1. A referência à coleção DEVE vir de `refs`
    const usersCollectionRef = refs.users();
    
    // 2. Constrói a query base
    let q: Query<DocumentData> = query(
      usersCollectionRef,
      orderBy('name'), 
      limit(PAGE_SIZE)
    );

    // 3. Adiciona filtro de busca, se houver
    if (searchTerm) {
      q = query(q, where('name', '>=', searchTerm), where('name', '<=', searchTerm + '\uf8ff'));
    }

    // 4. Adiciona o cursor `startAfter` para paginação
    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }

    // 5. Executa a query
    const querySnapshot = await getDocs(q);
    const newUsers = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
    const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];

    setUsers(prev => [...prev, ...newUsers]);
    setLastDoc(lastVisible);

  } catch (err) {
    // Tratar erro
  } finally {
    setLoading(false);
  }
};
```

### b. Ações e Permissões

-   **Verificação de Permissão:** O hook `useAuthContext` é utilizado para obter a função `hasPermission`.
-   **Botões Condicionais:** Os botões de "Criar Usuário", "Editar" e "Excluir" só são renderizados ou ativados se o administrador possuir as permissões necessárias (ex: `master.users.create_global`).
-   **Ações na Tabela:** Cada linha da tabela possui um menu de ações (`DropdownMenu`) que permite editar ou excluir o usuário correspondente, novamente, sujeito às permissões.
