# Logic System

Este módulo contém a lógica de processamento e triggers do sistema de notificações.

## Estrutura de Pastas

```
apps/logic-system/
├── src/
│   ├── domain/          # Modelos e regras de negócios
│   │   ├── models/      # Definições de modelos de domínio
│   │   └── services/    # Interfaces e serviços de domínio
│   │
│   ├── application/     # Implementação de casos de uso
│   │   ├── triggers/    # Implementações de triggers
│   │   └── services/    # Serviços de aplicação
│   │
│   ├── infrastructure/  # Implementações de interfaces externas
│   │   └── repositories/
│   │
│   └── interfaces/      # Contratos e interfaces
│       └── repositories/
│
└── tests/               # Testes unitários e de integração
    ├── unit/
    └── integration/
```

## Arquitetura

Este módulo segue os princípios de Clean Architecture:

1. **Domain**: Contém as regras de negócio e modelos
2. **Application**: Implementa casos de uso específicos
3. **Infrastructure**: Lida com detalhes técnicos externos
4. **Interfaces**: Define contratos entre camadas

## Como Usar

Para inicializar o sistema de lógica:

```typescript
import { initializeLogicSystem } from 'logic-system';

const logicSystem = initializeLogicSystem({
  proposalRepository: myProposalRepository,
  queueRepository: myQueueRepository,
  status: 'active',
  interval: 30000 // opcional, padrão: 60000ms
});

// Para parar o sistema
logicSystem.stop();
```

## Desenvolvimento

### Instalação
```bash
npm install
```

### Build
```bash
npm run build
```

### Testes
```bash
npm test
``` 