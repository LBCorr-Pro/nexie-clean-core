# Module: Convite (ID: invite)

## Description

Este módulo gerencia o sistema de convites para acesso à aplicação, permitindo a configuração de códigos, validade e templates de comunicação.

## Purpose

O objetivo principal é fornecer uma interface para configurar como os convites são gerados e enviados, controlando aspectos como o formato do código, o tempo de validade e o conteúdo das mensagens de convite. Crucialmente, permite a criação de convites direcionados a um e-mail específico, garantindo que apenas o destinatário pretendido possa se registrar.

## Firestore Structure

Consulte `firestore-structure.json` neste diretório para a definição detalhada das coleções e campos do Firestore relacionados a este módulo. As principais estruturas são:

*   **Configurações Operacionais Globais do Módulo:**
    *   Local: `/Global/master/config/modules/invite/settings/{configId}` (e caminhos análogos para instâncias)
    *   Descrição: Armazena versões das configurações operacionais do módulo de convite. A aplicação carrega o documento mais recente baseado no campo `createdAt`.
*   **Registros de Convites Individuais (Dados da Aplicação):**
    *   Local: `/Global/master/invite_module_data/generated_invites/{inviteId}` (e caminhos análogos para instâncias)
    *   Descrição: Armazena cada convite gerado. Esta coleção contém os dados operacionais, separada da configuração do módulo.

## Main Component

*   **Página de Configuração:** `src/modules/invite/page.tsx` - Permite configurar o comportamento dos convites.
*   **Página de Geração de Convite:** `src/app/[locale]/(app)/instances/[instanceId]/users/invite/page.tsx` - Permite que administradores criem e enviem convites para novos usuários.

## Funcionalidades de Configuração

A página `src/modules/invite/page.tsx` permite:
*   Definir o prefixo (`prefix`) e o tamanho (`code_length`) dos códigos de convite.
*   Configurar a validade (`validity_type`, `validity_value`), incluindo dias, horas, meses e a opção de não expirar.
*   Personalizar os templates de e-mail (`email_template`) e WhatsApp (`whatsapp_template`).

## To-Do / Future Enhancements

*   [ ] Integrar com um serviço de envio de e-mail para despachar os convites automaticamente.
*   [ ] Relatórios e monitoramento de convites enviados e aceitos.
