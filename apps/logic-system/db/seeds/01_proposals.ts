import { Knex } from "knex";

export async function seed(knex: Knex): Promise<void> {
    // Deletes ALL existing entries
    await knex("proposals").del();

    // Inserts seed entries
    await knex("proposals").insert([
        {
            id: '0x1234567890abcdef1234567890abcdef12345678',
            dao_id: '0xdao1234567890abcdef1234567890abcdef123',
            proposer_account_id: '0xuser567890abcdef1234567890abcdef12345678',
            targets: JSON.stringify(['0xtarget1', '0xtarget2']),
            values: JSON.stringify(['0', '100000000000000000']),
            signatures: JSON.stringify(['transfer(address,uint256)', 'vote(uint256)']),
            calldatas: JSON.stringify(['0xabcdef1234567890', '0x567890abcdef1234']),
            start_block: 12345678,
            end_block: 12345978,
            description: 'Proposal to transfer funds to the treasury',
            timestamp: new Date().toISOString(),
            status: 'active',
            for_votes: '1000000000000000000',
            against_votes: '500000000000000000',
            abstain_votes: '200000000000000000',
            created_at: new Date(),
            updated_at: new Date()
        },
        {
            id: '0x2345678901abcdef2345678901abcdef23456789',
            dao_id: '0xdao1234567890abcdef1234567890abcdef123',
            proposer_account_id: '0xuser567890abcdef1234567890abcdef12345678',
            targets: JSON.stringify(['0xtarget3']),
            values: JSON.stringify(['0']),
            signatures: JSON.stringify(['changeQuorum(uint256)']),
            calldatas: JSON.stringify(['0x123456789abcdef0']),
            start_block: 12345600,
            end_block: 12345900,
            description: 'Proposal to change the governance quorum',
            timestamp: new Date().toISOString(),
            status: 'pending',
            for_votes: '0',
            against_votes: '0',
            abstain_votes: '0',
            created_at: new Date(),
            updated_at: new Date()
        }
    ]);
};
