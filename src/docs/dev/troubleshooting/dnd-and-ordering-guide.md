# Guia de Solução: Ordenação com Drag-and-Drop e Setas

Este documento detalha a solução padrão para implementar funcionalidades de reordenação em listas, corrigindo o bug comum onde um item "pula de volta" para sua posição original após ser movido.

---

## 1. O Problema: "Item Pulando de Volta"

### Sintoma
Ao usar os botões de seta para cima/baixo ou ao arrastar e soltar um item em uma lista, o item se move visualmente por um instante, mas retorna imediatamente à sua posição original.

### Causa Raiz
Este comportamento é um sinal claro de que a **fonte da verdade da UI (o estado React) não está sendo atualizada corretamente** após a ação do usuário. A re-renderização do componente faz com que ele volte a usar o array de itens no seu estado original, desfazendo a mudança visual.

As causas comuns são:
1.  Não usar um estado local (`useState`) para gerenciar a ordem visual da lista.
2.  A função chamada pelo `onMoveUp`/`onMoveDown` ou `onSortEnd` não atualiza corretamente este estado local.
3.  O componente `SortableList` não recebe os itens no formato correto (sem uma propriedade `id` única).

---

## 2. A Arquitetura de Solução Correta

Para garantir que a ordenação funcione de forma previsível e robusta, siga estritamente esta arquitetura, que utiliza nossos componentes reutilizáveis.

### Componentes Essenciais
-   **`<SortableList>` (`@/components/shared/dnd/SortableList.tsx`):** Nosso wrapper para a biblioteca `dnd-kit` que gerencia a lógica de drag-and-drop.
-   **`<OrderControls>` (`@/components/shared/form/OrderControls.tsx`):** Renderiza os botões de seta para cima e para baixo.

### Passo 1: Gerenciamento de Estado
O componente que contém a lista **deve** ter seu próprio estado para controlar a ordem dos itens que estão sendo exibidos.

```tsx
// Exemplo em um componente como `GroupsTab.tsx`
const [displayGroups, setDisplayGroups] = useState<Group[]>(initialGroups);
const [hasUnsavedOrder, setHasUnsavedOrder] = useState(false);

// Sincroniza o estado local quando os dados iniciais mudam
useEffect(() => {
    setDisplayGroups(initialGroups);
}, [initialGroups]);
```

### Passo 2: Implementação do `<SortableList>`

A implementação correta do `<SortableList>` é crucial.

-   **Propriedade `items`:** O array passado para `items` **DEVE** conter objetos, e cada objeto **DEVE** ter uma propriedade `id` do tipo `string` que seja única. Se seus dados usam uma chave diferente (ex: `docId`), você precisa mapeá-la.
-   **Propriedade `onSortEnd`:** Esta função é chamada quando o usuário solta um item. Sua única responsabilidade é atualizar o estado local com a nova ordem.
-   **Propriedade `renderItem`:** Renderiza cada item da lista.

**Exemplo de Código:**
```tsx
<SortableList
    // CRÍTICO: Mapeie seu identificador único para a propriedade `id`.
    items={displayGroups.map(g => ({...g, id: g.docId}))}
    
    // Atualiza o estado local com a nova ordem e marca que há mudanças.
    onSortEnd={(newItems) => {
        setDisplayGroups(newItems);
        setHasUnsavedOrder(true);
    }}

    renderItem={(group, { attributes, listeners, isDragging }) => {
        // ... seu JSX para renderizar o item ...
        // O `listeners` deve ser aplicado no "pegador" (drag handle).
    }}
/>
```

### Passo 3: Implementação do `<OrderControls>` e `handleMove`

O `<OrderControls>` facilita a movimentação com as setas.

-   **Função `handleMove`:** Crie uma função que receba o índice atual e o novo índice, use a utilidade `arrayMove` (de `@dnd-kit/sortable`), e atualize o estado local.

**Exemplo de Código:**
```tsx
const handleMove = (from: number, to: number) => {
    if (to < 0 || to >= displayGroups.length) return;
    
    // Usa arrayMove para criar a nova lista ordenada
    const newItems = arrayMove(displayGroups, from, to);

    // Atualiza o estado local
    setDisplayGroups(newItems);
    setHasUnsavedOrder(true);
};

// Dentro do seu .map() ou renderItem:
<OrderControls
    onMoveUp={() => handleMove(currentIndex, currentIndex - 1)}
    onMoveDown={() => handleMove(currentIndex, currentIndex + 1)}
    isFirst={currentIndex === 0}
    isLast={currentIndex === displayGroups.length - 1}
/>
```

### Passo 4: Salvar a Ordem

A persistência da nova ordem no banco de dados só deve acontecer quando o usuário clicar em um botão "Salvar Ordem", que fica habilitado pelo estado `hasUnsavedOrder`.

```tsx
const onOrderSubmit = async () => {
    setIsSaving(true);
    const batch = writeBatch(db);

    // Itera sobre o estado LOCAL (`displayGroups`) para obter a nova ordem.
    displayGroups.forEach((group, index) => {
        const docRef = doc(collectionRef, group.docId);
        batch.update(docRef, { order: index * 10 }); // Multiplicar por 10 é uma boa prática
    });

    await batch.commit();
    setHasUnsavedOrder(false); // Desabilita o botão após salvar
    setIsSaving(false);
};

// No JSX:
<Button onClick={onOrderSubmit} disabled={!hasUnsavedOrder || isSaving}>
    Salvar Ordem
</Button>
```

---

## Resumo dos Pontos-Chave

1.  **Use um Estado Local:** Gerencie a ordem dos itens em um estado (`useState`).
2.  **Mapeie para `id`:** Garanta que cada item passado para `<SortableList>` tenha uma propriedade `id`.
3.  **Atualize o Estado:** As funções `onSortEnd` e `handleMove` devem chamar `setState` com a nova ordem do array.
4.  **Salve em Lote:** Use um botão "Salvar" separado, habilitado por um estado "sujo" (`dirty`), para persistir a ordem final no banco de dados.

Seguir este padrão garante que a UI reaja corretamente às ações do usuário e que os dados sejam salvos de forma eficiente e previsível.