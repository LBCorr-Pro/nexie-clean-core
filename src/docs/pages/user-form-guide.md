# Guia de Desenvolvimento e Prevenção de Erros: UserForm.tsx

Este documento é um registro **crítico** dos erros recorrentes encontrados no componente `UserForm.tsx` e de suas soluções definitivas. **A consulta a este guia é OBRIGATÓRIA antes de qualquer modificação no fluxo de criação ou edição de usuários para evitar a reintrodução de bugs.**

---

## 1. Erro de Ordenação de Campos

### Sintoma
Na página de edição de usuário, os campos do formulário apareciam em uma ordem incorreta (ex: "Nome Completo" aparecia no final), ignorando a sequência definida nas configurações em "Campos de Cadastro (Usuário)".

### Causa Raiz
O erro foi causado por uma lógica de processamento de dados falha dentro do componente. A função que combinava os dados dos campos (`fieldConfigs`) com os metadados (`PREDEFINED_FIELDS_META`) estava inadvertidamente usando a ordem da constante `PREDEFINED_FIELDS_META` como base, em vez de respeitar a ordem dos campos que vêm do Firestore.

**Lógica Incorreta (Exemplo Conceitual):**
```javascript
// O erro era iterar sobre `PREDEFINED_FIELDS_META` primeiro, o que ditava a ordem final.
PREDEFINED_FIELDS_META.map(meta => {
    const config = fieldConfigs.find(fc => fc.key === meta.key);
    // ...
});
```

### Solução Definitiva
A lógica foi invertida para garantir que a **fonte da verdade para a ordenação seja sempre `fieldConfigs`**, que é a lista que já vem ordenada do Firestore.

**Lógica Correta (Implementada):**
```javascript
// src/app/[locale]/(app)/users/components/UserForm.tsx

const visibleFields = useMemo(() => {
    // 1. A base da iteração agora é `fieldConfigs`, que já está ordenada corretamente.
    return fieldConfigs
      .map(config => {
        // 2. A constante `PREDEFINED_FIELDS_META` é usada apenas para "enriquecer" os dados, não para ordenar.
        const meta = PREDEFINED_FIELDS_META.find(m => m.key === config.key);
        if (!meta) return null;
        
        // ... (lógica de visibilidade)

        return { ...meta, ...config }; // Retorna o objeto combinado
      })
      .filter(field => field !== null); // Remove campos que não têm metadados
}, [fieldConfigs, isEditMode]);
```

**Diretriz Inviolável:** A ordem dos campos no formulário DEVE ser ditada pela propriedade `order` no Firestore, refletida no array `fieldConfigs`. Nenhuma outra lógica de ordenação deve ser aplicada na renderização.

---

## 2. Erro de Acesso a Dados Aninhados (Endereço)

### Sintoma
Na página de edição, os campos de endereço (CEP, Rua, etc.) não eram preenchidos com os dados do usuário, embora outros campos estivessem corretos.

### Causa Raiz
A lógica que preenchia o formulário com os dados do usuário (`userData`) procurava os campos de endereço no nível raiz do objeto, enquanto a estrutura correta no banco de dados os armazena dentro de um objeto (map) `address`.

**Estrutura no Firestore:**
```json
{
  "fullName": "João da Silva",
  "email": "joao@exemplo.com",
  "address": {
    "cep": "12345-678",
    "street": "Rua das Flores",
    "number": "123"
  }
}
```

**Lógica Incorreta (Exemplo Conceitual):**
```javascript
// Tentava acessar `userData.addressCep`, que é undefined.
defaultVals['addressCep'] = userData.addressCep; 
```

### Solução Definitiva
O código foi corrigido para acessar o sub-objeto `address` ao preencher os campos de endereço no formulário.

**Lógica Correta (Implementada):**
```javascript
// src/app/[locale]/(app)/users/components/UserForm.tsx

// ... Dentro do useEffect que constrói o formulário
// Para cada sub-campo de endereço:
const subKey = meta.key.replace('address','').charAt(0).toLowerCase() + meta.key.replace('address','').slice(1);
// 1. Verifica se `userData.address` existe.
if (isEditMode && userData?.address && userData.address[subKey] !== undefined) {
    // 2. Acessa a propriedade correta dentro do objeto aninhado.
    defaultVals.address[subKey] = userData.address[subKey];
} else {
    defaultVals.address[subKey] = '';
}
```

**Diretriz Inviolável:** Ao ler ou escrever dados que pertencem a um grupo lógico (como endereço), sempre respeite a estrutura de objeto aninhado definida no Firestore.

---

## 3. Problema do Componente de Data de Nascimento

### Sintoma
Ao editar um usuário, a data de nascimento não era populada nos seletores. Além disso, o componente original de calendário era inadequado para inserir datas de nascimento, exigindo uma navegação excessiva para anos passados.

### Causa Raiz
O problema tinha múltiplas camadas:
1.  **Usabilidade:** O componente `Calendar` não é prático para selecionar datas de nascimento.
2.  **Acoplamento de Formato:** A solução inicial de passar uma string formatada (`dd/MM/yyyy`) entre o formulário e o componente de data era frágil e não considerava a internacionalização.
3.  **Sincronização de Estado:** O componente de data não estava atualizando sua própria exibição (os valores dos `select`s) quando seu valor interno era alterado, causando uma dessincronização entre o estado do formulário e o que era exibido.

### Solução Arquitetural Definitiva

Para resolver o problema de forma robusta, a seguinte arquitetura foi implementada:

1.  **Criação do Componente `BirthDateInput`:**
    *   Um novo componente (`src/components/shared/form/BirthDateInput.tsx`) foi criado, utilizando três campos `<select>` para Dia, Mês e Ano, o que resolve o problema de usabilidade.

2.  **Desacoplamento de Formato:**
    *   O componente foi projetado para ser **agnóstico ao formato**. Ele não lida com strings de data.
    *   Sua interface é baseada em um objeto: `interface DateParts { day: string; month: string; year: string; }`.
    *   Ele recebe `value: DateParts | null` e emite `onChange(value: DateParts | null)`.

3.  **Gerenciamento de Estado no `UserForm.tsx`:**
    *   **Carregamento (Modo Edição):** Ao buscar os dados do usuário, o `UserForm` agora é responsável por converter o `Timestamp` do Firestore em um objeto `DateParts`.
        ```javascript
        if (meta.key === 'dateOfBirth' && userData[config.key] instanceof Timestamp) {
           const date = userData[config.key].toDate();
           defaultValue = { 
               day: String(date.getDate()).padStart(2, '0'), 
               month: String(date.getMonth() + 1).padStart(2, '0'), 
               year: String(date.getFullYear())
           };
        }
        ```
    *   **Submissão (Salvar):** Ao enviar o formulário, o `UserForm` recebe o objeto `DateParts` e o converte de volta para um `Timestamp` do Firestore antes de salvar.
        ```javascript
        if (key === 'dateOfBirth' && formData[key]) {
            const { day, month, year } = formData[key] as DateParts;
            if (day && month && year) {
                firestoreData[key] = Timestamp.fromDate(new Date(Number(year), Number(month) - 1, Number(day)));
            } else {
                firestoreData[key] = null;
            }
        }
        ```

**Diretriz Inviolável:** A responsabilidade de **formatação e conversão de tipo de dados** (ex: `Timestamp` <=> `DateParts`) pertence ao componente que gerencia o formulário (`UserForm`), não ao componente de UI (`BirthDateInput`). O componente de UI deve ser agnóstico e operar com uma estrutura de dados simples e previsível.

---

### **Alerta Contra Regressão**

Estes erros foram resolvidos e não devem ser reintroduzidos. Qualquer alteração no `UserForm.tsx` deve ser feita com extrema cautela, validando que:
1.  A **ordem dos campos** na tela de edição continua idêntica à ordem da página de configuração.
2.  **Todos os campos**, incluindo os aninhados como Endereço e Redes Sociais, e campos customizados como a Data de Nascimento, são corretamente populados ao editar um usuário.

A falha em seguir estas diretrizes resultará em regressões de bugs já corrigidos, impactando negativamente a experiência do usuário e a estabilidade do sistema.
