# Guia do Sistema de URLs

Este documento explica os diferentes formatos de URL que o sistema Nexie suporta (ou planeja suportar) para acessar as instâncias e como eles interagem com a arquitetura.

---

## 1. O Modelo Atual: Acesso via Path (Caminho)

Este é o modelo **atualmente implementado** e o padrão da aplicação.

-   **Formato:** `www.nossoapp.com/{slug-da-instancia}/...`
-   **Sub-instância:** `www.nossoapp.com/{slug-da-instancia}/{slug-da-sub-instancia}/...`

### Como Funciona:

1.  **Middleware:** O `middleware.ts` do Next.js intercepta todas as requisições.
2.  **Identificação:** Ele analisa os segmentos do path da URL para identificar se um slug de instância ou sub-instância está presente.
3.  **Contextualização:** A lógica (através do `useInstanceActingContext` e do `useParams`) usa esses slugs para buscar os dados corretos no Firestore, aplicando as configurações específicas daquela instância/sub-instância.

### Vantagens:
-   Simples de implementar e gerenciar com um único deploy da aplicação.
-   Não requer configuração de DNS complexa.

---

## 2. O Modelo Futuro: Acesso via Subdomínio

Este é um objetivo de arquitetura para o futuro.

-   **Formato:** `empresa-x.nossoapp.com`

### Desafios de Implementação:

1.  **DNS Wildcard:** Requer a configuração de um registro DNS wildcard (ex: `*.nossoapp.com`) para apontar todas as requisições de subdomínio para o servidor da aplicação Next.js.
2.  **Lógica no Servidor:** O servidor Next.js precisaria de uma lógica para extrair o subdomínio do `host` da requisição e usá-lo para identificar a instância correta no banco de dados.
3.  **Certificados SSL:** Gerenciamento de certificados SSL para múltiplos subdomínios (geralmente via certificados wildcard).

---

## 3. O Modelo Avançado: Domínio Personalizado

Este é o recurso mais avançado, geralmente oferecido em planos de assinatura premium.

-   **Formato:** `www.aplicativo-do-cliente.com`

### Desafios de Implementação:

1.  **Configuração do Cliente:** O cliente (administrador da instância) precisa configurar um registro DNS (geralmente `CNAME`) em seu próprio provedor de domínio, apontando seu domínio para o servidor da aplicação Nexie.
2.  **Mapeamento no Backend:** O sistema Nexie precisa de uma interface para que o administrador da instância possa registrar seu domínio personalizado. O sistema então associa esse domínio ao `instanceId`.
3.  **Lógica no Servidor:** O servidor da aplicação precisa inspecionar o `host` de cada requisição e procurar no banco de dados por uma instância que corresponda àquele domínio personalizado.
4.  **Provisionamento de SSL:** O sistema precisa provisionar e renovar automaticamente certificados SSL para os domínios personalizados dos clientes, um processo complexo geralmente gerenciado por serviços como o Vercel ou plataformas de PaaS.

## Conclusão

Atualmente, a aplicação está 100% funcional com o modelo de **Acesso via Path**. Os modelos de subdomínio e domínio personalizado são objetivos de longo prazo que expandirão a flexibilidade da plataforma, mas exigirão uma infraestrutura de servidor e DNS mais complexa.
