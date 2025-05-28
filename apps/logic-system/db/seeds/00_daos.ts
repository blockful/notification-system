import { Knex } from "knex";

export async function seed(knex: Knex): Promise<void> {
    // Deletes ALL existing entries
    await knex("dao").del();

    // Inserts seed entries
    await knex("dao").insert([
        {
            id: 'ENS'
        }
    ]);
}; 