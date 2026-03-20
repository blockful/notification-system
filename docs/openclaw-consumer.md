# OpenClaw Consumer

A third notification consumer alongside Telegram and Slack that delivers DAO governance proposal notifications to an [OpenClaw](https://openclaw.ai) agent via webhook.

## Purpose

When a new proposal is detected in any monitored DAO, the OpenClaw consumer forwards the notification to a configured OpenClaw agent (e.g., a governance research agent) that can then:

- Analyze the proposal
- Draft voting rationale
- Trigger downstream governance workflows

## Architecture

The OpenClaw consumer follows the exact same pattern as the Telegram and Slack consumers:

```
Logic System → RabbitMQ → Dispatcher → notifications.openclaw.* → OpenClaw Consumer → Webhook POST
```

### New Files

| File | Description |
|------|-------------|
| `apps/consumers/src/interfaces/openclaw-client.interface.ts` | Client interface (mirrors `telegram-client.interface.ts`) |
| `apps/consumers/src/clients/openclaw.client.ts` | HTTP webhook client |
| `apps/consumers/src/services/bot/openclaw-bot.service.ts` | Bot service implementing `BotServiceInterface` (notification-only, no interactive commands) |

### Modified Files

| File | Change |
|------|--------|
| `apps/consumers/src/app.ts` | Wired OpenClaw as third consumer |
| `apps/consumers/src/index.ts` | Creates `OpenClawClient` from env config |
| `apps/consumers/src/config/env.ts` | Added `OPENCLAW_WEBHOOK_URL` + `OPENCLAW_API_KEY` (both optional) |
| `apps/consumers/example.env` | Documented new env vars |
| `apps/dispatcher/src/app.ts` | Added `openclaw` channel to notification factory |
| `docker-compose.yml` | Passes env vars to consumers container |

## Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENCLAW_WEBHOOK_URL` | No | The webhook endpoint URL for the OpenClaw agent. If omitted, the consumer runs in noop mode (no impact on Telegram/Slack). |
| `OPENCLAW_API_KEY` | Yes (when URL is set) | API key sent as `Authorization: Bearer <key>` header. The receiving endpoint rejects requests without a valid key. |

### Webhook Payload

The consumer sends `POST` requests to `OPENCLAW_WEBHOOK_URL` with the following JSON body:

```json
{
  "message": "🏛 New Proposal in UNI\n\n**Title:** Example Proposal\n...",
  "source": "anticapture-notification-system",
  "timestamp": "2026-03-20T18:00:00.000Z",
  "metadata": {
    "triggerType": "newProposal",
    "addresses": { "proposer": "0x..." },
    "transaction": { "hash": "0x...", "chainId": 1 },
    "buttons": [{ "text": "View Proposal", "url": "https://..." }]
  }
}
```

## Database Setup (Required for Production)

After deploying the code changes, an OpenClaw user must be registered in the subscription database for notifications to be routed. Use the subscription server API:

```bash
# Register the OpenClaw user and subscribe to each DAO
# Replace $SUBSCRIPTION_SERVER_URL with the production URL

for DAO in AAVE NOUNS GTC OBOL COMP ENS SCR UNI SHU; do
  curl -X POST "$SUBSCRIPTION_SERVER_URL/subscriptions/$DAO" \
    -H "Content-Type: application/json" \
    -d '{
      "channel": "openclaw",
      "channel_user_id": "cra",
      "is_active": true
    }'
done
```

This creates a user with `channel: "openclaw"` and subscribes it to all monitored DAOs. The dispatcher will then route `notifications.openclaw.*` messages for this subscriber.

## Graceful Degradation

- If `OPENCLAW_WEBHOOK_URL` is **not set**: the consumer starts in noop mode. RabbitMQ messages on `notifications.openclaw.*` are consumed and silently acknowledged. Zero impact on existing Telegram/Slack consumers.
- If the **webhook endpoint is unreachable**: the consumer logs the error. The notification is marked as failed (not re-queued). Other consumers are unaffected.
- If **no openclaw user exists in the DB**: the dispatcher simply has no subscribers for the `openclaw` channel and sends nothing to the queue. No errors.
