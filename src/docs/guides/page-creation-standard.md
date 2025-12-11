# Padrão de Criação de Página (Nexie v2.0)

Este documento é a **fonte única da verdade** para a criação e modificação de páginas de interface (UI) na aplicação. Seguir estas diretrizes é **obrigatório** para garantir consistência, usabilidade, responsividade e manutenibilidade do código.

---

## 1. Estrutura Fundamental da Página

Toda página de conteúdo principal (formulários, tabelas, dashboards) deve ser encapsulada em um único componente `<Card>`.

### 1.1. Cabeçalho da Página (`<CardHeader />`)

-   **Estrutura Relativa:** O `<CardHeader>` deve ter posicionamento `relative` para que o botão de voltar possa ser posicionado sobre ele.
-   **Botão de Voltar (`<BackButton />`):** Para manter um design limpo e não interferir com o título, o botão "Voltar" deve ser posicionado de forma absoluta no **canto superior direito** do cabeçalho. Ele deve ser sutil e informativo.
    -   **Posicionamento:** Use classes de posicionamento absoluto (`absolute top-3 right-6`).
    -   **Conteúdo:** Deve conter o ícone `<ChevronLeft />` e o texto "Voltar".
-   **Espaçamento do Título:** Para evitar que o título principal fique sobreposto pelo botão "Voltar" e para reduzir o espaço em branco superior, o `div` que envolve o `<CardTitle>` e a `<CardDescription>` deve ter um padding superior sutil (ex: `pt-2`).
-   **Botões de Ação Responsivos:** Para ações primárias da página (como "Criar Novo"), o `<CardHeader>` deve usar um layout flexível e responsivo (`flex flex-col md:flex-row md:items-start md:justify-between gap-4`). Isso garante que em telas menores (mobile), o botão de ação se mova para baixo do título e da descrição, evitando que o texto seja comprimido.

**Exemplo de Estrutura:**
```jsx
// ESTRUTURA CORRETA
<Card>
    <CardHeader className="relative">
        <BackButton className="absolute right-6 top-3"/>
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 pt-2"> 
            <div>
                <CardTitle className="section-title !border-none !pb-0">
                    <Settings className="section-title-icon"/>
                    Título da Página
                </CardTitle>
                <CardDescription>
                    Descrição da página.
                </CardDescription>
            </div>
            <Button className="shrink-0 w-full md:w-auto">
                <PlusCircle className="mr-2 h-4 w-4" /> Criar Novo
            </Button>
        </div>
    </CardHeader>
    <CardContent>
      {/* ... Conteúdo ... */}
    </CardContent>
    <CardFooter>
      {/* ... Botões ... */}
    </CardFooter>
</Card>
```

### 1.2. Rodapé de Ações (`<CardFooter />`)

-   **Desktop:**
    -   **Ações Primárias** (Salvar, Criar, Confirmar): Alinhadas à **direita**.
    -   **Ações Secundárias** (Cancelar, Reverter): Alinhadas à **esquerda**.
-   **Mobile (Telas Pequenas):**
    -   O `<CardFooter>` deve usar classes como `flex-col sm:flex-row` para empilhar os botões verticalmente em telas pequenas.
    -   Para maximizar a área de toque e a usabilidade, os botões empilhados devem ocupar a largura total (`w-full`). A largura automática (`sm:w-auto`) deve ser reestabelecida em telas maiores.

---

## 2. Componentização e Legibilidade

-   **Limite de Linhas:** Como regra geral, um arquivo de página (`page.tsx`) não deve exceder **500 linhas de código**.
-   **Componentização:** Páginas que se aproximam ou excedem este limite devem ser refatoradas. Lógicas complexas ou seções de UI grandes (especialmente modais e formulários extensos) devem ser extraídas para seus próprios componentes reutilizáveis, localizados em uma pasta `components` dentro do diretório da rota.
    -   **Exemplo:** A página `.../settings/campaigns/page.tsx` deve conter a tabela e o controle de estado. O modal de criação/edição deve ser um componente separado, como `.../settings/campaigns/components/CampaignFormDialog.tsx`.
-   **Benefício:** Isso mantém os arquivos de página focados em layout e estado, enquanto os componentes filhos lidam com a lógica de UI específica, tornando o código mais limpo, fácil de testar e de dar manutenção.

---

## 3. Estilo e Tema

-   **Cores:** **NUNCA** use cores "hard-coded" (ex: `#FFFFFF`, `blue`). Utilize **SEMPRE** as variáveis de cor do tema através das classes do Tailwind CSS (ex: `bg-primary`, `text-destructive`, `border-border`).
-   **Fontes e Textos:** A tipografia deve seguir as variáveis CSS semânticas.
-   **Ícones:** SEMPRE QUE HOUVER UM CAMPO DE INPUT PARA ÍCONE, DEVE HAVER UMA DESCRIÇÃO ABAIXO DO CAMPO INFORMANDO A BIBLIOTECA UTILIZADA E, SE POSSÍVEL, UM LINK PARA ELA (EX: "Nome de um ícone da biblioteca [Lucide Icons](https://lucide.dev/icons/)").

---

## 4. Padrões de Componentes e Layout

### 4.1. Tabelas, Filtros e Ordenação

-   **Pesquisa/Filtro:** A barra de pesquisa deve ficar acima da tabela, alinhada à esquerda. Ações (como "Criar Novo") ficam à direita.
-   **Ordenação:**
    -   Os cabeçalhos de coluna que permitem ordenação devem usar um `<Button variant="ghost">` e **sempre** exibir um ícone (`<ArrowUp />` ou `<ArrowDown />`) indicando o estado de ordenação atual.
    -   **Feedback Visual:** Para indicar que uma coluna é ordenável, seu cabeçalho (`<th>`) deve usar uma cor de fundo sutil do tema, como `bg-muted/50`, e ter um efeito `:hover` pronunciado.

### 4.2. Abas de Navegação (`<Tabs />`)

-   **Gerenciamento de Estado com URL:** O controle da aba ativa **DEVE** ser feito através de parâmetros de busca na URL (ex: `?tab=details`).
    -   **Leitura:** O componente deve ler o `searchParams` da URL para determinar qual aba exibir inicialmente.
    -   **Escrita:** Ao clicar em uma nova aba, o componente deve usar o `router.push` para atualizar a URL, sem recarregar a página.
    -   **Benefício:** Isso garante que o estado da aba seja preservado ao recarregar a página, compartilhar o link e navegar pelo histórico do navegador.

### 4.3. Layout de Formulários

-   **Responsividade:** Para garantir que os formulários sejam legíveis e utilizáveis em todos os dispositivos, organize os campos em um grid responsivo.
    ```jsx
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* Campos do formulário aqui */}
    </div>
    ```
-   **Títulos de Seção:** Para agrupar campos, use um `h3` com a classe semântica `.section-title`. O ícone deve usar a classe `.section-title-icon`. O `items-start` na classe do título garante o alinhamento correto do ícone com textos de múltiplas linhas.
    ```jsx
    <h3 className="section-title">
        <Building className="section-title-icon" />
        Identidade do Sistema
    </h3>
    ```
-   **Campos Obrigatórios:** Os rótulos (`<FormLabel>`) de campos obrigatórios devem indicar isso visualmente com um asterisco vermelho.
    ```jsx
    <FormLabel>
        Nome do Sistema<span className="text-destructive">*</span>
    </FormLabel>
    ```
-   **Campos de Slug:** Campos destinados a receber um "slug" (identificador para URL) **devem** forçar o formato correto (letras minúsculas, números e hífens) automaticamente enquanto o usuário digita. Isso pode ser feito criando uma variante customizada no componente `<Input>`.

### 4.4. Modais (`<Dialog />`) e Conteúdo Rolável

Para garantir que o conteúdo dos modais não seja cortado em telas menores, é **obrigatório** usar um layout flexível e uma área de rolagem. A estrutura correta dentro de um `<Dialog>` é:

-   **`<DialogContent>`:** Deve receber a classe `p-0` para remover o padding padrão, permitindo controle total do espaçamento interno.
-   **`<form>`:** O formulário (ou o contêiner de conteúdo principal) deve se tornar um contêiner flexível vertical com as classes `flex flex-col h-full`.
-   **`<DialogHeader>` e `<DialogFooter>`:** Devem permanecer fora da área de rolagem, marcados com a classe `shrink-0` para que não encolham e tenham seu próprio padding (`px-6`, etc.).
-   **`<ScrollArea>`:** O componente `<ScrollArea>` deve envolver **apenas** a seção de conteúdo principal do formulário (entre o header e o footer). Ele deve receber a classe `flex-grow` para se expandir e ocupar o espaço disponível, e seu próprio padding (`px-6 py-4`).
-   **BARRA DE ROLAGEM: O `ScrollArea` OU O ELEMENTO DE CONTEÚDO DENTRO DELE DEVE TER `overflow-y: auto` PARA GARANTIR QUE A BARRA DE ROLAGEM APAREÇA EM TELAS PEQUENAS QUANDO O CONTEÚDO EXCEDER A ALTURA DISPONÍVEL.**

**Exemplo de Estrutura Correta:**
```jsx
<Dialog>
  <DialogContent className="sm:max-w-2xl p-0">
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full">
        <DialogHeader className="px-6 pt-6 shrink-0">
          <DialogTitle>Título do Modal</DialogTitle>
          <DialogDescription>Descrição do modal.</DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-grow px-6 py-4">
          <div className="space-y-4">
            {/* ... Seus campos de formulário, abas ou conteúdo principal vão aqui ... */}
          </div>
        </ScrollArea>
        
        <DialogFooter className="px-6 pb-6 pt-4 border-t shrink-0">
          <Button>Salvar</Button>
        </DialogFooter>
      </form>
    </Form>
  </DialogContent>
</Dialog>
```

### 4.5. Editores de Texto Ricos (WYSIWYG)

Para garantir consistência e flexibilidade, a inserção de editores de texto avançados deve ser feita utilizando o componente `<SmartRichTextEditor />`.

-   **Uso:** Substitua `<Textarea />` por `<SmartRichTextEditor />` em formulários que necessitam de formatação.
-   **Exemplo:**
    ```jsx
    <FormField
      control={form.control}
      name="email_template"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Template do E-mail</FormLabel>
          <FormControl>
            <SmartRichTextEditor
              value={field.value}
              onChange={field.onChange}
              contextId="invite_email"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
    ```
-   **Contexto:** A propriedade `contextId` é crucial. Ela deve ser um identificador único que representa onde o editor está sendo usado (ex: `invite_email`, `post_content`). Isso permite que o sistema carregue presets de conteúdo automaticamente se um preset com o mesmo ID for encontrado.
