// src/lib/seed-data/default-manual-articles.ts

export const defaultManualArticlesData = [
  {
    slug: "configuracoes-gerais",
    title: "Configurações Gerais",
    content: `
# Entendendo as Configurações Gerais

A tela de "Configurações Gerais" é o centro de controle para a identidade fundamental da sua instância ou de todo o sistema. Aqui você define "quem" sua aplicação é.

## Seções da Página

### 1. Identidade do Sistema
-   **Nome do Sistema:** O nome principal da sua aplicação ou instância. É este nome que seus usuários verão na barra de topo e em outros locais.
-   **Apelido:** Uma versão curta do nome, que pode ser usada em locais onde o espaço é limitado.
-   **Descrição:** Um texto para seu controle interno, explicando o propósito da instância.

### 2. Logo Principal e Favicon
Nesta seção, você gerencia os logos mais importantes que representam sua marca visualmente:
-   **Logo Principal:** A imagem que aparece no menu lateral quando ele está expandido.
-   **Logo (Ícone):** Uma versão quadrada e compacta do seu logo, usada quando o menu lateral está recolhido.
-   **Favicon:** O pequeno ícone que aparece na aba do navegador.

Você pode colar uma URL de uma imagem existente ou usar o botão "Enviar" para fazer o upload de um arquivo do seu computador.

### 3. Informações de Contato e Endereço
Preencha os dados de contato que podem ser exibidos em e-mails, rodapés ou páginas de contato. Isso inclui:
-   E-mail e WhatsApp para suporte ou contato comercial.
-   O site institucional da sua empresa.
-   O endereço físico completo.

### 4. Redes Sociais
Adicione dinamicamente os links para as redes sociais da sua marca. Basta clicar em "Adicionar Rede Social", selecionar o tipo (Instagram, Facebook, etc.) e colar a URL.

### 5. Regionalização e Idioma
Configure o comportamento de idioma e formato de moeda/data da sua aplicação.
-   **Sistema Multilíngue:** Ative se você precisa que sua aplicação suporte múltiplos idiomas (ex: pt-BR, en-US). Desativar pode otimizar ligeiramente o sistema se você só usa uma língua.
-   **Idioma, Fuso Horário e Moeda Padrão:** Defina os padrões para toda a instância. Isso garantirá consistência para todos os usuários.
`,
    order: 5,
    requiredPermission: "instance.settings.general.edit",
  },
  {
    slug: "personalizando-a-aparencia",
    title: "Personalizando a Aparência",
    content: `
# Guia Completo da Aparência

O painel de Aparência é uma ferramenta poderosa para personalizar completamente a identidade visual da sua instância ou de todo o sistema. Ele é dividido em várias abas, cada uma controlando um aspecto específico do design.

## 1. Presets de Tema e Cor

No topo da página, você encontrará dois seletores:

-   **Presets de Tema:** Carrega um tema completo com um único clique (ex: "Neptune Dark", "Floresta Terrosa"). Isso altera todas as configurações, incluindo cores, fontes, layout, etc.
-   **Presets de Cor:** Carrega apenas um esquema de cores, sobrescrevendo as cores do tema atual, mas mantendo as configurações de tipografia e layout intactas.

Você pode salvar suas próprias combinações como um novo "Tema Completo" ou "Preset de Cor" usando os botões de salvar.

## 2. Abas de Configuração

### Cores
Aqui você define as cores principais da interface:

-   **Primária:** Usada em botões, links e elementos de foco.
-   **Destaque (Accent):** Cor para interações secundárias, como o hover de alguns itens.
-   **Destrutivo:** Cor para botões de exclusão e mensagens de erro.

### Componentes
Controle granular sobre o fundo e o texto dos principais componentes da UI, como:

-   Cards e Pop-ups (Modais)
-   Cabeçalho (Barra de Topo)
-   Inputs de formulário e Abas ativas
-   Bordas e anel de foco (ring)

### Tipografia
Personalize as fontes da aplicação:

-   **Família da Fonte:** Selecione fontes do Google Fonts para títulos e para o corpo do texto.
-   **Tamanho, Peso e Espaçamento:** Ajuste o tamanho, o peso (negrito, normal) e o espaçamento entre letras para um controle fino.

### Estilo e Formato
Defina o "feeling" da interface:

-   **Raio da Borda:** Deixe os componentes com cantos retos, sutis ou totalmente arredondados.
-   **Efeito de Hover:** Adicione animações aos botões ao passar o mouse.
-   **Animação de Carregamento (Skeleton):** Personalize a cor e a velocidade das animações de skeleton.

### Layout
Estrutura geral da aplicação:

-   **Visibilidade:** Mostre ou oculte as barras de navegação (topo, lateral, inferior).
-   **Posição e Modo:** Defina se o menu lateral fica à esquerda/direita e se as barras são fixas ou rolam com a página.
-   **Transições:** Ative e configure animações ao navegar entre páginas.

### Fundo
Personalize o fundo principal da página:

-   **Tipo:** Escolha entre cor sólida, gradiente ou imagem.
-   **Efeitos:** Adicione efeitos animados sutis, como "aurora", "estrelas" ou "ondas".

### Menus (Esquerdo, Superior, Inferior)
Cada barra de navegação tem sua própria aba para personalização de estilo de fundo (plano, vidro, etc.) e cores de texto/ícones.

### Identidade
Centralize a gestão de todos os logos e ícones da aplicação, como o Favicon e os ícones para PWA.
`,
    order: 10,
    requiredPermission: "instance.settings.appearance.edit",
  },
  {
    slug: "menus-e-layout",
    title: "Menus e Layout",
    content: `
# Configurando Menus e Layout

A seção "Menus e Layout" é o painel de controle para toda a navegação da sua aplicação. Ela permite uma personalização profunda de como os usuários interagem e se movem pela plataforma.

## Seções Principais

### 1. Grupos de Menu

Esta página permite organizar os itens do menu lateral em seções lógicas.

-   **Criação:** Crie um novo grupo definindo um nome e um ícone.
-   **Personalização de Cor:** Você pode definir cores específicas para o ícone e o texto do grupo. Essa cor pode se aplicar apenas ao título do grupo ou a todos os itens dentro dele.
-   **Ordenação:** Arraste e solte os grupos para reordená-los. Lembre-se de clicar em "Salvar Ordem".
-   **Visualização:** Expanda um grupo para ver quais itens de menu pertencem a ele.

### 2. Itens de Menu

Aqui você gerencia cada link individual do menu.

-   **Edição:** Clique em um item para editar seu nome de exibição, atribuí-lo a um grupo, ou definir sua ordem.
-   **Visibilidade:** Use o switch para mostrar ou esconder um item do menu.
-   **Propriedades Especiais:**
    -   **Pode ser página inicial?** Marca este item como uma opção válida para ser a página inicial de um usuário após o login.
    -   **Pode ir para Barra Inferior?** Permite que este item seja adicionado na configuração da barra de navegação inferior.

### 3. Barra Inferior (Mobile)

Esta seção é dedicada à barra de navegação que aparece na parte inferior de telas de celular.

-   **Habilitar Sistema de Abas:** Transforme a barra inferior em um sistema de abas, permitindo agrupar diferentes conjuntos de ícones.
-   **Gerenciar Abas:** Crie, edite e exclua as abas. Cada aba pode ter seu próprio nome e ícone.
-   **Adicionar Itens a uma Aba:** Dentro de cada aba, você pode adicionar qualquer item de menu que tenha sido marcado como "Pode ir para Barra Inferior".
-   **Reordenação de Itens:** Arraste e solte os itens dentro de uma aba para definir sua ordem de exibição.
-   **Preview em Tempo Real:** Todas as alterações feitas aqui são refletidas instantaneamente na barra inferior da aplicação, permitindo que você veja o resultado antes de salvar.

### 4. Modelos de Menu (Presets)

Esta é uma funcionalidade avançada para controle de acesso granular.

-   **Criação:** Crie um "modelo" de menu com um nome específico (ex: "Plano Básico", "Admin de Conteúdo").
-   **Configuração:** Dentro de cada modelo, você pode selecionar exatamente quais grupos e itens de menu estarão visíveis.
-   **Aplicação:** Após criar um modelo, você pode associá-lo a um "Nível de Acesso" na tela de gerenciamento de acesso. Usuários com aquele nível de acesso verão apenas os menus habilitados no modelo.
`,
    order: 12,
    requiredPermission: "instance.settings.menu.edit",
  },
  {
    slug: "gerenciando-instancias",
    title: "Gerenciando Instâncias e Sub-instâncias",
    content: `
# Gerenciando Instâncias e Sub-instâncias

A gestão de instâncias é uma função central do sistema, permitindo que o Administrador Master crie e supervisione ambientes separados para diferentes clientes ou projetos.

## O que é uma Instância?
Pense em uma instância como um ambiente de trabalho completo e isolado. Cada instância pode ter seus próprios usuários, configurações, aparência e conteúdo.

## Página de Gestão de Instâncias

Acessível pelo menu "Gerenciamento > Gerenciar Instâncias", esta página lista todas as instâncias criadas.

### Ações Principais
Para cada instância, você tem um conjunto de ações:

-   **Atuar Como (Ícone de Olho):** Esta é uma das ferramentas mais poderosas para o Master. Ao clicar, você "assume a identidade" daquela instância. Toda a interface será recarregada como se você fosse o administrador principal daquela instância, permitindo que você veja e configure a plataforma exatamente como o cliente a vê. Uma barra no topo da tela indicará que você está "Atuando como" e permitirá que você volte ao contexto Master.

-   **Menu de Ações (...):**
    -   **Gerenciar Usuários:** Leva para a tela de gerenciamento de usuários *específica* daquela instância.
    -   **Editar:** Abre a página de edição da instância, dividida em abas.
    -   **Excluir:** Remove permanentemente a instância e todos os seus dados.

## Editando uma Instância

A página de edição permite:

-   **Detalhes:** Alterar o nome da instância, tipo (Padrão, Desenvolvimento), e o Plano de Assinatura associado.
-   **Usuários:** Acessar a lista de usuários da instância.
-   **Sub-instâncias:** Criar, editar e excluir sub-instâncias. Pense em uma sub-instância como um "departamento" ou "filial" dentro da instância principal. Elas também podem ter suas próprias configurações de aparência e menus, herdando da instância-pai.
`,
    order: 18,
    requiredPermission: "master.instance.view_all",
  },
  {
    slug: "gerenciando-usuarios",
    title: "Gerenciando Usuários e Empresas",
    content: `
# Gerenciando Usuários e Empresas Globais

Como Administrador Master, você tem a capacidade de gerenciar usuários e empresas que existem em um nível "global", ou seja, não estão atrelados a nenhuma instância específica.

## 1. Gerenciar Usuários Globais

Acessível em "Gerenciamento > Gerenciar Usuários Globais".

-   **Listagem:** Você verá uma tabela com todos os usuários do sistema, com informações como nome, e-mail e status.
-   **Busca e Ordenação:** Use a barra de busca para encontrar usuários rapidamente e clique nos cabeçalhos das colunas para ordenar a lista.
-   **Ações:**
    -   **Criar Usuário Global:** Leva para um formulário dinâmico para adicionar um novo usuário.
    -   **Editar:** Permite alterar as informações de um usuário existente.
    -   **Excluir:** Remove o usuário do sistema (com confirmação).

### Campos de Cadastro (Usuário)
Em "Acesso e Segurança > Definições de Cadastros > Campos de Cadastro (Usuário)", você controla quais informações são solicitadas ao criar ou editar um usuário.

-   **Ordenação:** Arraste os campos para definir a ordem em que aparecerão no formulário.
-   **Visibilidade e Obrigatoriedade:** Use os ícones de olho e asterisco ou os switches na área de edição para definir se um campo deve aparecer e se ele é obrigatório.
-   **Validação:** Para campos como CPF, você pode ativar uma validação de formato.

## 2. Gerenciar Empresas Globais

Acessível em "Gerenciamento > Gerenciar Empresas Globais".

Esta tela funciona de maneira muito similar à de usuários, mas é focada em entidades de pessoa jurídica.

-   **Listagem e Ações:** Liste, busque, crie, edite e exclua registros de empresas.
-   **Campos de Cadastro (Empresa):** Assim como para usuários, você pode personalizar completamente o formulário de cadastro de empresas em "Acesso e Segurança > Definições de Cadastros > Campos de Cadastro (Empresa)".
`,
    order: 19,
    requiredPermission: "master.users.view_global",
  },
  {
    slug: "campanhas-splash-screen",
    title: "Campanhas de Splash Screen",
    content: `
# Gerenciando Campanhas de Splash Screen

Esta funcionalidade permite criar telas de abertura ou "splash screens" que são exibidas aos usuários ao iniciarem a aplicação. É ideal para anúncios, avisos importantes ou boas-vindas.

## Como Funciona?

A página principal lista todas as campanhas criadas para o contexto atual (Master, Instância ou Sub-instância). Você pode criar, editar, excluir e visualizar relatórios de visualização para cada uma.

## Criando ou Editando uma Campanha

O formulário de campanha é dividido em três abas:

### 1. Detalhes
Aqui você define as regras de negócio da campanha:

-   **Nome da Campanha:** Um nome interno para sua organização.
-   **Tipo:**
    -   **Abertura de App:** É a tela principal que pode ser exibida ao iniciar o app.
    -   **Banner:** (Funcionalidade futura) Para banners menores dentro da aplicação.
-   **Status:**
    -   **Rascunho:** A campanha está salva mas não será exibida a ninguém.
    -   **Ativa:** A campanha está no ar e será exibida ao público-alvo, respeitando as datas.
    -   **Inativa:** A campanha está pausada temporariamente.
-   **Frequência de Exibição:** Define quantas vezes um usuário verá a campanha. Por exemplo, "Apenas uma vez por usuário" ou "Uma vez por dia".
-   **Data de Início/Fim:** Define o período em que a campanha ficará ativa. Você pode deixar a data final em branco para uma campanha contínua.

### 2. Conteúdo
Esta aba controla a aparência da sua campanha:

-   **Elemento Principal:** O foco da sua mensagem. Pode ser um **Texto** grande ou uma **Imagem** (que você pode enviar via upload).
-   **Tipo de Fundo:** O fundo da tela pode ser uma **Cor Sólida**, um **Gradiente** de duas cores, uma **Imagem** ou até um **Vídeo**. Para imagem e vídeo, você também pode fazer o upload do arquivo.
-   **Duração Total:** Quantos segundos a splash screen ficará visível antes de desaparecer automaticamente.
-   **Página de Destino:** Opcionalmente, defina uma página para onde o usuário será levado ao interagir com a tela (funcionalidade futura).

### 3. Público-Alvo
Defina quem verá sua campanha:

-   **Todos (Público):** Qualquer pessoa, mesmo sem estar logada.
-   **Todos os Usuários Logados:** Qualquer usuário autenticado na instância.
-   **Grupos Específicos:** Permite que você selecione um ou mais "Níveis de Acesso" (criados na tela de Acesso). A campanha só será exibida para usuários que pertençam a um desses níveis.

## Relatórios

Ao clicar no botão "Relatório" de uma campanha, você verá uma lista de todos os usuários que visualizaram aquela campanha e a data da visualização. Isso ajuda a medir o alcance de seus anúncios e comunicados.
`,
    order: 15,
    requiredPermission: "instance.settings.general.edit",
  },
  {
    slug: "configurando-editor-padrao",
    title: "Configurando o Editor de Texto Padrão",
    content: `
# Definindo o Editor de Texto Padrão

Esta configuração é uma das mais importantes para a experiência de criação de conteúdo no sistema. Ela permite que você, como Administrador Master, escolha qual editor de texto rico será utilizado em todas as áreas da aplicação que necessitam de formatação de texto avançada.

## Por que isso é importante?

Centralizar a escolha do editor garante uma experiência de usuário consistente. Se um usuário aprende a usar o editor para criar uma nota, ele usará exatamente a mesma interface para escrever um post no feed ou formatar a descrição de um produto.

## Como Funciona

1.  **Acesso:** Esta é uma configuração global e só pode ser acessada pelo Administrador Master, na tela "Configurações > Editor de Texto Padrão".

2.  **Módulos Disponíveis:** A lista de editores disponíveis é preenchida automaticamente. O sistema procura por todos os **módulos** que foram marcados como "Editor de Texto Rico" e que estão **ativos** no sistema.

3.  **Seleção:** Basta escolher na lista o editor que você deseja que seja o padrão para toda a plataforma e salvar.

Se a lista estiver vazia, significa que nenhum módulo de editor de texto foi ativado ou corretamente configurado. Nesse caso, você deve ir até a página "Gerenciar Módulos" e garantir que o módulo desejado (Ex: "Tip Tap Editor", "Lexical Editor") esteja ativo, importado e com a opção "É um Editor de Texto Rico?" marcada.
`,
    order: 20,
    requiredPermission: "master.settings.general.edit",
  },
  {
    slug: "planos-e-assinaturas",
    title: "Gerenciando Planos de Assinatura",
    content: `
# Entendendo os Planos

O sistema de Planos é uma funcionalidade **Master Global** que permite ao administrador criar diferentes pacotes de serviço ou níveis de assinatura para as instâncias.

## O que um Plano controla?

Cada plano é um conjunto de regras que define:

1.  **Recursos e Limites:**
    -   **Máx. Usuários:** O número máximo de usuários que uma instância neste plano pode ter.
    -   **Máx. Sub-instâncias:** Quantas sub-unidades uma instância pode criar.
    -   **Armazenamento:** O limite de espaço em disco (em MB) para uploads.
    -   **Domínio Customizado:** Se as instâncias neste plano podem ou não configurar um domínio próprio.

2.  **Módulos Habilitados:**
    -   Você pode selecionar quais módulos (como Feed, Eventos, Notas, etc.) estarão disponíveis para as instâncias que assinarem este plano. Uma instância só poderá ativar os módulos que seu plano permite.

3.  **Template de Permissões:**
    -   Esta é uma configuração poderosa. Ela define quais permissões o **administrador de uma instância** receberá por padrão ao ser associado a este plano. Isso permite criar planos com diferentes níveis de poder administrativo (ex: um plano "Básico" com permissões limitadas vs. um plano "Pro" com acesso total à gestão da instância).

## Como Gerenciar os Planos?

-   **Criação:** Na página de "Gerenciar Planos", clique em "Criar Novo Plano". Defina um nome (ex: "Plano Gratuito"), um ID (slug, ex: "free_tier"), e preencha os limites e permissões.
-   **Edição:** Clique em "Editar" em um plano existente para ajustar seus limites, módulos e permissões. A página de edição é dividida em abas para facilitar a navegação.
-   **Associação:** Após criar os planos, vá para a página de "Gestão de Instâncias". Ao criar ou editar uma instância, você verá um campo "Plano" onde poderá associar um dos planos que você criou.
`,
    order: 25,
    requiredPermission: "master.instance.view_all",
  },
  {
    slug: "gerenciando-modulos",
    title: "Gerenciando Módulos",
    content: `
# Gerenciando Módulos: Uma Visão Geral

A página "Gerenciar Módulos" é o centro de controle para todas as funcionalidades que podem ser adicionadas ou removidas da sua aplicação.

## Contexto: Master vs. Instância

O comportamento desta página muda dependendo do seu contexto:

-   **Como Master Global:** Você define quais módulos existem no sistema e se eles estão **ativos globalmente**. Um módulo desativado globalmente não pode ser usado por nenhuma instância.
-   **Como Administrador de Instância:** Você vê a lista de módulos que estão ativos globalmente e pode escolher ativar ou desativar cada um **especificamente para a sua instância**.

## Ações Disponíveis

### Registro de Módulos (Apenas Master)
-   **Não Registrado:** Se um desenvolvedor adiciona uma nova pasta de módulo, ele aparecerá aqui com este status.
-   **Registrar Módulo:** Ao clicar nesta ação, um modal se abre para você definir os detalhes do módulo, como nome, ícone e descrição. Isso cria a "definição" do módulo no banco de dados.

### Edição de Definição (Apenas Master)
-   Permite alterar o nome, ícone, descrição e outras propriedades de um módulo já registrado.

### Ativação de Módulos
-   **Global (Master):** Um switch permite ativar ou desativar um módulo para todo o sistema.
-   **Instância:** Um switch permite sobrescrever o status global apenas para a instância atual. Se um módulo está inativo globalmente, ele não pode ser ativado na instância.

### Configuração
-   Alguns módulos, como o de Convites, possuem uma página de configuração própria. O botão "Configurar" serve como um atalho para essa página.
`,
    order: 30,
    requiredPermission: "master.modules.view_definitions",
  },
  {
    slug: "modulo-de-convites",
    title: "Módulo de Convites",
    content: `
# Utilizando o Módulo de Convites

O Módulo de Convites é a ferramenta para controlar como novos usuários entram na sua instância.

## Gerenciando Convites

Na aba "Gerenciar Convites", você pode:

-   **Gerar um Novo Convite:**
    -   **E-mail (Opcional):** Se você preencher o e-mail, apenas a pessoa com acesso a esse e-mail poderá usar o convite. Se deixar em branco, qualquer um com o código pode se registrar.
    -   **Nível de Acesso (Opcional):** Você pode pré-definir o nível de permissão que o usuário receberá ao se cadastrar.
    -   Ao gerar, um modal mostrará o código e o link para você copiar e enviar.

-   **Lista de Convites:**
    -   Visualize todos os convites criados, seus status (pendente, aceito, revogado), e datas.
    -   **Revogar:** Cancele um convite pendente para que ele não possa mais ser usado.

## Configurações do Módulo

Na aba "Configurações do Módulo", você personaliza como os convites funcionam para sua instância (se tiver permissão).

-   **Código:** Defina um prefixo (ex: \`SUAEMPRESA-\`) e o tamanho do código gerado.
-   **Validade:** Determine por quantos dias ou horas um convite será válido.
-   **Templates:** Personalize o texto padrão dos e-mails e mensagens de WhatsApp enviadas com os convites, usando placeholders como \`{{invite_link}}\` que são substituídos automaticamente.
`,
    order: 35,
    moduleId: "invite",
    requiredPermission: "module.invite.configure"
  }
];
