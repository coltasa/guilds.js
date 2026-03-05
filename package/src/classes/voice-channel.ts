import type { APIChannel, APIGuildVoiceChannel } from "discord-api-types/v10";
import type { ChannelType } from "@/types";
import { Channel } from "@/classes/channel";
import { ChannelTypes } from "@/utils/constants";
import { Client } from "@/classes/client";
import { Guild } from "@/classes/guild";

/**
 * Class representing a voice channel in a guild
 * @see https://docs.discord.com/developers/resources/channel#channel-object
 */
export class VoiceChannel extends Channel {
    /** The guild where the channel belongs */
    public guild: Guild | null;

    /** The type of the channel */
    public type: ChannelType = ChannelTypes.GuildVoice;

    /**
     * Instantiate a new voice channel
     * @param client Associated client
     * @param guild Associated guild
     * @param data Discord API channel data
     * @returns VoiceChannel object
     */
    public constructor(client: Client, guild: Guild, data: APIGuildVoiceChannel) {
        if (!guild || !(guild instanceof Guild)) {
            throw new TypeError("Invalid guild provided");
        }

        super(client, data as APIChannel);
        this.guild = guild;

        return this;
    }
}
