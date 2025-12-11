# Guia de Componentes de Formulário Compartilhados

Este documento serve como um catálogo para os componentes de formulário reutilizáveis encontrados em `src/components/shared/form`. Utilize estes componentes para garantir consistência visual e funcional em toda a aplicação.

---

## Componentes Disponíveis

### `<BackButton />`
-   **Propósito:** Botão padronizado para navegação "voltar".
-   **Uso:** ` <BackButton href="/caminho/alternativo" /> `
-   **Props:**
    -   `href` (opcional): Se fornecido, navega para a URL específica. Se omitido, utiliza `router.back()`.

### `<DatePickerInput />`
-   **Propósito:** Campo de formulário para seleção de datas com um calendário pop-over.
-   **Uso:** `<DatePickerInput name="startDate" label="Data de Início" />`
-   **Props:**
    -   `name`: Nome do campo no `react-hook-form`.
    -   `label`: Rótulo exibido acima do campo.

### `<BirthDateInput />`
-   **Propósito:** Componente especializado para entrada de data de nascimento, usando seletores de Dia, Mês e Ano para melhor usabilidade.
-   **Uso:** `<BirthDateInput value={field.value} onChange={field.onChange} />`
-   **Props:**
    -   `value`: Objeto do tipo `{ day: string; month: string; year: string; } | null`.
    -   `onChange`: Função que retorna o mesmo tipo de objeto.

### `<ColorPickerInput />`
-   **Propósito:** Campo para seleção de cores com um seletor visual (pop-over) e um input de texto para o código HEX.
-   **Uso:** `<ColorPickerInput name="primaryColor" label="Cor Primária" />`

### `<CpfInput />`
-   **Propósito:** Campo de input formatado especificamente para CPF.
-   **Uso:** `<CpfInput value={field.value} onChange={field.onChange} />`

### `<IconPickerInput />`
-   **Propósito:** Campo de input para nomes de ícones da biblioteca `lucide-react`, com um preview do ícone ao lado.
-   **Uso:** `<IconPickerInput name="originalIcon" label="Ícone do Menu" />`

### `<ImageUploadField />`
-   **Propósito:** Componente completo para upload de imagens. Gerencia a lógica de upload para o Firebase Storage, exibe o progresso e o preview da imagem.
-   **Uso:** `<ImageUploadField value={field.value} onChange={field.onChange} contextPath="logos" aihint="application logo" />`
-   **Props:**
    -   `contextPath`: Subpasta dentro de `instance_assets/{id}/` onde o arquivo será salvo.
    -   `aihint`: Dica para IA sobre o conteúdo da imagem.

### `<SocialLinksInput />`
-   **Propósito:** Permite ao usuário adicionar, remover e reordenar dinamicamente uma lista de links para redes sociais.
-   **Uso:** `<SocialLinksInput name="socialLinks" />` (deve estar dentro de um `FormField`).

### `<OrderControls />`
-   **Propósito:** Renderiza botões de seta para cima e para baixo para reordenar itens em uma lista.
-   **Uso:** `<OrderControls onMoveUp={...} onMoveDown={...} />`

### `<SmartRichTextEditor />`
-   **Propósito:** Um componente "inteligente" que renderiza o editor de texto rico padrão do sistema (TipTap, Lexical, etc.) ou um `<textarea>` simples se nenhum editor estiver configurado. Ele também carrega presets de conteúdo automaticamente.
-   **Uso:** `<SmartRichTextEditor value={field.value} onChange={field.onChange} contextId="invite_email" />`
-   **Lógica de Presets:** O editor busca por um preset de conteúdo na seguinte ordem de prioridade:
    1.  Um `hardcodedPresetId` passado como prop.
    2.  Um preset cujo ID corresponda ao `contextId` (ex: `invite_email`).
    3.  Um preset padrão com o ID `default`.
    4.  Se nenhum for encontrado, carrega o conteúdo inicial passado pela prop `value`.
-   **Props:**
    -   `value`: O valor (string HTML) do campo.
    -   `onChange`: A função para atualizar o valor.
    -   `contextId`: Um ID único que representa o contexto onde o editor está sendo usado. É usado para carregar um preset contextual.
    -   `hardcodedPresetId` (opcional): Força o carregamento de um preset específico, ignorando o contexto.
    -   `rows` (opcional): O número de linhas para o `<textarea>` de fallback.

### Seletores de Regionalização
-   **Propósito:** Conjunto de seletores padronizados para configurações de idioma, fuso horário e moeda.
-   **Componentes:**
    -   `<LanguageSelect />`
    -   `<TimezoneSelect />`
    -   `<CurrencySelect />`
-   **Uso:** `<LanguageSelect value={field.value} onChange={field.onChange} />`

### Componentes de Aparência
-   **Propósito:** Conjunto de componentes para o painel de aparência.
-   **Componentes:**
    -   `<ComponentStyleControls />`
    -   `<GradientDirectionInput />`
    -   `<GoogleFontSelect />`
    -   `<PageTransitionSelector />`
    -   `<TextAnimationsControl />`
    -   `<TextEffectsControl />`
    -   `<ThemePresetSelector />`
    -   `<ColorPresetSelector />`
-   **Uso:** Geralmente recebem um `prefix` ou `name` para se conectar ao campo correto do formulário.