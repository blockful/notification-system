# Testes Integrados do Sistema de Notificações

Este diretório contém ferramentas para executar testes integrados nos componentes do sistema de notificações.

## Componentes

O sistema é composto por três componentes principais:
- **Logic System**: Responsável pela lógica de negócios, monitoramento de dados e criação de notificações
- **Dispatcher**: Responsável pelo roteamento de notificações para os consumidores apropriados
- **Subscription Server**: Gerencia as preferências de notificação dos usuários

## Executando os Componentes

Para iniciar todos os componentes do sistema em modo de teste:

```bash
npm run test-components
```

Este comando iniciará todos os componentes e manterá o processo ativo até que você pressione Ctrl+C para encerrar.

## Desenvolvimento de Testes Integrados

Para desenvolver testes integrados:

1. Use o módulo `setup-services.ts` para iniciar os componentes necessários
2. Execute suas operações de teste
3. Não se esqueça de chamar `stopServices()` ao finalizar os testes

Exemplo básico:

```typescript
import { startServices, stopServices } from './setup-services';

async function runTest() {
  try {
    // Iniciar todos os serviços
    await startServices();
    
    // Execute aqui seus testes
    console.log('Executando testes...');
    
    // Encerre os serviços ao finalizar
    await stopServices();
  } catch (error) {
    console.error('Erro durante os testes:', error);
    // Certifique-se de encerrar os serviços mesmo em caso de erro
    await stopServices();
  }
}

runTest();
```

## Scripts Disponíveis

- `npm run build`: Compila o código TypeScript
- `npm run start-services`: Inicia os serviços
- `npm run test-components`: Inicia os componentes para testes manuais
- `npm test`: Executa os testes automatizados
- `npm run test:with-services`: Inicia os serviços, executa os testes e encerra os serviços 