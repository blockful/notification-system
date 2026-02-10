# Messages

Shared notification message templates, UI text, and formatters used across all services. Lightweight package with only `viem` as a runtime dependency.

## Structure

```
src/
├── triggers/                       # Per-trigger message templates
│   ├── new-proposal.ts             # Proposal announcement templates
│   ├── vote-confirmation.ts        # Vote confirmation (FOR/AGAINST/ABSTAIN)
│   ├── voting-reminder.ts          # Time-based reminders (4 urgency levels: 30%, 60%, 90%+)
│   ├── voting-power.ts             # Delegation/balance change notifications
│   ├── proposal-finished.ts        # Proposal outcome (5 statuses)
│   ├── non-voting.ts               # Non-voting address alerts
│   ├── delegation-change.ts        # Delegation transaction confirmations
│   └── buttons.ts                  # Call-to-action buttons + explorer links
├── ui/                             # Platform-specific UI messages
│   ├── common.ts                   # Cross-platform messages (welcome, errors, commands)
│   ├── slack.ts                    # Slack-specific (Block Kit structures, home page)
│   └── telegram.ts                 # Telegram-specific (wraps common)
├── formatters/
│   ├── placeholders.ts             # {{variable}} template replacement
│   ├── markdown-slack-converter.ts # Markdown -> Slack mrkdwn conversion
│   ├── explorer.service.ts         # Blockchain explorer URL builder (uses viem/chains)
│   └── dao-emoji.ts                # DAO emoji mappings (UNI -> unicode, ENS -> globe, etc.)
└── index.ts                        # All public exports
```

## Adding New Trigger Messages

1. Create `src/triggers/my-trigger.ts` with message templates using `{{placeholder}}` syntax
2. Export from `src/index.ts`
3. Add buttons config in `src/triggers/buttons.ts` if CTAs are needed

## Template System

Templates use `{{placeholder}}` syntax, replaced at runtime by `replacePlaceholders()`:

```typescript
import { replacePlaceholders, newProposalMessages } from '@notification-system/messages';

const text = replacePlaceholders(newProposalMessages.notification, {
  daoId: 'ENS',
  title: 'Proposal #42'
});
```

## Key Exports

```typescript
// Trigger templates
newProposalMessages, voteConfirmationMessages, votingReminderMessages,
proposalFinishedMessages, votingPowerMessages, nonVotingMessages,
delegationChangeMessages, callToActionButtons, buildButtons

// UI messages
uiMessages, slackMessages, telegramMessages

// Formatters
replacePlaceholders, convertMarkdownToSlack, ExplorerService,
daoEmojis, getDaoWithEmoji
```

## Testing

```bash
pnpm --filter @notification-system/messages test
```
