# Guia Definitivo para Criação e Edição de Páginas

Este documento é a **fonte única da verdade** para a criação e modificação de qualquer interface no projeto. Seguir estas diretrizes é **obrigatório** para garantir consistência, usabilidade, responsividade e a manutenibilidade do código.

---

## 1. O Padrão: "Client-Side First"

Por decisão de arquitetura, nosso sistema adota a estratégia **"Client-Side First"**.

-   **Diretriz:** Todos os componentes de página devem, por padrão, ser **Client Components**, utilizando a diretiva `"use client";` no topo do arquivo.
-   **Justificativa:** Esta abordagem simplifica o desenvolvimento, facilita a depuração e alinha-se perfeitamente com o modelo de segurança do Firebase (Security Rules), que opera no cliente. A interatividade e o gerenciamento de estado com hooks (`useState`, `useEffect`, etc.) tornam-se diretos.
-   **Exceções:** O uso de **Server Components** ou de uma **arquitetura híbrida** (Server Component que carrega um Client Component) será uma exceção, aplicada apenas em cenários específicos onde for estritamente necessário por razões de performance crítica (melhorar o carregamento inicial de páginas muito pesadas) ou segurança (executar lógica com chaves secretas). Qualquer desvio do padrão "Client-Side First" deve ser uma decisão explícita e justificada.

---

## 2. Estrutura e Layout de Páginas

- **`<Card>` como Contêiner Principal:** Toda página deve ser envolvida por um `<Card>`.
- **Componentização:** Mantenha os arquivos de página (`page.tsx`) com menos de 500 linhas, extraindo a lógica para componentes locais.

---

## 3. Padrões de Componentes de UI

- **Cores e Estilo:** Use sempre as variáveis de tema do Tailwind CSS.
- **Formulários:** Validação, feedback e acessibilidade são cruciais.

---

## 4. Componentes Reutilizáveis Disponíveis

Utilize componentes de `components/shared/form` para manter a consistência: `<BackButton />`, `<CpfInput />`, `<GoogleFontSelect />`, etc.

---

## 5. Internacionalização (i18n)

O projeto utiliza `next-intl` para gerenciar as traduções. A estrutura é projetada para ser simples e centralizada.

### 5.1. Estrutura de Arquivos e Namespaces (Textos)

- **⚠️ Localização Crítica:** Todos os textos traduzíveis ficam na pasta `locales`, localizada na **raiz do projeto**.
- **Estrutura:** Um único arquivo JSON por idioma (ex: `pt-BR.json`), com namespaces para organização.

### 5.2. Formatação de Dados (Datas e Moedas)

A tradução não se aplica apenas a textos, mas também a formatos de data, hora e moeda.

-   **Obrigatoriedade:** Para exibir qualquer data, hora ou valor monetário na UI, é **obrigatório** o uso do hook `useFormatters`.
-   **Uso:**
    ```tsx
    import { useFormatters } from '@/hooks/use-formatters';

    function MyComponent({ user }) {
      const { formatDate, formatCurrency } = useFormatters();

      return (
        <div>
          <p>Membro desde: {formatDate(user.createdAt)}</p>
          <p>Saldo: {formatCurrency(user.balance)}</p>
        </div>
      );
    }
    ```
-   **Justificativa:** Este hook centraliza a lógica de formatação, garantindo que `27/09/2025` seja exibido em português e `09/27/2025` em inglês, por exemplo, sem que o desenvolvedor precise se preocupar com a lógica de localidade.

---

### Seção 1.1: Cabeçalho da Página (`<CardHeader />`)

-   **Estrutura Relativa:** O `<CardHeader>` deve ter posicionamento `relative` para que o botão de voltar possa ser posicionado sobre ele.
-   **Botão de Voltar (`<BackButton />`):** Para manter um design limpo e não interferir com o título, o botão "Voltar" deve ser posicionado de forma absoluta no **canto superior direito** do cabeçalho. Ele deve ser sutil e informativo.
    -   **Posicionamento:** Use classes de posicionamento absoluto (`absolute top-3 right-6`).
    -   **Conteúdo:** Deve conter o ícone `<ChevronLeft />` e o texto "Voltar".
-   **Espaçamento do Título:** Para evitar que o título principal fique sobreposto pelo botão "Voltar" e para reduzir o espaço em branco superior, o `div` que envolve o `<CardTitle>` e a `<CardDescription>` deve ter um padding superior sutil (ex: `pt-2`).
-   **Botões de Ação Responsivos:** Para ações primárias da página (como "Criar Novo"), o `<CardHeader>` deve usar um layout flexível e responsivo (`flex flex-col md:flex-row md:items-start md:justify-between gap-4`). Isso garante que em telas menores (mobile), o botão de ação se mova para baixo do título e da descrição, evitando que o texto seja comprimido.

### Seção 1.2: Rodapé de Ações (`<CardFooter />`)

O rodapé é a área para ações de conclusão do formulário, como "Salvar" ou "Cancelar". Seu layout deve ser responsivo e seguir uma hierarquia visual clara.

#### **Desktop (Telas Médias e Grandes - `sm` e acima):**

-   **Alinhamento:** O padrão é um layout `flex` com `justify-between`.
-   **Ações Primárias** (Salvar, Criar, Confirmar): Devem ser alinhadas à **direita**. Esta é a posição final do fluxo de leitura do usuário, indicando conclusão.
-   **Ações Secundárias** (Reverter, Cancelar, Voltar): Devem ser alinhadas à **esquerda**.

#### **Mobile (Telas Pequenas - abaixo de `sm`):**

-   **Layout:** Os botões devem ser empilhados verticalmente para melhor ergonomia e para evitar quebra de layout.
    -   Use a classe `flex-col` para empilhamento padrão e `sm:flex-row` para reverter ao layout de linha em telas maiores.
-   **Largura Total:** Para maximizar a área de toque, todos os botões empilhados devem ocupar a largura total do contêiner (`w-full`). A classe `sm:w-auto` deve ser usada para que eles voltem ao seu tamanho natural em telas maiores.
-   **Hierarquia Visual (quando há múltiplos botões):** Se houver mais de uma ação, use variantes de botão para indicar a prioridade:
    1.  **Ação Primária ("Salvar"):** Botão com preenchimento (variante padrão).
    2.  **Ações Secundárias ("Salvar como Rascunho"):** Botão com contorno (`variant="outline"`).
    3.  **Ação Terciária/Negativa ("Cancelar"):** Botão "fantasma" (`variant="ghost"`).

**Exemplo de Código para `<CardFooter />`:**

```jsx
// Exemplo de rodapé com ações primária e secundária
<CardFooter className="flex flex-col-reverse sm:flex-row sm:justify-between items-center gap-4">
    {/* Ação Secundária (Esquerda no Desktop) */}
    <Button variant="outline" className="w-full sm:w-auto">
        Cancelar
    </Button>
    
    {/* Ação Primária (Direita no Desktop) */}
    <Button className="w-full sm:w-auto">
        Salvar Alterações
    </Button>
</CardFooter>
```
Este padrão garante uma experiência de usuário consistente e ergonômica em todas as plataformas.
