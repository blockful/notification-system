# Consumer Service

Dual-bot notification delivery service supporting Telegram (telegraf) and Slack (@slack/bolt). Consumes notifications from RabbitMQ and provides interactive bot commands.

## Architecture

```
RabbitMQ notifications.exchange
  ├── telegram-consumer-queue (binding: notifications.telegram.*)
  │     -> RabbitMQNotificationConsumerService<TelegramBotService>
  └── slack-consumer-queue (binding: notifications.slack.*)
        -> RabbitMQNotificationConsumerService<SlackBotService>
```

Both bot services implement `BotServiceInterface`:
```typescript
interface BotServiceInterface {
  sendNotification(payload: NotificationPayload): Promise<string>;
}
```

## Service Class Hierarchy

Platform-agnostic base classes with platform-specific implementations:

- **DAO Services**: `BaseDAOService` -> `TelegramDAOService` / `SlackDAOService`
- **Wallet Services**: `BaseWalletService` -> `TelegramWalletService` / `SlackWalletService`
- **Bot Services**: `TelegramBotService` / `SlackBotService` (both implement `BotServiceInterface`)

## Telegram Bot

- **Library**: telegraf v4.16.3
- **Interaction**: Long polling
- **Session**: Built-in telegraf session middleware (in-memory)
- **Commands**: `/start`, `/daos`, `/learn_more`
- **UI**: Inline keyboards with callback queries, persistent bottom keyboard

## Slack Bot

- **Library**: @slack/bolt v4.4.0, @slack/web-api v7.10.0
- **Interaction**: HTTPReceiver (webhook mode, not Socket Mode for delivery)
- **Session**: `InMemorySessionStorage` (custom, consider Redis for production)
- **Commands**: `/anticapture`
- **UI**: Block Kit (checkboxes, modals, sections, buttons)
- **OAuth**: Multi-workspace support with encrypted token fetch from Subscription Server
- **App Home**: Custom home tab view published on `app_home_opened` event

## Project Structure

```
src/
├── app.ts                          # Orchestrates both bots + RabbitMQ consumers
├── index.ts                        # Entry point
├── clients/
│   ├── telegram.client.ts          # Telegraf wrapper
│   └── slack.client.ts             # @slack/bolt wrapper with OAuth
├── config/
│   ├── env.ts                      # Zod-validated environment config
│   └── knownCommands.ts            # Telegram bot commands registry
├── interfaces/                     # BotServiceInterface, platform contexts, subscriptions
├── services/
│   ├── bot/                        # TelegramBotService, SlackBotService
│   ├── dao/                        # BaseDAOService + platform implementations
│   ├── wallet/                     # BaseWalletService + platform implementations
│   ├── ens-resolver.service.ts     # Viem-based ENS name resolution
│   ├── rabbitmq-notification-consumer.service.ts  # Generic RabbitMQ consumer
│   └── subscription-api.service.ts # REST client for Subscription Server
└── utils/
    ├── crypto.ts                   # AES-256-CBC encryption/decryption
    └── slack-blocks-templates.ts   # Slack Block Kit builders
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `TELEGRAM_BOT_TOKEN` | Yes | Telegram BotFather token |
| `SLACK_SIGNING_SECRET` | Yes | Slack app signing secret |
| `TOKEN_ENCRYPTION_KEY` | Yes | 64-char hex for workspace token decryption |
| `ANTICAPTURE_GRAPHQL_ENDPOINT` | Yes | GraphQL API endpoint |
| `SUBSCRIPTION_SERVER_URL` | Yes | Subscription Server base URL |
| `RABBITMQ_URL` | Yes | RabbitMQ connection string |
| `PORT` | No | Slack HTTP receiver port (default: 3002) |

## Testing

```bash
pnpm consumer test
```

Uses ts-jest. Type checking: `pnpm consumer check-types`.

## Key Implementation Details

- **ENS Resolution**: Viem client with 5s timeout, 10 retries at 500ms intervals
- **Crypto**: AES-256-CBC, format is `iv:encryptedData` (both hex-encoded)
- **Slack user format**: `workspaceId:userId` (e.g., `T_DEFAULT:U123456`)
- **Markdown conversion**: `convertMarkdownToSlack()` from `@notification-system/messages`
