# Guia de Formatação de Dados (Datas e Moedas)

Este documento detalha o padrão obrigatório para a exibição de dados formatados, como datas, horas e valores monetários, garantindo a consistência e a correta internacionalização (i18n) em toda a aplicação.

---

## 1. O Problema: Formatos Internacionais

Diferentes regiões do mundo representam datas e moedas de maneiras distintas. Por exemplo:
- **Data:** `27/09/2025` (Brasil) vs. `09/27/2025` (EUA).
- **Moeda:** `R$ 1.234,56` (Brasil) vs. `$1,234.56` (EUA).

Exibir esses valores sem a formatação correta para o idioma do usuário cria uma experiência de usuário inconsistente e confusa.

## 2. A Solução: O Hook `useFormatters`

Para resolver este problema de forma centralizada e reutilizável, foi criado o hook `useFormatters`.

- **Localização:** `src/hooks/use-formatters.ts`
- **Responsabilidade:** Abstrair toda a complexidade da formatação. Ele detecta automaticamente o `locale` atual do usuário (a partir da URL) e fornece funções prontas para uso.

### Como Usar

O uso do hook é simples e obrigatório sempre que você precisar exibir uma data ou um valor monetário na interface.

**Passo 1: Importar o hook**
```tsx
import { useFormatters } from '@/hooks/use-formatters';
```

**Passo 2: Chamar o hook no seu componente**
```tsx
// Dentro do seu componente React
const { formatDate, formatCurrency } = useFormatters();
```

**Passo 3: Usar as funções no seu JSX**
```tsx
// Exemplo de uso
function UserDetails({ user }) {
  return (
    <div>
      <p>Data de Cadastro: {formatDate(user.createdAt)}</p>
      <p>Saldo da Conta: {formatCurrency(user.balance)}</p>
    </div>
  );
}
```

### Funções Disponíveis

- **`formatDate(date)`:**
    - **Entrada:** Um objeto `Date` do JavaScript ou um `Timestamp` do Firestore.
    - **Saída:** Uma string com a data e hora formatada de acordo com o `locale` do usuário (ex: "27 de set. de 2025 23:30:00").

- **`formatCurrency(amount, currencyCode)`:**
    - **Entrada:** Um `number` para o valor e, opcionalmente, um código de moeda de 3 letras (ex: 'USD', 'EUR'). Se não for fornecido, o padrão é 'BRL'.
    - **Saída:** Uma string com o valor formatado como moeda local (ex: "R$ 1.234,56").

## 3. Diretriz Obrigatória

**É mandatório que TODA E QUALQUER exibição de datas, horas ou valores monetários na interface do usuário seja feita através das funções fornecidas pelo hook `useFormatters`.**

A não utilização deste hook resultará em inconsistências visuais e uma falha em seguir os padrões de desenvolvimento estabelecidos para o projeto.
