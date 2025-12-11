# Documentação da Página: Módulo Calc Genius

Este documento detalha o funcionamento e a lógica da página do "Módulo Calc Genius", localizada em `src/modules/calc-genius/page.tsx`.

---

## 1. Visão Geral e Propósito

A página do **Calc Genius** é a interface central para interagir com o motor de cálculo genérico. Ela é projetada como um painel de controle completo, dividido em abas, permitindo que o administrador defina as entradas de dados (campos), as lógicas de processamento (fórmulas) e teste os resultados em um ambiente integrado.

## 2. Abas e Funcionalidades

### a. Grupos (`<GroupsTab />`)

Esta aba é o ponto de partida para organizar a estrutura do seu motor de cálculo.

-   **Função:** Criar, editar, reordenar e excluir "Grupos". Pense em um grupo como uma categoria ou um container para campos e fórmulas relacionados (ex: "Custos Fixos", "Métricas de Vendas").
-   **Personalização:** Cada grupo pode ter um nome, ícone e cores personalizadas para facilitar a identificação visual em outras partes do sistema.
-   **Ordenação:** A ordem dos grupos pode ser ajustada arrastando-os (`drag-and-drop`) e salva com um botão dedicado, garantindo uma organização clara.

### b. Campos (`<FieldsTab />`)

Nesta aba, você gerencia as "variáveis" ou as entradas de dados do seu sistema de cálculo.

-   **Criação/Edição:** Um modal completo permite criar ou editar um campo, definindo:
    -   **Rótulo e ID (Slug):** O nome de exibição e o identificador único usado nas fórmulas (ex: `horas_trabalhadas`).
    -   **Tipo de Dado:** Se o campo é um número, texto, booleano (verdadeiro/falso) ou data.
    -   **Origem:** De onde o dado virá (ex: preenchido manualmente, importado de uma planilha, de uma API).
-   **Visualização e Filtragem:** A tabela principal lista todos os campos. Você pode usar os filtros para encontrar campos rapidamente por nome, grupo, tipo de dado ou origem.
-   **Ações em Lote:** Selecionando múltiplos campos com as caixas de seleção, você pode abrir um modal para "Editar em Lote" (alterando o tipo ou grupo de vários campos de uma vez) ou para "Excluir" em massa.

### c. Fórmulas (`<FormulasTab />`)

Aqui é onde a mágica acontece. Você cria as expressões lógicas ou matemáticas.

-   **Criação/Edição:** O modal de fórmulas permite criar ou editar uma expressão, definindo:
    -   **Rótulo e ID:** Identificadores para a fórmula.
    -   **Expressão:** O código JavaScript que será executado. Você pode usar os "Campos Disponíveis" na lateral para copiar os IDs corretos (ex: `row.horas_trabalhadas * row.valor_hora`).
    -   **Assistente de Fórmula:** Uma ferramenta que gera automaticamente expressões comuns de agregação (como Soma de uma coluna, Contar itens, etc.).
    -   **Ambiente de Teste:** Uma área dedicada para inserir valores de teste nos campos usados pela fórmula e ver o resultado em tempo real, facilitando a depuração.

### d. Analisador (`<FileAnalyzerTab />`)

Uma ferramenta de utilidade para acelerar a criação de campos a partir de arquivos.

-   **Upload:** Envie um arquivo (Excel, CSV, JSON, XML).
-   **Extração:** O sistema lê o arquivo e extrai todos os cabeçalhos de coluna, chaves ou tags.
-   **Criação Rápida:** Ao lado de cada chave extraída, um botão de `+` permite criar instantaneamente um novo campo com aquele nome, pré-preenchendo o formulário de criação de campo.
-   **Criação em Lote:** Ativando o modo "Criar em Lote", você pode selecionar múltiplos campos extraídos, renomeá-los e criar todos de uma só vez, associando-os a grupos padrão.

### e. Testes (`<TestsTab />`)

Esta aba oferece um ambiente de simulação mais robusto.

-   **Seleção de Cenário:** Você seleciona um conjunto de campos de entrada relevantes para o seu teste.
-   **Entrada de Dados:** Preencha os valores para cada um dos campos selecionados.
-   **Cálculo Completo:** Ao clicar em "Calcular", o sistema executa **todas as fórmulas** que dependem dos campos que você selecionou e exibe uma tabela com o resultado de cada uma, permitindo uma visão completa de como o motor de cálculo se comporta com um determinado conjunto de dados.
-   **Inteligência de Parsing:** O ambiente de teste consegue interpretar valores de forma inteligente (ex: "sim" vira `true`, `202507` vira uma data válida) para facilitar a simulação.
