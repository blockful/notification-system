import { Knex } from "knex";

export async function seed(knex: Knex): Promise<void> {
    // Deletes ALL existing entries
    await knex("daos").del();

    // Inserts seed entries
    await knex("daos").insert([
        {
            id: 'ENS'
        }
    ]);
}; 