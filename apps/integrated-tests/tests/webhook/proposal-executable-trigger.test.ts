import { describe, test, expect, beforeAll, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { proposalsHandler } from '@anticapture/client/msw';
import { CryptoUtil } from '@notification-system/subscription-server/dist/utils/crypto';
import { db, TestApps } from '../../src/setup';
import { server, proposalsByDaoResolver } from '../../src/setup/msw-server';
import { UserFactory, ProposalFactory } from '../../src/fixtures';
import { DatabaseTestHelper, TestCleanup } from '../../src/helpers';
import { testConstants, timeouts, serviceConfig } from '../../src/config';

// The trigger's own delay/margin/DAO list under test come from `App`'s constructor
// defaults (no options passed by the test harness): daoIds: ['ENS'], 172800s delay,
// 3600s margin, 3-day lookback. See apps/logic-system/src/app.ts.
const WEBHOOK_URL = 'http://relayer.railway.internal:3002/relay/webhook';
const TIMELOCK = 172_800;
const MARGIN = 3_600;

describe('Proposal Executable Trigger - webhook delivery', () => {
  let apps: TestApps;
  let dbHelper: DatabaseTestHelper;
  const received: any[] = [];

  beforeAll(() => {
    apps = TestCleanup.getGlobalApps();
    dbHelper = new DatabaseTestHelper(db);
  });

  beforeEach(async () => {
    await TestCleanup.cleanupBetweenTests();
    received.length = 0;
    server.use(
      http.post(WEBHOOK_URL, async ({ request }) => {
        received.push(await request.json());
        return HttpResponse.json({ accepted: true }, { status: 202 });
      }),
    );
  });

  // `users.secret` is stored encrypted at rest (subscription-server's
  // KnexUserRepository.findByIdsWithWorkspaceTokens decrypts it with
  // TOKEN_ENCRYPTION_KEY to populate the subscriber's bot_token). Seeding a raw
  // plaintext string there makes CryptoUtil.decrypt throw (caught and logged as
  // `secret.decrypt_failed`), leaving bot_token undefined and the consumer's
  // WebhookService skipping delivery (`webhook.skipped_unsigned`). So the seeded
  // value must be encrypted the same way the real subscription flow does it.
  //
  // No `updated_at` backdating needed: the dispatcher's ProposalExecutable handler
  // does not time-filter subscribers (see proposal-executable-trigger.service.ts),
  // so a preference created "now" is picked up regardless of the proposal's
  // endTimestamp.
  const registerRelayerWebhook = async () => {
    const user = await UserFactory.createUser(WEBHOOK_URL, 'relayer', 'webhook');
    const encryptedSecret = CryptoUtil.encrypt('test-secret', serviceConfig.oauth.tokenEncryptionKey);
    await db(testConstants.tables.users).where({ id: user.id }).update({ secret: encryptedSecret });
    await UserFactory.createUserPreference(user.id, testConstants.daoIds.ens, true);
    return user;
  };

  test('delivers exactly one webhook for a proposal whose eta plus margin has passed', async () => {
    const now = Math.floor(Date.now() / 1000);
    const endTimestamp = now - TIMELOCK - MARGIN - 60;
    await registerRelayerWebhook();

    const proposal = ProposalFactory.createProposal(testConstants.daoIds.ens, 'executable-1', {
      status: 'PENDING_EXECUTION',
      endTimestamp,
      description: '# Executable\n\nReady.',
    });
    server.use(proposalsHandler(proposalsByDaoResolver([proposal])));

    await dbHelper.waitForRecordCount(
      testConstants.tables.notifications,
      1,
      undefined,
      { timeout: timeouts.notification.delivery },
    );

    expect(received).toHaveLength(1);
    expect(received[0].metadata).toMatchObject({
      triggerType: 'proposalExecutable',
      daoId: testConstants.daoIds.ens,
      proposalId: 'executable-1',
      status: 'PENDING_EXECUTION',
    });

    // A second poll cycle (poll interval is 500ms in the test harness; the
    // 3000ms wait below covers several) must not deliver again. The logic-system
    // trigger re-fetches the same proposal every cycle because the msw resolver
    // doesn't honor `fromEndDate` (it only filters by daoId/status), so exactly-once
    // delivery here is actually proving the dispatcher's DB-backed shouldSend/markAsSent
    // idempotency against the `notifications` table, not the trigger's in-memory cursor.
    await new Promise(r => setTimeout(r, timeouts.notification.delivery));
    expect(received).toHaveLength(1);
  });

  test('does not deliver while the proposal is still inside the margin', async () => {
    const now = Math.floor(Date.now() / 1000);
    const endTimestamp = now - TIMELOCK + 60;
    await registerRelayerWebhook();

    const proposal = ProposalFactory.createProposal(testConstants.daoIds.ens, 'too-soon-1', {
      status: 'PENDING_EXECUTION',
      endTimestamp,
    });
    server.use(proposalsHandler(proposalsByDaoResolver([proposal])));

    await new Promise(r => setTimeout(r, timeouts.notification.delivery));
    expect(received).toHaveLength(0);
  });
});
