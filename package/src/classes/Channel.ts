import type { APIChannel } from "discord-api-types/v10";
import { Client } from "@/classes/client";

/**
 * Class representing a base Discord channel
 * @see https://docs.discord.com/developers/resources/channel#channel-object
 */
export class Channel {
    /** The client associated with this channel */
    public client: Client;

    /** Unique Discord channel ID */
    public id: string;

    /** Channel name */
    public name: string;

    /** Raw API channel data as-is */
    public rawData: APIChannel;

    /**
     * Instantiate a new channel
     * @param client Associated client
     * @param data Discord API channel data
     * @returns Channel object
     */
    public constructor(client: Client, data: APIChannel) {
        if (!client || !(client instanceof Client)) {
            throw new TypeError("Invalid client provided");
        }

        this.client = client;
        this.id = data.id;
        this.name = data.name!;
        this.rawData = data;

        return this;
    }
}
