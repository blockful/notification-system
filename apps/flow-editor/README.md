# Flow Editor

Visual flow editor for the Anticapture Notification Bot conversation flow.

## Features

- **Code View** (Read-only): Displays the current conversation flow parsed from the codebase
- **Design Tab** (Editable): Allows visual editing of the flow without modifying code
- **Telegram Preview**: Interactive chat simulation showing how messages appear to users
- **Auto-Refresh**: Automatically updates when message files change (in development)

## Running

```bash
# From the monorepo root
pnpm flow-editor dev

# Or directly
cd apps/flow-editor
pnpm dev
```

The editor will be available at http://localhost:3400

## Architecture

```
src/
├── app/
│   ├── page.tsx              # Main editor with tabs
│   ├── layout.tsx
│   └── api/flow/
│       ├── current/route.ts  # Parse code -> JSON
│       ├── draft/route.ts    # Save/load drafts
│       └── watch/route.ts    # File change notifications
├── components/
│   ├── flow-editor/
│   │   ├── FlowCanvas.tsx    # Node graph visualization
│   │   ├── FlowNode.tsx      # Individual node component
│   │   └── FlowToolbar.tsx   # Add node, export, etc.
│   ├── telegram-preview/
│   │   ├── TelegramPreview.tsx  # Telegram-style chat UI
│   │   └── MessageBubble.tsx    # Message rendering
│   └── TabSwitcher.tsx
├── hooks/
│   └── useAutoRefresh.ts     # Auto-refresh on file changes
└── lib/
    ├── flow-parser.ts        # Code -> Flow JSON
    └── flow-types.ts         # TypeScript interfaces
```

## UX Copy Sources

The flow parser extracts messages from:

| Source | Content |
|--------|---------|
| `uiMessages.welcome` | Welcome message |
| `uiMessages.help` | Help/learn more text |
| `uiMessages.daoSelection` | DAO selection prompt |
| `uiMessages.wallet.*` | Wallet management messages |
| `uiMessages.buttons.*` | Button labels |
| `uiMessages.errors.*` | Error messages |
| `telegramMessages.*` | Telegram-specific copy |

## Workflow

1. Run `pnpm flow-editor dev` to start the editor
2. **Code View** shows the current flow from the codebase
3. Switch to **Design** tab to experiment with changes
4. Use **Telegram Preview** to test the conversation flow
5. Export draft JSON for review before manual code integration
