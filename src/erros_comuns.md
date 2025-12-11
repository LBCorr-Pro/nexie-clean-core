# Guia Consolidado de Erros Comuns e Suas Soluções

Este documento é um guia de referência rápida para os erros mais frequentes encontrados durante o desenvolvimento, suas causas e as soluções padronizadas. A leitura deste guia é **obrigatória** para evitar a reintrodução de bugs já corrigidos.

---

### 1. Erros de Tipo (TypeScript)

#### 1.1. `error TS1381: Unexpected token` (Token Inesperado)

- **Sintoma:** O typecheck falha com um erro de sintaxe.
- **Causa Comum:** Parênteses `()`, chaves `{}` ou colchetes `[]` desbalanceados, especialmente em componentes JSX complexos.
- **Solução:**
  1.  Inspecione cuidadosamente a linha e a coluna indicadas pelo erro.
  2.  Verifique se todos os elementos JSX estão corretamente fechados e aninhados.
  3.  Utilize a formatação do editor para ajudar a identificar problemas de estrutura.

#### 1.2. Incompatibilidade de Tipos em Formulários (Zod)

- **Sintoma:** O typecheck acusa que uma propriedade não existe em um tipo (`Object literal may only specify known properties...`) ou que um valor (ex: `string`) não pode ser atribuído a um tipo mais restrito (ex: `enum`).
- **Causa Comum:**
    1.  **Propriedade Inexistente:** Passar `defaultValues` para um `useForm` com uma propriedade que não foi definida no `Zod.object({})`.
    2.  **Valor de Enum Inválido:** O schema Zod define um `z.enum([...])`, mas o código (geralmente no `form.reset()` ou `defaultValues`) tenta atribuir um valor que não está na lista do enum.
- **Exemplos Recentes:**
    - Em `settings/menus/groups/page.tsx`, um campo `color` obsoleto estava sendo passado nos `defaultValues`.
    - Em `settings/menus/left-sidebar/page.tsx`, um valor `"custom"` era atribuído ao campo `leftSidebarAppNameType`, mas o `z.enum()` não o incluía.
- **Solução:**
    1.  **Mantenha o Schema Sincronizado:** O schema Zod é a **fonte única da verdade**. Sempre que adicionar, remover ou modificar um campo, atualize o schema primeiro.
    2.  **Corrija os `defaultValues`/`reset`:** Certifique-se de que os objetos passados para `defaultValues` e `form.reset()` correspondam **exatamente** ao schema. Remova propriedades obsoletas e garanta que os valores de enums sejam válidos.
    3.  **Adicione ao Enum se Necessário:** Se o valor for legítimo (vindo de dados legados, por exemplo), adicione-o ao `z.enum([...])` no schema para permitir sua utilização.

#### 1.3. Erros de Tipagem com `useFieldArray` e `dnd-kit`

- **Sintoma:** O TypeScript reclama que uma propriedade não existe (`Property 'x' does not exist on type 'Record<"dndId", string>'`) ao tentar acessar dados de um item dentro de uma lista ordenável (`SortableList`).
- **Causa Comum:** O hook `useFieldArray` do `react-hook-form` adiciona uma propriedade `id` (renomeada para `dndId` em nosso caso) para o rastreamento interno. No entanto, o tipo inferido para o item dentro do `renderItem` do `SortableList` pode ser muito genérico, não contendo as propriedades do seu objeto de dados original (ex: `isPredefinedField`).
- **Solução:**
    1.  **Tipagem Explícita:** A solução mais direta e segura é tipar explicitamente o parâmetro do item no `renderItem` como `any` ou, idealmente, com a interface correta do seu formulário.
    2.  **Exemplo de Correção:**
        ```typescript
        // ANTES (com erro)
        renderItem={(field, { ... }) => {
            // TS acusa erro aqui, pois 'field' é do tipo Record<"dndId", string>
            const isPredefined = field.isPredefinedField; 
            // ...
        }}

        // DEPOIS (corrigido)
        renderItem={(field: any, { ... }) => {
            // Agora o TS permite o acesso, pois 'field' é tratado como 'any'
            const isPredefined = field.isPredefinedField; 
            // ...
        }}
        ```
    3.  **Observação:** Embora usar `any` resolva o erro de compilação, a abordagem mais robusta seria criar e usar uma interface que estenda o tipo do formulário com a propriedade `dndId`. Por simplicidade e rapidez, `any` é uma solução aceitável neste contexto específico.

---

### 2. Erros de Caminho e Referência

#### 2.1. Erros de Importação (`Module not found` ou `Cannot find name 'TypeName'`)

- **Sintoma:** O sistema falha em compilar.
- **Causa Comum:** Caminhos de importação (`import ...`) estão incorretos ou um tipo não foi exportado do seu arquivo de origem.
- **Solução:**
    1.  Use os atalhos de caminho do `tsconfig.json` (ex: `@/components/...`).
    2.  Ao mover arquivos, aceite a atualização automática de caminhos do IDE.
    3.  **Exemplo Recente:** A importação do tipo `BottomBarItem` em `TabItemManager.tsx` falhou porque o tipo não estava sendo exportado de `presets/types.ts`. Certifique-se de que todos os tipos compartilhados sejam exportados.

#### 2.2. Falhas em Operações do Firestore

- **Sintoma:** Dados não são salvos, lidos ou excluídos, com ou sem erros no console.
- **Causa Comum:** A referência ao documento (`doc`) ou coleção (`collection`) está incorreta, especialmente devido aos diferentes contextos (Master, Instância, Sub-instância).
- **Solução:**
    1.  **NUNCA** construa referências do Firestore manualmente (com caminhos "hard-coded").
    2.  **SEMPRE** utilize as funções centralizadas em `src/lib/firestore-refs.ts`.
    3.  **Exemplo Recente:** A exclusão de campanhas falhava por não usar `getCampaignsRef()` para obter a referência contextual correta.

---

### 3. Inconsistências de Nomenclatura e Lógica

#### 3.1. Nomes de Campos de Formulário Divergentes

- **Sintoma:** Alterações no formulário não são aplicadas no preview ou não são salvas corretamente.
- **Causa Comum:** O nome do campo no formulário (`<FormField name="...">`) não corresponde **exatamente** ao nome no schema Zod e na lógica de salvamento.
- **Exemplo Recente:** Em `settings/appearance/page.tsx`, havia uma mistura de prefixos `sidebar` e `leftSidebar`, causando dessincronização entre o formulário, o schema e a aplicação dos estilos.
- **Solução:**
    1.  **Padronize Prefixos:** Use prefixos consistentes para grupos de campos (ex: `topBar...`, `bottomBar...`).
    2.  O schema Zod é a fonte da verdade para os nomes. Defina o nome lá e use-o em todos os outros lugares.

#### 3.2. Acesso a `searchParams` em Páginas de Cliente (`"use client"`)

- **Sintoma:** Erros de tipo relacionados a `searchParams` sendo `any` ou `unknown`.
- **Causa Comum:** Em componentes `"use client"`, `searchParams` não é uma Promise e não deve ser usado com `React.use()`. O TypeScript pode não inferir o tipo corretamente.
- **Exemplo Recente:** No arquivo `access/instances/[instanceId]/edit/page.tsx`, o `searchParams` estava sendo tratado incorretamente.
- **Solução:**
    1.  **Não use `React.use()`:** Em componentes de cliente, `searchParams` é um objeto direto.
    2.  **Defina o Tipo Explicitamente:** Na assinatura da função do componente, defina o tipo esperado para `searchParams`.
        ```typescript
        // Em vez de deixar o tipo ser inferido como 'any'
        export default function MinhaPagina({ searchParams }: { searchParams: { tab: string, outroParam?: string } }) {
            const activeTab = searchParams.tab || 'default';
            // ...
        }
        ```

---

### 4. Erros de Lógica e Renderização

#### 4.1. "Internal Server Error" ao Acessar Hooks ou Funções de Dados

- **Sintoma:** A aplicação quebra com um "Internal Server Error" durante a renderização no servidor. O erro geralmente aponta para uma linha que tenta acessar uma propriedade de um objeto nulo ou indefinido (ex: `configuracoes.propriedade`), com a mensagem `Cannot read properties of null`.
- **Causa Comum:**
    1.  **Hooks Assíncronos:** Um hook customizado (ex: `useDynamicMenu`, `useAppearance`) realiza operações assíncronas para buscar dados. Durante a renderização inicial no servidor, esses dados ainda não estão disponíveis, e o hook retorna `null` ou `undefined`. Um componente que consome este hook tenta usar o estado imediatamente, sem verificar se ele é nulo, causando o erro.
    2.  **Processamento de Dados Incompleto:** Uma função utilitária (como as de `lib/appearance`) falha em gerar todos os dados esperados por um componente. Por exemplo, se uma função que gera variáveis CSS deixa de mapear uma cor necessária, o componente que depende daquela variável falhará ao tentar usá-la.
- **Solução:**
    1.  **Hooks e Funções Resilientes:** Hooks customizados e funções de processamento de dados **devem sempre** retornar um estado inicial válido ou um objeto completo, nunca `null` ou `undefined` para objetos complexos. Use um objeto padrão (default) como valor inicial e garanta que todos os mapeamentos de dados estejam corretos.
        ```typescript
        // DENTRO DE UM HOOK
        // Incorreto ❌
        // const [appearanceSettings, setAppearanceSettings] = useState<AppearanceSettings | null>(null);
        
        // Correto ✅
        import { defaultAppearance } from '@/lib/default-appearance';
        const [appearanceSettings, setAppearanceSettings] = useState<AppearanceSettings>(defaultAppearance);
        ```
    2.  **Componentes Defensivos:** Como uma segunda camada de proteção, componentes que consomem dados de hooks devem, sempre que possível, ter um fallback para um estado de carregamento ou para o objeto padrão.
        ```jsx
        // DENTRO DO COMPONENTE
        // Incorreto ❌
        // <div style={{ color: appearanceSettings.color }}>...</div>

        // Correto ✅
        // const currentAppearance = appearanceSettings || defaultAppearance;
        // <div style={{ color: currentAppearance.color }}>...</div>
        ```
    3.  **Princípio Fundamental:** A renderização no servidor não pode depender de dados que só estarão disponíveis após uma operação assíncrona. O estado inicial e a lógica de processamento devem ser suficientes para uma renderização bem-sucedida.

#### 4.2. Recalcular Lógica Já Resolvida em um Hook

- **Sintoma:** Inconsistência visual ou de dados entre diferentes partes da aplicação. Uma funcionalidade (ex: cor de um item) funciona em uma página, mas não em outra.
- **Causa Comum:** Um componente de UI tenta recalcular ou re-implementar uma lógica que já foi resolvida e centralizada em um hook customizado (ex: `useDynamicMenu`, `useAppearance`). A lógica reimplementada no componente é frequentemente incompleta ou desatualizada em comparação com a lógica do hook.
- **Exemplo Recente:** O componente `sidebar-nav.tsx` tentava aplicar suas próprias regras para determinar a cor de um grupo de menu, ignorando os valores finais e já processados (`finalDisplayGroupTextColor`, etc.) que o hook `useDynamicMenu` fornecia.
- **Solução:**
    1.  **Confie no Hook:** Hooks customizados são a **fonte única da verdade** para dados complexos ou computados.
    2.  **Consuma Dados Prontos:** Componentes devem ser "burros". Eles devem receber e renderizar os dados finais providos pelos hooks, sem tentar adivinhar ou recalcular valores.
    3.  **Correção Aplicada:** A lógica de cor foi removida do `sidebar-nav.tsx`, e ele foi alterado para aplicar diretamente os valores `finalDisplayGroupIconColor` e `finalDisplayGroupTextColor` que vêm do hook, garantindo consistência visual.

#### 4.3. Lógica Incorreta com Propriedades Opcionais

- **Sintoma:** Uma funcionalidade (como a exibição de um campo) não funciona como esperado, mesmo que os dados pareçam corretos na depuração.
- **Causa Comum:** Uso incorreto do operador de coalescência nula (`??`) com uma propriedade opcional que pode não existir no objeto de dados. Se o objeto de dados não contém a propriedade (ex: `visibility`), a expressão `objeto?.propriedade?.subpropriedade ?? false` resultará em `false` porque `undefined ?? false` é `false`.
- **Exemplo Recente:** Na página de criação de usuários, os campos não eram exibidos porque a lógica `config?.visibility?.on_user_registration ?? false` sempre resultava em `false` quando o objeto `visibility` não existia no Firestore.
- **Solução:**
    1.  **Defina o Comportamento Padrão Correto:** Em vez de usar um fallback que quebra a funcionalidade (`false`), use um fallback que represente o comportamento desejado se a propriedade estiver ausente (`true`).
    2.  **Exemplo de Correção:**
        ```typescript
        // Incorreto ❌ - Se `visibility` for undefined, o resultado é false.
        const isVisible = config?.visibility?.on_user_registration ?? false;

        // Correto ✅ - Se `visibility` for undefined, o resultado é true, tratando o campo como visível por padrão.
        const isVisible = config?.visibility?.on_user_registration ?? true;
        ```
    3.  **Princípio Fundamental:** Sempre considere o caso em que um objeto ou propriedade opcional não existe e garanta que o valor de fallback (`??`) corresponda ao comportamento padrão esperado (falha segura).

#### 4.4. Duplicação de Ícones e Rótulos em Componentes de Formulário

- **Sintoma:** Um campo de formulário, como um seletor de idioma, exibe dois ícones e/ou dois rótulos.
- **Causa Comum:** O componente pai (ex: `UserForm.tsx`) e o componente filho reutilizável (ex: `LanguageSelect.tsx`) estão ambos tentando renderizar o `<FormLabel>` e um ícone associado.
    - O `UserForm.tsx` itera sobre os campos, criando um `<FormItem>` e um `<FormLabel>` com um ícone.
    - Dentro desse `FormItem`, ele renderiza o componente `<LanguageSelect />`.
    - O `<LanguageSelect />`, por sua vez, renderiza seu *próprio* `<FormLabel>` e ícone.
- **Solução:**
    1.  **Centralizar Responsabilidade:** A responsabilidade de renderizar o rótulo e o ícone de um campo deve ser **exclusiva do componente pai** que está montando o formulário (`UserForm.tsx`).
    2.  **Tornar o Filho "Burro":** O componente filho reutilizável (`LanguageSelect`, `TimezoneSelect`, etc.) deve ser simplificado para renderizar **apenas o controle de formulário em si** (o `<Select>`, o `<Input>`, etc.), sem o `<FormLabel>`.
    3.  **Exemplo de Correção:**
        ```typescript
        // Em LanguageSelect.tsx (ANTES) ❌
        <FormItem>
          <FormLabel><Languages /> Idioma</FormLabel>
          <Select ... />
        </FormItem>

        // Em LanguageSelect.tsx (DEPOIS) ✅
        <Select ... /> // O componente agora só renderiza o controle
        
        // Em UserForm.tsx (DEPOIS) ✅
        <FormItem>
          <FormLabel><Languages /> Idioma Padrão</FormLabel>
          <LanguageSelect name="defaultLanguage" /> // O pai fornece o rótulo
        </FormItem>
        ```
    4.  **Princípio Fundamental:** Componentes de formulário reutilizáveis devem ser agnósticos ao seu rótulo e contexto, focando apenas na sua funcionalidade principal para evitar duplicação e facilitar a manutenção.
