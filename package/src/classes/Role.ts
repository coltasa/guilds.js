import type { APIRole } from "discord-api-types/v10";
import { Client } from "@/classes/client";

/**
 * Class representing a Discord guild role
 * @see https://docs.discord.com/developers/topics/permissions#role-object
 */
export class Role {
    /** The client associated with this role */
    public client: Client;

    /** Unique Discord role ID */
    public id: string;

    /** Role name */
    public name: string;

    /** Raw API role data as-is */
    public rawData: APIRole;

    /**
     * Instantiate a new role
     * @param client Associated client
     * @param data Discord API role data
     * @returns Role object
     */
    public constructor(client: Client, data: APIRole) {
        if (!client || !(client instanceof Client)) {
            throw new TypeError("Invalid client provided");
        }

        this.client = client;
        this.id = data.id;
        this.name = data.name;
        this.rawData = data;

        return this;
    }
}
