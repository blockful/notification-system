import type { Knex } from 'knex';

export const SUBSCRIPTION_MESSAGES = {
  ERROR_QUERY_USER: 'Database query failed (users)',
  ERROR_CREATE_USER: 'Failed to create user',
  ERROR_QUERY_PREF: 'Database query failed (preferences)',
  ERROR_CREATE_PREF: 'Failed to create subscription',
  ERROR_UPDATE_PREF: 'Failed to update subscription',
  SUCCESS_NEW_SUB: 'New subscription created',
  SUCCESS_ALREADY: 'Subscription already in the requested state',
  SUCCESS_ACTIVATED: 'Subscription activated for user',
  SUCCESS_DEACTIVATED: 'Subscription deactivated for user',
};

export async function getUserByChannelAndId(knex: Knex, channel: string, channel_user_id: string, log?: { error: (msg: string) => void }) {
  try {
    return await knex('users')
      .where({ channel, channel_user_id })
      .first();
  } catch (err: any) {
    log?.error?.(`Error querying users table: ${err.message}`);
    throw new Error(SUBSCRIPTION_MESSAGES.ERROR_QUERY_USER);
  }
}

export async function createUser(knex: Knex, channel: string, channel_user_id: string, log?: { error: (msg: string) => void }) {
  try {
    const [userId] = await knex('users')
      .insert({ channel, channel_user_id, created_at: new Date() })
      .returning('id');
    return { id: userId, channel, channel_user_id };
  } catch (err: any) {
    log?.error?.(`Error creating user: ${err.message}`);
    throw new Error(SUBSCRIPTION_MESSAGES.ERROR_CREATE_USER);
  }
}

export async function getUserPreference(knex: Knex, user_id: string, dao_id: string, log?: { error: (msg: string) => void }) {
  try {
    return await knex('user_preferences')
      .where({ user_id, dao_id })
      .first();
  } catch (err: any) {
    log?.error?.(`Error querying preferences table: ${err.message}`);
    throw new Error(SUBSCRIPTION_MESSAGES.ERROR_QUERY_PREF);
  }
}

export async function createUserPreference(knex: Knex, user_id: string, dao_id: string, is_active: boolean, log?: { error: (msg: string) => void }) {
  try {
    const [preference] = await knex('user_preferences')
      .insert({
        user_id,
        dao_id,
        is_active,
        created_at: new Date(),
        updated_at: new Date()
      })
      .returning('*');
    return preference;
  } catch (err: any) {
    log?.error?.(`Error creating preference: ${err.message}`);
    throw new Error(SUBSCRIPTION_MESSAGES.ERROR_CREATE_PREF);
  }
}

export async function updateUserPreference(knex: Knex, preference_id: string, is_active: boolean, log?: { error: (msg: string) => void }) {
  try {
    const [preference] = await knex('user_preferences')
      .where({ id: preference_id })
      .update({
        is_active,
        updated_at: new Date()
      })
      .returning('*');
    return preference;
  } catch (err: any) {
    log?.error?.(`Error updating preference: ${err.message}`);
    throw new Error(SUBSCRIPTION_MESSAGES.ERROR_UPDATE_PREF);
  }
}

export async function handleSubscription({
  knex,
  dao,
  channel,
  channel_user_id,
  is_active,
  log
}: {
  knex: Knex,
  dao: string,
  channel: string,
  channel_user_id: string,
  is_active: boolean,
  log: { error: (msg: string) => void }
}) {
  let user = await getUserByChannelAndId(knex, channel, channel_user_id, log);
  let userWasCreated = false;

  if (!user) {
    user = await createUser(knex, channel, channel_user_id, log);
    userWasCreated = true;
  }

  let result;
  let message;

  if (userWasCreated) {
    result = await createUserPreference(knex, user.id, dao, is_active, log);
    message = SUBSCRIPTION_MESSAGES.SUCCESS_NEW_SUB;
  } else {
    let existingPreference = await getUserPreference(knex, user.id, dao, log);
    if (existingPreference) {
      if (existingPreference.is_active !== is_active) {
        result = await updateUserPreference(knex, existingPreference.id, is_active, log);
        message = is_active ? SUBSCRIPTION_MESSAGES.SUCCESS_ACTIVATED : SUBSCRIPTION_MESSAGES.SUCCESS_DEACTIVATED;
      } else {
        result = existingPreference;
        message = SUBSCRIPTION_MESSAGES.SUCCESS_ALREADY;
      }
    } else {
      result = await createUserPreference(knex, user.id, dao, is_active, log);
      message = SUBSCRIPTION_MESSAGES.SUCCESS_NEW_SUB;
    }
  }

  return {
    user,
    result,
    message
  };
} 