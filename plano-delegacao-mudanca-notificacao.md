# Plano de Implementação: Notificação de Mudança de Delegação

## Contexto

Implementar uma funcionalidade para notificar usuários quando eles **alteram a própria delegação** (quando delegam para alguém ou mudam para quem estão delegando), com foco na segurança e confirmação da transação realizada pelo próprio usuário.

## Análise do Sistema Atual

### Estrutura Existente

**Logic System (`apps/logic-system/`):**
- `VotingPowerChangedTrigger` - Já monitora mudanças de voting power via API da AntiCapture
- `base-trigger.ts` - Classe base para todos os triggers
- `App.ts` - Registra e gerencia todos os triggers

**Dispatcher (`apps/dispatcher/`):**
- `VotingPowerTriggerHandler` - Já processa eventos de delegação no `voting-power-trigger.service.ts:103-110`
- `TriggerProcessorService` - Gerencia handlers por trigger ID
- Notificações existentes para recebimento/remoção de delegação (quando outros delegam para você)

**AntiCapture Client (`packages/anticapture-client/`):**
- Query `ListVotingPowerHistorys` já captura dados de delegação
- Schema inclui campo `delegation` com `delegatorAccountId` e `delegatedValue`
- `ProcessedVotingPowerHistory` já diferencia `changeType: 'delegation'`

### Fluxo Atual de Delegação

1. **Logic System** busca `votingPowerHistorys` via GraphQL a cada 30s
2. Filtra eventos onde `changeType === 'delegation'`
3. **Dispatcher** recebe eventos e identifica:
   - `sourceAccountId` (delegador)
   - `targetAccountId` (quem recebe a delegação)
   - `delta` (valor positivo = nova delegação, negativo = undelegação)

### Gap Identificado

**Problema:** O sistema atual notifica apenas quem **recebe** delegação, mas não quem **delega**. 

**Notificações atuais:**
- ✅ "Você recebeu uma nova delegação de {{delegator}}"  
- ✅ "{{delegator}} removeu a delegação"
- ❌ "Você delegou para {{delegate}}" (FALTANDO)
- ❌ "Você removeu sua delegação de {{delegate}}" (FALTANDO)

## Plano de Implementação

### Abordagem: Refatoração com Lógica Compartilhada (ESCOLHIDA)

**Vantagens:**
- Aproveita toda infraestrutura existente
- Código mais limpo e organizado
- Lógica compartilhada para buscar subscribers e construir metadata
- Separação clara de responsabilidades por tipo de notificação
- Sem mudanças no Logic System
- Fácil manutenção e extensibilidade

**Implementação:**

#### Passo 1: Refatorar `VotingPowerTriggerHandler` com Lógica Compartilhada
**Arquivo:** `apps/dispatcher/src/services/triggers/voting-power-trigger.service.ts`

**Mudanças:**
```typescript
// Linha ~67: Refatorar o loop principal
for (const votingPowerEvent of validEvents) {
  const { changeType } = votingPowerEvent;
  
  if (changeType === 'delegation') {
    // Processar notificação para quem RECEBE a delegação (lógica existente)
    await this.processDelegationReceivedNotification(votingPowerEvent, walletOwnersMap, daoSubscribersMap);
    
    // NOVA: Processar notificação para quem FEZ a delegação
    await this.processDelegationSentNotification(votingPowerEvent, walletOwnersMap, daoSubscribersMap);
  } else {
    // Processar outros tipos de voting power changes (transfer, other)
    await this.processOtherVotingPowerNotification(votingPowerEvent, walletOwnersMap, daoSubscribersMap);
  }
}

// REFATORADO: Extrair lógica existente
private async processDelegationReceivedNotification(
  votingPowerEvent: ProcessedVotingPowerHistory,
  walletOwnersMap: Record<string, User[]>,
  daoSubscribersMap: Record<string, User[]>
): Promise<void> {
  const { daoId, accountId, sourceAccountId, delta, transactionHash, chainId } = votingPowerEvent;
  
  const subscribers = await this.getNotificationSubscribers(
    accountId, // quem recebe a delegação
    daoId,
    transactionHash,
    walletOwnersMap,
    daoSubscribersMap
  );
  
  if (subscribers.length === 0) return;
  
  const deltaValue = delta ? parseInt(delta) : 0;
  const formattedDelta = formatTokenAmount(Math.abs(deltaValue));
  
  let notificationMessage = '';
  if (deltaValue >= 0) {
    notificationMessage = `🥳 You've received a new delegation in ${daoId}!\n{{delegator}} delegated to you, increasing your voting power by ${formattedDelta}.`;
  } else {
    notificationMessage = `🥺 A delegator just undelegated in ${daoId}!\n{{delegator}} removed their delegation, reducing your voting power by ${formattedDelta}.`;
  }
  
  notificationMessage += '\n\n{{txLink}}';
  
  const metadata = this.buildNotificationMetadata(chainId, transactionHash, {
    delegator: sourceAccountId
  });
  
  await this.sendNotificationsToSubscribers(subscribers, notificationMessage, transactionHash, daoId, metadata);
}

// NOVO: Processar notificação para quem delega
private async processDelegationSentNotification(
  votingPowerEvent: ProcessedVotingPowerHistory,
  walletOwnersMap: Record<string, User[]>,
  daoSubscribersMap: Record<string, User[]>
): Promise<void> {
  const { daoId, accountId, sourceAccountId, targetAccountId, delta, transactionHash, chainId } = votingPowerEvent;
  
  // Não notificar se é a mesma account (self-delegation edge case)
  if (sourceAccountId === accountId || !sourceAccountId) return;
  
  const subscribers = await this.getNotificationSubscribers(
    sourceAccountId, // quem FEZ a delegação
    daoId,
    transactionHash,
    walletOwnersMap,
    daoSubscribersMap
  );
  
  if (subscribers.length === 0) return;
  
  const deltaValue = delta ? parseInt(delta) : 0;
  const formattedDelta = formatTokenAmount(Math.abs(deltaValue));
  
  let notificationMessage = '';
  if (deltaValue > 0) {
    notificationMessage = `✅ Delegation confirmed in ${daoId}!\nAccount {{delegatorAccount}} delegated ${formattedDelta} voting power to {{delegate}}.`;
  } else {
    notificationMessage = `↩️ Undelegation confirmed in ${daoId}!\nAccount {{delegatorAccount}} removed ${formattedDelta} voting power from {{delegate}}.`;
  }
  
  notificationMessage += '\n\n{{txLink}}';
  
  const metadata = this.buildNotificationMetadata(chainId, transactionHash, {
    delegatorAccount: sourceAccountId,
    delegate: targetAccountId
  });
  
  await this.sendNotificationsToSubscribers(subscribers, notificationMessage, transactionHash, daoId, metadata);
}

// REFATORADO: Extrair lógica existente para outros tipos
private async processOtherVotingPowerNotification(
  votingPowerEvent: ProcessedVotingPowerHistory,
  walletOwnersMap: Record<string, User[]>,
  daoSubscribersMap: Record<string, User[]>
): Promise<void> {
  const { daoId, accountId, changeType, delta, transactionHash, chainId } = votingPowerEvent;
  
  const subscribers = await this.getNotificationSubscribers(
    accountId,
    daoId,
    transactionHash,
    walletOwnersMap,
    daoSubscribersMap
  );
  
  if (subscribers.length === 0) return;
  
  const deltaValue = delta ? parseInt(delta) : 0;
  const formattedDelta = formatTokenAmount(Math.abs(deltaValue));
  
  let notificationMessage = '';
  if (changeType === 'transfer') {
    if (deltaValue >= 0) {
      notificationMessage = `📈 Your voting power increased in ${daoId}!\nYou gained ${formattedDelta} voting power from token transfer activity.`;
    } else {
      notificationMessage = `📉 Your voting power decreased in ${daoId}!\nYou lost ${formattedDelta} voting power from token transfer activity.`;
    }
  } else {
    // Generic voting power change
    if (deltaValue !== 0) {
      notificationMessage = `⚡ Your voting power has changed in ${daoId}!\nVoting power updated by ${formattedDelta}.`;
    } else {
      notificationMessage = `⚡ Your voting power has changed in ${daoId}!\nVoting power activity detected.`;
    }
  }
  
  notificationMessage += '\n\n{{txLink}}';
  
  const metadata = this.buildNotificationMetadata(chainId, transactionHash);
  
  await this.sendNotificationsToSubscribers(subscribers, notificationMessage, transactionHash, daoId, metadata);
}

// NOVO: Método auxiliar para buscar subscribers com lógica compartilhada
private async getNotificationSubscribers(
  accountId: string,
  daoId: string,
  transactionHash: string,
  walletOwnersMap: Record<string, User[]>,
  daoSubscribersMap: Record<string, User[]>
): Promise<User[]> {
  // Buscar owners da wallet
  const walletOwners = walletOwnersMap[accountId] || [];
  if (walletOwners.length === 0) return [];
  
  // Filtrar para inscritos no DAO
  const daoSubscribers = daoSubscribersMap[daoId] || [];
  const subscribedOwners = walletOwners.filter(owner => 
    daoSubscribers.some(sub => sub.id === owner.id)
  );
  
  if (subscribedOwners.length === 0) return [];
  
  // Verificar deduplicação
  const shouldSendNotifications = await this.subscriptionClient.shouldSend(
    subscribedOwners, 
    transactionHash, 
    daoId
  );
  
  return subscribedOwners.filter(owner => 
    shouldSendNotifications.some(notification => notification.user_id === owner.id)
  );
}

// NOVO: Método auxiliar para construir metadata
private buildNotificationMetadata(
  chainId?: number,
  transactionHash?: string,
  addresses?: Record<string, string>
): any {
  return {
    ...(chainId && transactionHash && {
      transaction: {
        hash: transactionHash,
        chainId: chainId
      }
    }),
    ...(addresses && { addresses })
  };
}
```

#### Passo 2: Atualizar Batch de Wallet Owners
**Necessário modificar a linha ~42 para incluir também os `sourceAccountId`:**

```typescript
// Buscar TODOS os account IDs únicos (quem recebe E quem delega)
const allAccountIds = [
  ...validEvents.map(event => event.accountId), // quem recebe
  ...validEvents.map(event => event.sourceAccountId).filter(Boolean) // quem delega
];
const uniqueAccountIds = [...new Set(allAccountIds)];
const walletOwnersMap = await this.subscriptionClient.getWalletOwnersBatch(uniqueAccountIds);
```

### Estrutura do Código Refatorado

**Organização dos Métodos:**
1. `handleMessage()` - Loop principal com lógica condicional
2. `processDelegationReceivedNotification()` - Quem recebe delegação  
3. `processDelegationSentNotification()` - Quem faz delegação (NOVO)
4. `processOtherVotingPowerNotification()` - Transfer e outros tipos
5. `getNotificationSubscribers()` - Lógica compartilhada para buscar subscribers
6. `buildNotificationMetadata()` - Lógica compartilhada para metadata

**Benefícios da Refatoração:**
- **DRY (Don't Repeat Yourself):** Evita duplicação de código
- **Single Responsibility:** Cada método tem uma responsabilidade específica
- **Maintainability:** Mudanças na lógica de subscribers afetam apenas um lugar
- **Readability:** Código mais fácil de entender e debuggar

## Testes Necessários

### Unit Tests
1. **VotingPowerTriggerHandler:**
   - Teste para delegação (delta > 0) do delegador
   - Teste para undelegação (delta < 0) do delegador
   - Teste que não notifica se sourceAccountId === accountId
   - Teste de deduplicação

2. **Integration Tests:**
   - Cenário completo: Alice delega para Bob
   - Verificar que Alice recebe notificação de confirmação
   - Verificar que Bob recebe notificação de nova delegação
   - Teste com múltiplas delegações simultâneas

### Test Data
**Usar `VotingPowerFactory.createDelegationEvent()`:**
```typescript
const delegationEvent = VotingPowerFactory.createDelegationEvent(
  'alice.eth', // delegator (quem vai receber notificação)
  'bob.eth',   // target
  '1000',      // valor
  'test-dao'
);
```

## Considerações de Segurança

1. **Deduplicação:** Usar mesmo `transactionHash` para evitar spam
2. **Validação:** Confirmar que `sourceAccountId !== accountId` 
3. **Permissões:** Apenas notificar usuários inscritos no DAO específico
4. **Rate Limiting:** Aproveitar limitação existente do RabbitMQ

## Mensagens de Notificação

**Para quem DELEGA (nova funcionalidade):**

**Delegação (delta > 0):**
```
✅ Delegation confirmed in {daoId}!
Account {delegatorAccount} delegated {formattedDelta} voting power to {delegate}.

{txLink}
```

**Undelegação (delta < 0):**
```
↩️ Undelegation confirmed in {daoId}!
Account {delegatorAccount} removed {formattedDelta} voting power from {delegate}.

{txLink}
```

**Para quem RECEBE delegação (existente):**
```
🥳 You've received a new delegation in {daoId}!
{delegator} delegated to you, increasing your voting power by {formattedDelta}.

{txLink}
```

## Timeline de Desenvolvimento

1. **Dia 1:** Implementar modificações no `VotingPowerTriggerHandler`
2. **Dia 2:** Escrever unit tests e integration tests
3. **Dia 3:** Testar em ambiente de staging
4. **Dia 4:** Deploy e monitoramento

## Riscos e Mitigações

**Risco 1:** Duplicação de notificações
- **Mitigação:** Usar sistema de deduplicação existente

**Risco 2:** Performance com muitas delegações
- **Mitigação:** Aproveitar batching existente de wallet owners

**Risco 3:** Confusão entre notificações
- **Mitigação:** Mensagens claras e distinct icons (✅ vs 🥳) com linguagem impessoal

## Próximos Passos

1. ✅ **Revisar e validar** este plano
2. **Implementar** a refatoração seguindo TDD:
   - Extrair métodos auxiliares primeiro
   - Implementar `processDelegationSentNotification()`
   - Atualizar batch de wallet owners
3. **Escrever testes** unitários e de integração
4. **Testar** com dados reais em staging
5. **Deploy** e monitoramento
6. **Documentar** a nova funcionalidade

---

**Implementação Escolhida:** Refatoração com lógica compartilhada para código mais limpo e manutenível, com mensagens impessoais que mencionam a account específica.