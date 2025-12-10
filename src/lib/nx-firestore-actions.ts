// src/lib/nx-firestore-actions.ts
// Este arquivo foi intencionalmente esvaziado.
// As funções genéricas `nxSaveData` e `nxDeleteData` apresentavam uma vulnerabilidade
// de segurança crítica, pois permitiam que o cliente especificasse um caminho de
// escrita arbitrário no banco de dados.

// A nova arquitetura exige a criação de Server Actions específicas e granulares
// para cada operação de banco de dados, onde o caminho do Firestore é construído
// e validado no lado do servidor, nunca recebido do cliente.

// Exemplo de nova ação segura em: /src/lib/actions/appearance-actions.ts
