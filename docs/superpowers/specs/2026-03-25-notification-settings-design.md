# Notification Settings (Per Notification Type)

## Goal

Allow users to choose which types of notifications they want to receive. Settings are global (per user, not per DAO). All notifications are enabled by default — the user explicitly opts out of types they don't want. Both Telegram and Slack are supported.

---

## Decisions

| Topic | Decision |
|---|---|
| Granularity | Global per user (not per DAO) |
| Notification type registry | Shared `NOTIFICATION_TYPES` constant in `packages/messages` |
| Default behavior | Opt-out — missing row in DB means enabled |
| Save behavior | Bulk upsert all types on save (`is_active: true/false`) |
| Filtering location | Subscription server — `filterActiveUsers` in repository, called by existing service methods |
| Filtering shared logic | Single `filterActiveUsers()` method in repository, consumed by all service methods that return users |
| Trigger IDs | Use actual codebase IDs (no `-trigger` suffix) |
| Non-voting alerts | Separate notification type (`non-voting`), independent of `proposal-finished` |
| Voting reminders | 3 separate toggles (30%, 60%, 90%), requires trigger ID split |
| Consumer user identification | Endpoints use `channel + channelUserId`, subscription server resolves internally |
| Telegram UI | Persistent keyboard button + `/settings` command → inline toggle grid |
| Slack UI | Button in welcome message + App Home → checkbox list (Block Kit) |
| Onboarding | Mention settings in `/start`, post-onboarding messages (both bots) |

---

## Architecture Overview

```
[packages/messages]
  └── NOTIFICATION_TYPES: { id, label }[]  (10 types)

[subscription-server]
  ├── DB: user_notification_preferences(user_id, trigger_type, is_active)
  ├── UserNotificationPreferencesRepository
  │     └── filterActiveUsers(userIds[], triggerType) — single shared filtering method
  ├── SettingsService (get + bulk upsert)
  ├── GET  /users/by-channel/:channel/:channelUserId/notification-preferences
  ├── POST /users/by-channel/:channel/:channelUserId/notification-preferences
  └── Existing endpoints extended with optional triggerType param:
        getDaoSubscribers, getWalletOwners, getWalletOwnersBatch
        → all call filterActiveUsers internally when triggerType is provided

[dispatcher]
  ├── ISubscriptionClient + SubscriptionClient — propagate triggerType
  ├── BaseTriggerHandler.getSubscribers(..., triggerType?) — passes through
  ├── Each handler passes its trigger type (e.g., 'new-proposal', 'non-voting')
  ├── BatchNotificationService — accepts triggerType, passes to getWalletOwnersBatch AND getDaoSubscribers
  └── VotingReminder registration split: voting-reminder-30, -60, -90
  ⚠ Deploy note: logic-system (Step 2) and dispatcher (Step 8) must be deployed atomically

[consumers]
  ├── SubscriptionAPIService — new methods for preferences
  ├── BaseSettingsService (shared logic: load + save preferences)
  ├── TelegramSettingsService (toggle grid)
  └── SlackSettingsService (checkbox list)
```

---

## NOTIFICATION_TYPES

```typescript
export const NOTIFICATION_TYPES = [
  { id: 'new-proposal',           label: 'New Proposals' },
  { id: 'new-offchain-proposal',  label: 'Offchain Proposals' },
  { id: 'proposal-finished',      label: 'Proposal Finished' },
  { id: 'non-voting',             label: 'Non-Voting Alerts' },
  { id: 'voting-reminder-30',     label: 'Voting Reminder (30%)' },
  { id: 'voting-reminder-60',     label: 'Voting Reminder (60%)' },
  { id: 'voting-reminder-90',     label: 'Voting Reminder (90%)' },
  { id: 'voting-power-changed',   label: 'Voting Power Changed' },
  { id: 'vote-confirmation',      label: 'Vote Confirmation' },
  { id: 'offchain-vote-cast',     label: 'Offchain Vote Cast' },
] as const;

export type NotificationTypeId = typeof NOTIFICATION_TYPES[number]['id'];
```

Located in `packages/messages/src/notification-types.ts`, re-exported from `packages/messages/src/index.ts`.

---

## Step-by-Step Implementation

### Step 1 — `packages/messages`: NOTIFICATION_TYPES

**New file:** `packages/messages/src/notification-types.ts`

- Define `NOTIFICATION_TYPES` array and `NotificationTypeId` type as shown above.
- Re-export from `packages/messages/src/index.ts`.

### Step 2 — `logic-system`: VotingReminderTrigger unique IDs

**File:** `apps/logic-system/src/triggers/voting-reminder-trigger.ts`

Change constructor:
```typescript
// Before:
super(TRIGGER_ID_PREFIX, interval);

// After:
super(`${TRIGGER_ID_PREFIX}-${thresholdPercentage}`, interval);
```

This makes the 3 instances emit distinct trigger IDs: `voting-reminder-30`, `voting-reminder-60`, `voting-reminder-90`.

Deduplication is not affected — the `notifications` table deduplicates by `(user_id, dao_id, event_id)`, and the voting reminder event_id already includes the threshold percentage.

**⚠ Deploy note:** This change MUST be deployed atomically with the dispatcher registration update (Step 8). If logic-system deploys first, messages will arrive with IDs `'voting-reminder-30'` etc. but the dispatcher will have no handler registered for them and will silently drop them.

### Step 3 — `subscription-server`: DB Migration

**New file:** `apps/subscription-server/db/migrations/<timestamp>_create_user_notification_preferences.ts`

```typescript
export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('user_notification_preferences', (table) => {
    table.string('user_id', 36).notNullable();
    table.string('trigger_type', 100).notNullable();
    table.boolean('is_active').notNullable().defaultTo(true);
    table.datetime('updated_at').notNullable().defaultTo(knex.fn.now());
    table.primary(['user_id', 'trigger_type']);
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('user_notification_preferences');
}
```

- Composite PK `(user_id, trigger_type)` — one row per user per type.
- `CASCADE` delete keeps DB clean if user is removed.
- No pre-seeding needed — missing row = enabled (opt-out model).

### Step 4 — `subscription-server`: Repository

**New file:** `apps/subscription-server/src/repositories/user-notification-preferences.repository.ts`

Methods:
- `findByUser(userId: string): Promise<UserNotificationPreference[]>` — returns all stored preferences for user.
- `upsertMany(userId: string, preferences: { trigger_type: string; is_active: boolean }[]): Promise<void>` — uses knex `onConflict(['user_id', 'trigger_type']).merge(['is_active', 'updated_at'])`.
- `filterActiveUsers(userIds: string[], triggerType: string): Promise<string[]>` — **the single shared filtering method**. Queries users who have `is_active = false` for the given trigger type, returns the input list minus those users. Missing row = enabled.

```typescript
async filterActiveUsers(userIds: string[], triggerType: string): Promise<string[]> {
  if (userIds.length === 0) return [];
  const disabled = await this.db('user_notification_preferences')
    .where({ trigger_type: triggerType, is_active: false })
    .whereIn('user_id', userIds)
    .select('user_id');
  const disabledSet = new Set(disabled.map(r => r.user_id));
  return userIds.filter(id => !disabledSet.has(id));
}
```

### Step 5 — `subscription-server`: SettingsService + API Endpoints

**New file:** `apps/subscription-server/src/services/settings.service.ts`

- `getUserPreferences(userId: string)` — calls `prefsRepo.findByUser(userId)`.
- `saveUserPreferences(userId: string, preferences[])` — validates trigger_types against `NOTIFICATION_TYPES` ids, calls `prefsRepo.upsertMany()`.

**New file:** `apps/subscription-server/src/controllers/settings.controller.ts`

Endpoints (using `channel + channelUserId`):

```
GET  /users/by-channel/:channel/:channelUserId/notification-preferences
  → resolve user internally → SettingsService.getUserPreferences(userId)
  → Response: { preferences: [{ trigger_type, is_active }] }

POST /users/by-channel/:channel/:channelUserId/notification-preferences
  → body: { preferences: [{ trigger_type: string, is_active: boolean }] }
  → resolve/create user → SettingsService.saveUserPreferences(userId, preferences)
  → Response: 204 No Content
```

### Step 6 — `subscription-server`: Extend existing service methods with triggerType

**File:** `apps/subscription-server/src/services/subscription.service.ts`

Add `triggerType?: string` parameter to:
- `getDaoSubscribers(dao, eventTimestamp?, triggerType?)` — after fetching userIds, if triggerType present: `userIds = await prefsRepo.filterActiveUsers(userIds, triggerType)`.
- `getUsersByWalletAddress(address, triggerType?)` — same pattern.
- `getUsersByWalletAddressesBatch(addresses, triggerType?)` — same pattern.

All three call the same `filterActiveUsers` method. No logic duplication.

Update corresponding controllers/routes to accept and pass `triggerType` query param/body field.

### Step 7 — `dispatcher`: ISubscriptionClient + SubscriptionClient

**File:** `apps/dispatcher/src/interfaces/subscription-client.interface.ts`

Add optional `triggerType` parameter to:
```typescript
getDaoSubscribers(daoId: string, eventTimestamp?: string, triggerType?: string): Promise<User[]>;
getWalletOwners(address: string, triggerType?: string): Promise<User[]>;
getWalletOwnersBatch(addresses: string[], triggerType?: string): Promise<Record<string, User[]>>;
```

**File:** `apps/dispatcher/src/services/subscription-client.service.ts`

Update HTTP calls to pass `triggerType` as query param / body field.

### Step 8 — `dispatcher`: BaseTriggerHandler + voting-reminder registration

**File:** `apps/dispatcher/src/services/triggers/base-trigger.service.ts`

Update `getSubscribers`:
```typescript
protected async getSubscribers(
  daoId: string, eventId: string, eventTimestamp?: string, triggerType?: string
): Promise<User[]> {
  const allSubscribers = await this.subscriptionClient.getDaoSubscribers(daoId, eventTimestamp, triggerType);
  // ... rest unchanged (deduplication filter)
}
```

**File:** `apps/dispatcher/src/app.ts`

Replace single voting reminder registration with 3:
```typescript
triggerProcessorService.addHandler('voting-reminder-30', new VotingReminderTriggerHandler(...));
triggerProcessorService.addHandler('voting-reminder-60', new VotingReminderTriggerHandler(...));
triggerProcessorService.addHandler('voting-reminder-90', new VotingReminderTriggerHandler(...));
```

### Step 9 — `dispatcher`: Each handler passes triggerType

**Standard-only handlers** — only use `this.getSubscribers()`:

| Handler | File | triggerType |
|---|---|---|
| NewProposalTriggerHandler | `new-proposal-trigger.service.ts` | `'new-proposal'` |
| NewOffchainProposalTriggerHandler | `new-offchain-proposal-trigger.service.ts` | `'new-offchain-proposal'` |
| ProposalFinishedTriggerHandler | `proposal-finished-trigger.service.ts` | `'proposal-finished'` |

**Hybrid handlers** — use BOTH `this.getSubscribers()` AND `getWalletOwnersBatch`/`getWalletOwners`. The triggerType must be passed to ALL subscription client calls in each handler:

| Handler | File | triggerType | Calls that need triggerType |
|---|---|---|---|
| VoteConfirmationTriggerHandler | `vote-confirmation-trigger.service.ts` | `'vote-confirmation'` | `getWalletOwnersBatch` + `this.getSubscribers` |
| OffchainVoteCastTriggerHandler | `offchain-vote-cast-trigger.service.ts` | `'offchain-vote-cast'` | `getWalletOwnersBatch` + `this.getSubscribers` |
| VotingPowerTriggerHandler | `voting-power-trigger.service.ts` | `'voting-power-changed'` | `getWalletOwnersBatch` + `getDaoSubscribers` (called directly, not via `getSubscribers`) |

**NonVotingHandler** — registered under `'proposal-finished'` trigger routing, but uses `'non-voting'` as its notification type for preference filtering. Passes `'non-voting'` through `BatchNotificationService`.

### Step 10 — `dispatcher`: BatchNotificationService accepts triggerType

**File:** `apps/dispatcher/src/services/batch-notification.service.ts`

Add `triggerType?: string` parameter to `sendBatchNotifications`. Propagate to **both** `getWalletOwnersBatch` **and** `getDaoSubscribers` inside `prepareBatchData` (both are called internally and both need filtering).

Handlers using batch service:
- `VotingReminderTriggerHandler` passes `message.triggerId` (now `'voting-reminder-30'`, `-60`, `-90`).
- `NonVotingHandler` passes `'non-voting'`.

### Step 11 — `consumers`: SubscriptionAPIService

**File:** `apps/consumers/src/services/subscription-api.service.ts`

New methods:
```typescript
getNotificationPreferences(channel: string, channelUserId: string): Promise<{ trigger_type: string; is_active: boolean }[]>
saveNotificationPreferences(channel: string, channelUserId: string, preferences: { trigger_type: string; is_active: boolean }[]): Promise<void>
```

### Step 12 — `consumers`: BaseSettingsService

**New file:** `apps/consumers/src/services/settings/base-settings.service.ts`

Shared logic:
- `loadPreferences(channel, channelUserId)` — fetches stored prefs, merges with defaults (missing = true). Returns `Record<string, boolean>`.
- `savePreferences(channel, channelUserId, selections)` — maps all NOTIFICATION_TYPES to preferences array, calls API.

### Step 13 — `consumers/telegram`: TelegramSettingsService + wiring

**New file:** `apps/consumers/src/services/settings/telegram-settings.service.ts`

Follows `TelegramDAOService` pattern:
- `initialize(ctx)` → load prefs → store in `ctx.session.notificationSelections` → show inline toggle grid.
- `toggle(ctx, triggerId)` → flip value in session → `editMessageReplyMarkup` to refresh.
- `confirm(ctx)` → `savePreferences()` → success message.

**Keyboard layout:**
```
[ ✅ New Proposals         ] [ ✅ Offchain Proposals    ]
[ ✅ Proposal Finished     ] [ ✅ Non-Voting Alerts     ]
[ ✅ Voting Reminder (30%) ] [ ✅ Voting Reminder (60%) ]
[ ✅ Voting Reminder (90%) ] [ ✅ Voting Power Changed  ]
[ ✅ Vote Confirmation     ] [ ✅ Offchain Vote Cast    ]
[            💾 Save                                    ]
```

**Wiring** (`telegram-bot.service.ts`):
```typescript
handlers.command(/^settings$/i, (ctx) => this.settingsService.initialize(ctx));
handlers.hears(uiMessages.buttons.settings, (ctx) => this.settingsService.initialize(ctx));
handlers.action(/^settings_toggle_(.+)$/, (ctx) => this.settingsService.toggle(ctx, ctx.match[1]));
handlers.action(/^settings_confirm$/, (ctx) => this.settingsService.confirm(ctx));
```

- Add `⚙️ Settings` to persistent keyboard.
- Add `/settings` to `knownCommands.ts`.
- Add `notificationSelections?: Record<string, boolean>` to Telegram session interface.
- Update existing `learn_more_settings` action handler and `settingsComingSoon` message — replace "coming soon" behavior with actual settings flow.

### Step 14 — `consumers/slack`: SlackSettingsService + wiring

**New file:** `apps/consumers/src/services/settings/slack-settings.service.ts`

Follows `SlackDAOService` pattern:
- `initialize(ctx)` → load prefs → show checkbox block with `initial_options`.
- `confirm(ctx)` → extract selected from `state.values` → build full preferences record → `savePreferences()`.

**Wiring** (`slack-bot.service.ts`):
```typescript
handlers.action('settings_open', (ctx) => this.settingsService.initialize(ctx));
handlers.action('settings_confirm', (ctx) => this.settingsService.confirm(ctx));
```

- Add `⚙️ Settings` button to welcome message and App Home blocks.
- Add `notificationSelections?: Record<string, boolean>` to Slack session interface.

**Note on session serialization:** Use `Record<string, boolean>` (not `Map`) for `notificationSelections` in both Telegram and Slack sessions. `Map` objects do not serialize/deserialize cleanly to JSON, which breaks session persistence.

### Step 15 — `consumers`: Onboarding message updates

| Bot | Location | Addition |
|---|---|---|
| Telegram | `/start` reply | "Use ⚙️ Settings to choose which notifications you receive." |
| Telegram | post-DAO-confirm | "Tip: tap ⚙️ Settings to fine-tune your notification types." |
| Slack | welcome blocks | `⚙️ Settings` button alongside existing buttons |
| Slack | App Home | `⚙️ Settings` button |

### Step 16 — Unit tests

> **Note:** Before writing tests, use the `/testing` command to capture project-specific testing context and best practices.

| Layer | What to test |
|---|---|
| `UserNotificationPreferencesRepository` | `filterActiveUsers` returns correctly with mix of enabled/disabled/no-row users |
| `SettingsService` | Validation of invalid trigger_types, merge of defaults with stored |
| `SubscriptionService` | `getDaoSubscribers` with and without `triggerType` — verify filtering when present, no filtering when absent |
| Dispatcher handlers | Each handler passes correct triggerType to subscription client (stub verifies args) |
| `BaseSettingsService` | `loadPreferences` correct merge (missing = true), `savePreferences` sends all types |
| **Safety net test** | All dispatcher handler IDs registered have matching entry in `NOTIFICATION_TYPES` |

### Step 17 — Integration tests

> **Note:** Before writing tests, use the `/testing` command to capture project-specific testing context and best practices.

Two integration tests covering the full pipeline:

1. **Selective filtering**: User disables `'new-proposal'` but has `'proposal-finished'` enabled → trigger fires both → user receives only proposal-finished notification.
2. **Default behavior**: User with no saved preferences → receives all notification types.

---

## File Checklist

### New files
- [ ] `packages/messages/src/notification-types.ts`
- [ ] `apps/subscription-server/db/migrations/<ts>_create_user_notification_preferences.ts`
- [ ] `apps/subscription-server/src/repositories/user-notification-preferences.repository.ts`
- [ ] `apps/subscription-server/src/services/settings.service.ts`
- [ ] `apps/subscription-server/src/controllers/settings.controller.ts`
- [ ] `apps/consumers/src/services/settings/base-settings.service.ts`
- [ ] `apps/consumers/src/services/settings/telegram-settings.service.ts`
- [ ] `apps/consumers/src/services/settings/slack-settings.service.ts`

### Files to edit
- [ ] `packages/messages/src/index.ts` — re-export NOTIFICATION_TYPES
- [ ] `apps/logic-system/src/triggers/voting-reminder-trigger.ts` — unique ID per threshold
- [ ] `apps/subscription-server/src/services/subscription.service.ts` — extend getDaoSubscribers/getWalletOwners/batch with triggerType
- [ ] `apps/subscription-server/src/controllers/dao.controller.ts` — pass triggerType query param
- [ ] `apps/dispatcher/src/interfaces/subscription-client.interface.ts` — add triggerType to methods
- [ ] `apps/dispatcher/src/services/subscription-client.service.ts` — propagate triggerType in HTTP calls
- [ ] `apps/dispatcher/src/services/triggers/base-trigger.service.ts` — add triggerType to getSubscribers
- [ ] `apps/dispatcher/src/services/triggers/new-proposal-trigger.service.ts` — pass triggerType
- [ ] `apps/dispatcher/src/services/triggers/new-offchain-proposal-trigger.service.ts` — pass triggerType
- [ ] `apps/dispatcher/src/services/triggers/proposal-finished-trigger.service.ts` — pass triggerType
- [ ] `apps/dispatcher/src/services/triggers/voting-reminder-trigger.service.ts` — pass triggerType
- [ ] `apps/dispatcher/src/services/triggers/voting-power-trigger.service.ts` — pass triggerType
- [ ] `apps/dispatcher/src/services/triggers/vote-confirmation-trigger.service.ts` — pass triggerType
- [ ] `apps/dispatcher/src/services/triggers/offchain-vote-cast-trigger.service.ts` — pass triggerType
- [ ] `apps/dispatcher/src/services/triggers/non-voting-handler.service.ts` — pass 'non-voting'
- [ ] `apps/dispatcher/src/services/batch-notification.service.ts` — accept triggerType
- [ ] `apps/dispatcher/src/app.ts` — voting-reminder x3 registration
- [ ] `apps/consumers/src/services/subscription-api.service.ts` — new preference methods
- [ ] `apps/consumers/src/services/bot/telegram-bot.service.ts` — wire settings handlers
- [ ] `apps/consumers/src/services/bot/slack-bot.service.ts` — wire settings handlers
- [ ] `apps/subscription-server/src/controllers/user-address.controller.ts` — pass triggerType to getWalletOwners/batch endpoints
- [ ] `apps/consumers/src/config/knownCommands.ts` — add `/settings` with description `'Manage your notification preferences'`
- [ ] `apps/consumers/src/interfaces/bot.interface.ts` — add notificationSelections (Record<string, boolean>) to Telegram session
- [ ] `apps/consumers/src/interfaces/slack-context.interface.ts` — add notificationSelections (Record<string, boolean>) to Slack session
- [ ] Telegram `learn_more_settings` action + `settingsComingSoon` message — replace "coming soon" with actual settings flow
- [ ] Telegram persistent keyboard UI messages — add Settings button
- [ ] Slack welcome message blocks — add Settings button
- [ ] Slack App Home blocks — add Settings button
- [ ] Onboarding messages (Telegram + Slack) — add settings tip

---

## Out of Scope (future)

- Per-DAO notification type preferences
- Metrics dashboard (how many users, most tracked DAOs, etc.)
- Dynamic trigger registry via API (logic-system registering on startup)
