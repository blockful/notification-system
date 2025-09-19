# Milestone 5: Notification System V4 - Slack Integration

This document contains all issues from the [Notification System V4 - Slack Integration](https://github.com/blockful/notification-system/milestone/5) milestone. These issues represent a comprehensive Slack integration implementation for the notification system, broken down into progressive subtasks.

## Milestone Overview

- **Total Issues**: 6 (5 open, 1 closed)
- **Created**: 2025-09-08
- **Last Updated**: 2025-09-15

## Issues Summary

1. **#151** - Basic Slack Notification Delivery (Open)
2. **#152** - Interactive Slack Commands and Actions (Open)
3. **#155** - OAuth and Multi-Workspace support (Open)
4. **#153** - Implement Slack Block Kit Rich UI (Open)
5. **#154** - Integration Tests for Multi-Channel Architecture (Open)
6. **#149** - Setup slack integration branch (Closed)

---

## Issue #151: feat: Implement Basic Slack Notification Delivery

**Status**: Open
**Created**: 2025-09-11
**Assignee**: LeonardoVieira1630
**Labels**: feature

### 📋 Context
This is the first subtask of our Slack integration epic. We're starting with the minimal viable implementation that allows our notification system to send messages to Slack DMs, without any interactive features. This establishes the foundation for more advanced features in subsequent subtasks.

### 🎯 Objective
Enable the notification system to deliver basic text notifications to Slack direct messages for a single workspace (development/testing), ensuring zero impact on the existing Telegram integration.

### 📊 Implementation Timeline
```
┌─────────────────────────────────────────────────────────────────┐
│ Subtask 1: Basic Slack Delivery                                │
├─────────────────────────────────────────────────────────────────┤
│ ▶ In Progress                                                  │
└─────────────────────────────────────────────────────────────────┘

Progress: [░░░░░░░░░░] 0% Complete
```

### ✅ Acceptance Criteria

#### Functional Requirements
- [ ] System can send plain text notifications to Slack user DMs
- [ ] Messages support basic Slack markdown formatting
- [ ] Error handling and logging for Slack API failures
- [ ] Feature flag to enable/disable Slack integration
- [ ] Works with single workspace (dev/test environment)

#### Technical Requirements
- [ ] Slack Web API client integrated in Consumer service
- [ ] `SlackBotService` implementing notification delivery
- [ ] `SlackNotificationClient` in Dispatcher service
- [ ] Environment variables configured for single Slack token
- [ ] No breaking changes to Telegram functionality

#### Testing Requirements
- [ ] Unit tests for `SlackClient` class
- [ ] Unit tests for `SlackBotService`
- [ ] Integration test validating Slack delivery
- [ ] Manual verification in test Slack workspace

### 🛠️ Technical Implementation

#### New Files to Create
```
apps/consumers/src/
├── interfaces/
│   └── slack-client.interface.ts    # Minimal interface
├── slack.client.ts                  # Basic client (postMessage only)
└── services/
    └── slack-bot.service.ts         # Basic service (sendNotification only)

apps/dispatcher/src/services/notification/
└── slack-notification-client.ts     # Implements NotificationClient
```

#### Key Dependencies
```json
{
  "@slack/web-api": "^6.x.x"  # Web API only, no Bolt yet
}
```

#### Environment Variables
```bash
SLACK_BOT_TOKEN=xoxb-...              # Single workspace token
SLACK_SIGNING_SECRET=...              # For future validation
ENABLE_SLACK_INTEGRATION=true        # Feature flag
```

---

## Issue #152: feat: Slack Interactive Commands & Subscription Management

**Status**: Open
**Created**: 2025-09-11
**Assignee**: LeonardoVieira1630
**Labels**: feature

### 📋 Context
Building upon the basic delivery implemented in Subtask 1, this task adds interactive capabilities to our Slack bot. Users will be able to manage their DAO subscriptions directly through Slack using slash commands and app mentions, bringing feature parity with our Telegram implementation.

### 🎯 Objective
Enable users to interact with the bot through Slack commands, manage their subscriptions, and complete multi-step flows using session management, all while maintaining the existing notification delivery functionality.

### 📊 Implementation Timeline
```
┌─────────────────────────────────────────────────────────────────┐
│ Overall Slack Integration Progress                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ ✅ Subtask 1: Basic Delivery         [████████████] 100%       │
│ ▶  Subtask 2: Interactive Commands   [░░░░░░░░░░░░] 0%         │
│    Subtask 3: OAuth & Multi-Workspace [░░░░░░░░░░░░] 0%        │
│    Subtask 4: Rich UI                [░░░░░░░░░░░░] 0%         │
│    Subtask 5: Test Refactoring       [░░░░░░░░░░░░] 0%         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

Progress: [██░░░░░░░░] 20% of total Slack integration
```

### ✅ Acceptance Criteria

#### Functional Requirements
- [ ] Bot responds to slash commands (`/dao-notify`)
- [ ] Bot responds to app mentions (`@DAOBot`)
- [ ] Users can subscribe to DAOs via Slack
- [ ] Users can unsubscribe from DAOs via Slack
- [ ] Users can list their current subscriptions
- [ ] Users can add/remove wallet addresses
- [ ] Multi-step flows work with session state
- [ ] Help command provides usage instructions

#### Technical Requirements
- [ ] Slack Bolt framework integrated with Socket Mode
- [ ] Command handlers implemented for all interactions
- [ ] Session management adapted from Telegram pattern
- [ ] Single workspace configuration (development/testing)
- [ ] Backward compatibility with previous subtasks

#### Testing Requirements
- [ ] Unit tests for command handlers
- [ ] Unit tests for session management
- [ ] Integration tests for full subscription flow
- [ ] Tests for concurrent user interactions
- [ ] Regression tests for notification delivery
- [ ] Manual testing of all commands

### 🛠️ Technical Implementation

#### Dependencies Update
```json
{
  "@slack/bolt": "^3.x.x",      # Full framework
  "@slack/web-api": "^6.x.x"    # Already installed
}
```

#### New Environment Variables
```bash
SLACK_APP_TOKEN=xapp-...  # For Socket Mode
```

#### Command Structure

```
/dao-notify subscribe [dao-name]    # Start subscription flow
/dao-notify unsubscribe [dao-name]  # Remove subscription
/dao-notify list                    # Show user's subscriptions
/dao-notify wallet add [address]    # Add wallet
/dao-notify wallet remove [address] # Remove wallet
/dao-notify help                    # Show help message
```

---

## Issue #153: feat: Implement Slack Block Kit Rich UI

**Status**: Open
**Created**: 2025-09-11
**Assignee**: LeonardoVieira1630
**Labels**: feature

### 📋 Context
This is the UX enhancement phase of our Slack integration. With basic delivery, interactive commands, and OAuth support already working, we now upgrade the user interface using Slack's Block Kit framework. This will transform our plain text notifications and commands into a rich, interactive experience that matches modern Slack app standards.

### 🎯 Objective
Replace plain text messages with Block Kit components, add interactive buttons and modals, and create a polished, professional user experience that leverages Slack's native UI capabilities.

### 📊 Implementation Timeline
```
┌─────────────────────────────────────────────────────────────────┐
│ Overall Slack Integration Progress                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ ✅ Subtask 1: Basic Delivery         [████████████] 100%       │
│ ✅ Subtask 2: Interactive Commands   [████████████] 100%       │
│ ✅ Subtask 3: OAuth & Multi-Workspace [████████████] 100%       │
│ ▶  Subtask 4: Rich UI                [░░░░░░░░░░░░] 0%         │
│    Subtask 5: Test Refactoring       [░░░░░░░░░░░░] 0%         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

Progress: [██████░░░░] 60% of total Slack integration
```

### ✅ Acceptance Criteria

#### Functional Requirements
- [ ] All notifications use Block Kit formatting
- [ ] Interactive buttons for quick actions
- [ ] Dropdown menus for DAO selection
- [ ] Modal views for complex forms
- [ ] Loading states during async operations
- [ ] Ephemeral error messages for better UX
- [ ] Rich formatting with headers, dividers, and sections

#### Technical Requirements
- [ ] Block Kit builder patterns implemented
- [ ] Action handlers for interactive components
- [ ] View submission handlers for modals
- [ ] Proper state management for UI updates
- [ ] Backward compatibility with text-only clients

#### Testing Requirements
- [ ] Unit tests for Block Kit builders
- [ ] Unit tests for action handlers
- [ ] Integration tests for interactive flows
- [ ] Visual testing in Slack client
- [ ] Accessibility compliance verified

### 🛠️ Technical Implementation

#### Block Kit Structure Example
```typescript
// Notification with Block Kit
{
  blocks: [
    {
      type: "header",
      text: { type: "plain_text", text: "🏛️ New Proposal" }
    },
    {
      type: "section",
      text: { type: "mrkdwn", text: "*DAO:* ExampleDAO" },
      accessory: {
        type: "button",
        text: { type: "plain_text", text: "View Details" },
        url: "https://...",
        action_id: "view_proposal"
      }
    },
    {
      type: "actions",
      elements: [
        {
          type: "button",
          text: { type: "plain_text", text: "Vote Now" },
          style: "primary",
          action_id: "vote_now"
        },
        {
          type: "button",
          text: { type: "plain_text", text: "Remind Me Later" },
          action_id: "remind_later"
        }
      ]
    }
  ]
}
```

#### Files to Create/Modify
```
apps/consumers/src/
├── builders/
│   ├── notification-block.builder.ts   # Block Kit for notifications
│   ├── command-block.builder.ts        # Block Kit for commands
│   └── modal-view.builder.ts           # Modal view builders
├── handlers/
│   ├── slack-action.handler.ts         # Button/dropdown handlers
│   └── slack-view.handler.ts           # Modal submission handlers
└── services/
    └── slack-bot.service.ts            # Update to use builders

apps/dispatcher/src/
└── formatters/
    └── slack-block.formatter.ts        # Convert notifications to blocks
```

#### Interactive Components
- Buttons for DAO selection (replace typing)
- Dropdown menus for DAO lists
- Confirmation/cancellation buttons
- Modal dialogs for wallet management
- Loading messages during async operations

#### Action Handler Example
```typescript
// slack-action.handler.ts
app.action('select_dao', async ({ ack, body, client }) => {
  await ack();

  // Update message with loading state
  await client.chat.update({
    channel: body.channel.id,
    ts: body.message.ts,
    blocks: loadingBlocks()
  });

  // Process selection
  const result = await processSelection(body.actions[0].value);

  // Update with result
  await client.chat.update({
    channel: body.channel.id,
    ts: body.message.ts,
    blocks: resultBlocks(result)
  });
});
```

---

## Issue #154: refactor: Integration Tests for Multi-Channel Architecture

**Status**: Open
**Created**: 2025-09-11
**Assignee**: LeonardoVieira1630
**Labels**: feature

### 📋 Context
Our integration tests are currently tightly coupled to Telegram, making it impossible to test new channels like Slack without significant code duplication. This technical debt task refactors our test architecture to support multiple notification channels through abstractions and contract testing, ensuring we can efficiently test any current or future channel.

### 🎯 Objective
Create a channel-agnostic testing framework that allows us to test common notification behaviors once for all channels, while still supporting channel-specific feature testing, ultimately reducing test maintenance and improving test coverage.

### 📊 Implementation Timeline
```
┌─────────────────────────────────────────────────────────────────┐
│ Overall Slack Integration Progress                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ ✅ Subtask 1: Basic Delivery         [████████████] 100%       │
│ ✅ Subtask 2: Interactive Commands   [████████████] 100%       │
│ ✅ Subtask 3: OAuth & Multi-Workspace [████████████] 100%       │
│ ✅ Subtask 4: Rich UI                [████████████] 100%       │
│ ▶  Subtask 5: Test Refactoring       [░░░░░░░░░░░░] 0%         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

Progress: [████████░░] 80% of total Slack integration
```

### ✅ Acceptance Criteria

#### Architectural Requirements
- [ ] Channel adapter interface defined
- [ ] Telegram adapter implementation
- [ ] Slack adapter implementation
- [ ] Contract test suite for common behaviors
- [ ] Test factories decoupled from specific channels
- [ ] Multi-workspace support in Slack adapter

#### Functional Requirements
- [ ] All existing Telegram tests still pass
- [ ] New Slack tests run independently
- [ ] Contract tests validate both channels
- [ ] Parallel test execution supported
- [ ] Channel isolation verified

#### Testing Requirements
- [ ] Adapter implementations have unit tests
- [ ] Contract tests cover core functionality
- [ ] Migration guide documented
- [ ] CI pipeline updated for parallel execution

### 🛠️ Technical Implementation

#### Directory Structure
```
apps/integrated-tests/
├── tests/
│   ├── contracts/                      # Shared contract tests
│   │   ├── notification-delivery.contract.test.ts
│   │   ├── subscription-management.contract.test.ts
│   │   └── command-handling.contract.test.ts
│   ├── channels/
│   │   ├── telegram/
│   │   │   ├── telegram-specific.test.ts
│   │   │   └── telegram.adapter.ts
│   │   └── slack/
│   │       ├── slack-specific.test.ts
│   │       ├── slack-multi-workspace.test.ts
│   │       └── slack.adapter.ts
│   └── fixtures/
│       ├── adapters/
│       │   └── base.adapter.ts
│       └── factories/
│           └── user.factory.ts         # Refactored for multi-channel
```


---

## Summary

This milestone represents a comprehensive effort to add Slack integration to the notification system. The issues are structured as progressive subtasks that build upon each other:

1. **Basic Delivery** - Foundation for sending notifications to Slack
2. **Interactive Commands** - Add user interaction capabilities
3. **OAuth & Multi-Workspace** - Enable multiple workspaces to use the bot
4. **Rich UI with Block Kit** - Enhanced user experience with Slack's UI framework
5. **Test Refactoring** - Ensure maintainable testing for multi-channel support

Each issue contains detailed technical specifications, acceptance criteria, and implementation guidelines that follow a clear progression from basic functionality to advanced features.