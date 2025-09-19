# Slack OAuth Multi-Workspace Implementation Plan

## 📋 Executive Summary

Implementation of OAuth 2.0 flow for Slack app installation, enabling multiple workspaces to independently install and use our notification bot. This maintains backward compatibility with the existing single-workspace setup while adding multi-tenant capabilities.

**Issue**: #155 - OAuth and Multi-Workspace support
**Branch**: `feat/Slack_Interactive_Commands_&_Subscription_Management`
**Estimated Implementation Time**: 1 day
**Total New Code**: ~250 lines

## 🎯 Objectives

1. Enable multiple Slack workspaces to install the bot independently via OAuth
2. Store and manage tokens securely for each workspace
3. Route notifications to the correct workspace automatically
4. Maintain 100% backward compatibility with Subtasks 1 & 2
5. Keep implementation simple and elegant

## 📐 Key Design Decisions

### 1. OAuth Location
- **Decision**: Implement OAuth in Subscription Server
- **Rationale**: Already an HTTP server, manages user data, keeps Consumer as pure worker
- **Alternative Considered**: OAuth in Consumer (rejected - adds unnecessary complexity)

### 2. Token Storage
- **Decision**: New `slack_workspaces` table in Subscription Server DB
- **Rationale**: Centralized credential management, already has PostgreSQL
- **Security**: AES-256-CBC encryption for tokens at rest

### 3. Workspace Identification
- **Decision**: Format `workspace:user` in slack_id field (e.g., `T0234ABCD:U0KRQLJ9H`)
- **Rationale**: No changes to RabbitMQ message structure, backward compatible
- **Alternative Considered**: Separate field (rejected - breaks compatibility)

### 4. Implementation Approach
- **Decision**: Slack-specific implementation (not generic platform auth)
- **Rationale**: YAGNI principle, simpler code, faster implementation
- **Future**: Can refactor to generic if needed for Discord/Teams

### 5. Token Distribution
- **Decision**: Dispatcher includes bot token in RabbitMQ message
- **Rationale**: Dispatcher already queries Subscription Server for subscribers, can fetch token at same time
- **Benefit**: Consumer doesn't need DB access or API calls, simpler architecture

## 🛠️ Technical Implementation

### Phase 1: Database Setup

#### 1.1 Migration File
```sql
-- apps/subscription-server/db/migrations/20250918000000_create_slack_workspaces.ts

CREATE TABLE slack_workspaces (
  workspace_id VARCHAR(255) PRIMARY KEY,  -- Slack team ID (T0234ABCD)
  workspace_name VARCHAR(255),             -- Human-readable name
  bot_token TEXT NOT NULL,                -- Encrypted xoxb-... token
  bot_user_id VARCHAR(255),               -- Bot's user ID in workspace
  is_active BOOLEAN DEFAULT true,         -- Disable without deleting
  installed_at TIMESTAMP DEFAULT NOW()
);

-- Migrate existing users to workspace:user format
UPDATE users
SET slack_id = CONCAT('T_DEFAULT:', slack_id)
WHERE slack_id IS NOT NULL
AND slack_id NOT LIKE '%:%';
```

### Phase 2: Subscription Server OAuth

#### 2.1 Environment Variables
```bash
# Required for OAuth
SLACK_CLIENT_ID=your-client-id-from-slack
SLACK_CLIENT_SECRET=your-client-secret-from-slack
SLACK_REDIRECT_URI=https://your-app.railway.app/slack/oauth/callback

# Token encryption (generate with: openssl rand -hex 32)
TOKEN_ENCRYPTION_KEY=64-character-hex-string
```

#### 2.2 File Structure
```
apps/subscription-server/src/
├── routes/
│   └── slack-oauth.routes.ts        # OAuth endpoints (~80 lines)
├── services/
│   └── slack-workspace.service.ts   # Workspace management (~50 lines)
└── crypto.ts                        # Encryption utilities (~30 lines)
```

#### 2.3 OAuth Endpoints

**Install Endpoint** - `/slack/install`
- Redirects to Slack's OAuth consent page
- No authentication required (public endpoint)

**Callback Endpoint** - `/slack/oauth/callback`
- Receives authorization code from Slack
- Exchanges code for access token
- Stores encrypted token in database
- Shows success page to user

#### 2.4 Workspace Service Enhancement
```typescript
// apps/subscription-server/src/services/slack-workspace.service.ts
export class SlackWorkspaceService {
  // Existing method for OAuth
  async saveWorkspace(workspaceData: WorkspaceData): Promise<void>

  // New method for Dispatcher to get token
  async getWorkspaceToken(workspaceId: string): Promise<string | null> {
    const workspace = await db('slack_workspaces')
      .where({ workspace_id: workspaceId, is_active: true })
      .first();

    if (!workspace) return null;
    return decrypt(workspace.bot_token);
  }
}
```

### Phase 3: Dispatcher Token Integration

#### 3.1 Dispatcher Service Updates
```typescript
// apps/dispatcher/src/services/slack-notification-client.ts
export class SlackNotificationClient {
  async sendNotification(subscriber: Subscriber, message: string) {
    const [workspaceId, userId] = subscriber.slack_id.split(':');

    // Fetch token from Subscription Server
    const token = await this.workspaceService.getWorkspaceToken(workspaceId);

    if (!token) {
      // Fallback to env token for development
      token = process.env.SLACK_BOT_TOKEN;
    }

    // Include token in message to Consumer
    await this.publishToQueue({
      platform: 'slack',
      slack_id: subscriber.slack_id,
      bot_token: token,  // Token included in message
      message: message
    });
  }
}
```

### Phase 4: Consumer Updates

#### 4.1 SlackBotService Simplification
```typescript
// apps/consumers/src/services/slack-bot.service.ts
export class SlackBotService {
  async sendNotification(notification: Notification) {
    const [workspaceId, userId] = notification.slack_id.split(':');

    // Token now comes in the message - no lookup needed!
    const token = notification.bot_token || process.env.SLACK_BOT_TOKEN;

    const client = new WebClient(token);

    try {
      await client.chat.postMessage({
        channel: userId,
        text: notification.message
      });
    } catch (error) {
      if (error.code === 'invalid_auth' || error.code === 'account_inactive') {
        // Notify Subscription Server to mark workspace inactive
        await this.markWorkspaceInactive(workspaceId);
      }
      throw error;
    }
  }
}
```

#### 4.2 Message Interface Update
```typescript
// Update notification interface to include optional token
interface SlackNotification {
  platform: 'slack';
  slack_id: string;        // Format: workspace:user
  bot_token?: string;      // Token from Dispatcher
  message: string;
}

### Phase 4: Message Format

#### 4.1 Dispatcher Changes
- **No structural changes needed!**
- Continue sending `slack_id` in notifications
- Now uses format: `"T0234ABCD:U0KRQLJ9H"`

#### 4.2 Consumer Parsing
```typescript
// Extract workspace and user from slack_id
const [workspaceId, userId] = slackId.split(':');

// For backward compatibility during transition
if (!userId) {
  workspaceId = 'T_DEFAULT';
  userId = slackId;
}
```

## 📝 Implementation Checklist

### Setup (30 minutes)
- [ ] Create feature branch from current branch
- [ ] Add new env vars to `.env.example`
- [ ] Generate `TOKEN_ENCRYPTION_KEY` for development
- [ ] Update local `.env` file

### Subscription Server (2-3 hours)
- [ ] Create and run migration for `slack_workspaces` table
- [ ] Implement `crypto.ts` utility for token encryption
- [ ] Create `slack-oauth.routes.ts` with OAuth endpoints
- [ ] Implement `slack-workspace.service.ts` for DB operations
- [ ] Register routes in main server file
- [ ] Test OAuth flow with Slack app

### Dispatcher Updates (1-2 hours)
- [ ] Update `slack-notification-client.ts` to fetch tokens
- [ ] Modify message structure to include bot_token
- [ ] Add fallback to env token for development
- [ ] Test token retrieval and inclusion in messages

### Consumer Updates (1-2 hours)
- [ ] Update `slack-bot.service.ts` to use token from message
- [ ] Update message interface to include optional bot_token
- [ ] Add workspace invalidation on auth errors
- [ ] Remove need for token service (simpler!)
- [ ] Test with multiple workspaces

### Testing (2 hours)
- [ ] Unit tests for encryption/decryption
- [ ] Unit tests for workspace:user parsing
- [ ] Unit tests for token caching
- [ ] Integration test for OAuth flow
- [ ] Integration test for multi-workspace routing
- [ ] Manual E2E test with real Slack workspace

### Documentation & Deployment (1 hour)
- [ ] Update README with installation instructions
- [ ] Document new environment variables
- [ ] Configure Slack app in production
- [ ] Deploy to staging/production
- [ ] Verify OAuth flow in production

## 🚀 Slack App Configuration

### Required OAuth Scopes
```yaml
Bot Token Scopes:
  - chat:write          # Send messages
  - chat:write.public   # Send to public channels
  - commands           # Handle slash commands
  - app_mentions:read  # Respond to @mentions
  - im:read           # Read DM info
  - im:write          # Send DMs
```

### OAuth URLs
- **Redirect URL**: `https://your-domain.com/slack/oauth/callback`
- **Install URL**: `https://your-domain.com/slack/install`

### Distribution
- Enable public distribution after testing
- Add to Slack App Directory (optional)

## 🔒 Security Considerations

### Token Encryption
- **Algorithm**: AES-256-CBC
- **Key Storage**: Environment variable (never commit!)
- **Key Rotation**: Plan for future implementation

### Token in Transit
- **RabbitMQ**: Tokens pass through message queue (internal network)
- **Consideration**: RabbitMQ should be on internal network only
- **Alternative**: Could encrypt token in message if extra security needed

### Workspace Validation
- Validate OAuth state parameter (future enhancement)
- Check workspace active status before sending messages
- Audit log for OAuth installations

## 📊 Success Metrics

1. **Multiple workspaces can install the bot** ✓
2. **Each workspace receives only its notifications** ✓
3. **Existing single-workspace setup continues working** ✓
4. **Tokens are encrypted in database** ✓
5. **Consumer remains a pure worker (no HTTP server)** ✓

## ⚠️ Migration Notes

### Existing Users
- All existing `slack_id` values will be prefixed with `T_DEFAULT:`
- This happens automatically in the migration
- No action required from users

### Development Environment
- Can continue using `SLACK_BOT_TOKEN` env var as fallback
- Useful for local development without OAuth setup

### Rollback Plan
- Migration includes `down()` method to revert changes
- Removes workspace prefix from slack_id
- Drops slack_workspaces table

## 📚 References

- [Slack OAuth Documentation](https://api.slack.com/authentication/oauth-v2)
- [Slack App Installation](https://api.slack.com/start/distributing)
- [Node.js Crypto Documentation](https://nodejs.org/api/crypto.html)
- [Original Issue #155](https://github.com/blockful/notification-system/issues/155)
---

*This document represents the complete implementation plan for Slack OAuth multi-workspace support. It should be updated as implementation progresses and decisions change.*