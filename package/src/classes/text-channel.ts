import type { APIChannel, APITextBasedChannel } from "discord-api-types/v10";
import type { ChannelType } from "@/types";
import { Channel } from "@/classes/channel";
import { ChannelTypes } from "@/utils/constants";
import { Client } from "@/classes/client";
import { Guild } from "@/classes/guild";

/**
 * Class representing a text channel in a guild
 * @see https://docs.discord.com/developers/resources/channel#channel-object
 */
export class TextChannel extends Channel {
    /** The guild where the channel belongs */
    public guild: Guild | null;

    /** The type of the channel */
    public type: ChannelType = ChannelTypes.GuildText;

    /**
     * Instantiate a new text channel
     * @param client Associated client
     * @param guild Associated guild
     * @param data Discord API channel data
     * @returns TextChannel object
     */
    public constructor(
        client: Client,
        guild: Guild,
        data: APITextBasedChannel<typeof ChannelTypes.GuildText>
    ) {
        if (!guild || !(guild instanceof Guild)) {
            throw new TypeError("Invalid guild provided");
        }

        super(client, data as APIChannel);
        this.guild = guild;

        return this;
    }
}
