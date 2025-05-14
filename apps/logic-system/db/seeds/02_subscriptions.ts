import { Knex } from "knex";

export async function seed(knex: Knex): Promise<void> {
    // Deletes ALL existing entries
    await knex("subscriptions").del();

    // Inserts seed entries
    await knex("subscriptions").insert([
        {
            user_id: '0xuser567890abcdef1234567890abcdef12345678',
            dao_id: '0xdao1234567890abcdef1234567890abcdef123',
            notification_type: 'proposal_created',
            notification_channels: JSON.stringify(['email', 'telegram']),
            is_active: true,
            created_at: new Date(),
            updated_at: new Date()
        },
        {
            user_id: '0xuser567890abcdef1234567890abcdef12345678',
            dao_id: '0xdao1234567890abcdef1234567890abcdef123',
            notification_type: 'proposal_executed',
            notification_channels: JSON.stringify(['telegram']),
            is_active: true,
            created_at: new Date(),
            updated_at: new Date()
        },
        {
            user_id: '0xuser999890abcdef1234567890abcdef12345678',
            dao_id: '0xdao1234567890abcdef1234567890abcdef123',
            notification_type: 'proposal_created',
            notification_channels: JSON.stringify(['slack', 'email']),
            is_active: true,
            created_at: new Date(),
            updated_at: new Date()
        }
    ]);
};
