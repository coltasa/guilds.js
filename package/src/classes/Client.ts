import { CacheManager } from "@/classes/cache-manager";
import { Channel } from "@/classes/channel";
import { ClientUser } from "@/classes/client-user";
import { Endpoints } from "@/utils/endpoints";
import { EventHandler } from "@/classes/event-handler";
import { Guild } from "@/classes/guild";
import { GuildsError } from "@/classes/guilds-error";
import { handleGatewayEvents } from "@/functions/gateway-events";
import { Message } from "@/classes/message";
import { parseIntents } from "@/functions/parse-intents";
import { RESTManager } from "@/classes/rest-manager";
import { Role } from "@/classes/role";
import { TextChannel } from "@/classes/text-channel";
import { User } from "@/classes/user";
import { VoiceChannel } from "@/classes/voice-channel";
import {
    ActivityTypes,
    ChannelTypes,
    defaultClientPresence,
    GatewayOpcodes,
} from "@/utils/constants";
import type {
    AnyChannel,
    TypeMappedClientEvents,
    ClientPresence,
    ClientPresenceProps,
    ClientProps,
    ClientStructureFetchOptions,
    CreateMessageProps,
    GatewayPayload,
} from "@/types";

/** Class representing a Discord client */
export class Client extends EventHandler<TypeMappedClientEvents> {
    #token: string;

    /**
     * Whether the client has been destroyed,
     * used to prevent false reconnect attempts
     */
    public destroyed: boolean = false;

    /**
     * Heartbeat interval provided by Discord's gateway,
     * cleared and recreated upon reconnecting
     */
    public heartbeatInterval?: NodeJS.Timeout;

    /** Parsed client intents bitfield */
    public intents: number;

    /** Whether the last heartbeat was acknowledged by Discord */
    public lastHeartbeatAck: boolean = true;

    /** The client's current presence configuration */
    public presence: ClientPresence = defaultClientPresence;

    /** Whether the Dispatch (ready) event was received */
    public ready: boolean = false;

    /** REST manager used for API requests */
    public rest: RESTManager;

    /**
     * Last sequence number provided by Discord's gateway,
     * used for heartbeats and session resuming
     */
    public sequenceNumber: number | null = null;

    /** Active session ID for resuming connection */
    public sessionId?: string;

    /** Represents the client's Discord user */
    public user: ClientUser | null = null!;

    /** The WebSocket connected to Discord's gateway */
    public ws?: WebSocket;

    /** Internal cache for API structures */
    public cache = {
        channels: new CacheManager<AnyChannel>(),
        guilds: new CacheManager<Guild>(),
        messages: new CacheManager<Message>(),
        roles: new CacheManager<Role>(),
        users: new CacheManager<User>(),
    };

    /**
     * Instantiate a new client
     * @param props Options such as token and intents
     */
    public constructor(props: ClientProps) {
        super();

        if (!props || typeof props !== "object") {
            throw new GuildsError("Invalid client props provided", "ClientPropsError");
        }

        if (!props.token || typeof props.token !== "string") {
            throw new GuildsError("Invalid token provided", "ClientTokenError");
        }

        if (
            props.intents === null ||
            props.intents === undefined ||
            (Array.isArray(props.intents) == false && typeof props.intents !== "number")
        ) {
            throw new GuildsError("Invalid intents provided", "ClientIntentsError");
        }

        if (props.presence) {
            if (typeof props.presence !== "object") {
                throw new GuildsError(
                    "Invalid client presence was provided",
                    "ClientPropsError"
                );
            }

            this.setPresence(props.presence);
        }

        this.#token = props.token.trim().toLowerCase().startsWith("bot ")
            ? props.token
            : `Bot ${props.token}`;

        this.intents = parseIntents(props.intents);
        this.rest = new RESTManager(this.#token);

        return this;
    }

    /**
     * Formatted bot token accessor, starting with "Bot "
     * and used for authentication
     */
    public get token() {
        return this.#token;
    }

    /**
     * Fetches Discord's gateway information then connects to it,
     * and fetches the bot's user before identifying
     */
    public async connect(): Promise<Client> {
        const res = await this.rest.get(Endpoints.gatewayBot());
        const user = await this.fetchUser("@me");

        if (!res.ok || !user) {
            throw new GuildsError("Failed to connect to Discord", "DiscordAPIError");
        }

        this.destroyed = false;
        this.lastHeartbeatAck = true;
        this.user = new ClientUser(this, user.rawData)!;
        this.#connectWebSocket(res.data.url);

        return this;
    }

    /**
     * Manages the WebSocket as well as connecting and reconnecting
     * @param url URL to connect the WebSocket to
     */
    #connectWebSocket(url: string): void {
        if (this.destroyed) {
            return;
        }

        this.ws = new WebSocket(`${url}?v=10&encoding=json`);
        this.ws.onopen = () => {
            this.emit("debug", "WebSocket connected");
        };

        this.ws.onerror = (error) => {
            this.emit("error", `WebSocket error: ${error}`);
        };

        this.ws.onmessage = (event) => {
            this.#handleGatewayEvent(JSON.parse(event.data.toString()));
        };

        this.ws.onclose = (event) => {
            this.emit("debug", `WebSocket closed: ${event.reason} (${event.code})`);

            if (!this.destroyed) {
                setTimeout(() => this.#connectWebSocket(url), 3000);
            }
        };
    }

    /**
     * Processes incoming gateway payloads
     * @param payload Payload data from Discord's gateway
     */
    #handleGatewayEvent(payload: GatewayPayload) {
        if (payload.s !== undefined && payload.s !== null) {
            this.sequenceNumber = payload.s;
        }

        switch (payload.op) {
            case GatewayOpcodes.Hello: {
                this.emit("debug", "Received Hello event");

                if (this.heartbeatInterval) {
                    clearInterval(this.heartbeatInterval);
                }

                this.lastHeartbeatAck = true;
                this.heartbeatInterval = setInterval(() => {
                    if (!this.lastHeartbeatAck) {
                        this.emit("debug", "Heartbeat ACK failed");
                        this.ws?.close(4000, "Heartbeat ACK failed");

                        return;
                    }

                    this.lastHeartbeatAck = false;
                    this.ws?.send(
                        JSON.stringify({
                            op: GatewayOpcodes.Heartbeat,
                            d: this.sequenceNumber,
                        })
                    );
                }, payload.d.heartbeat_interval);

                if (this.sessionId) {
                    this.emit("debug", "Resuming session");

                    this.ws?.send(
                        JSON.stringify({
                            op: GatewayOpcodes.Resume,
                            d: {
                                token: this.#token,
                                session_id: this.sessionId,
                                seq: this.sequenceNumber,
                            },
                        })
                    );
                } else {
                    this.emit("debug", "Identifying");

                    this.ws?.send(
                        JSON.stringify({
                            op: GatewayOpcodes.Identify,
                            d: {
                                token: this.#token,
                                intents: this.intents,
                                presence: this.presence,
                                properties:
                                    this.presence.platform === "desktop"
                                        ? {
                                              $os: "linux",
                                              $browser: "guilds.js",
                                              $device: "guilds.js",
                                          }
                                        : {
                                              $os: "Discord Android",
                                              $browser: "Discord Android",
                                              $device: "Discord Android",
                                          },
                            },
                        })
                    );
                }

                break;
            }

            case GatewayOpcodes.HeartbeatACK: {
                this.lastHeartbeatAck = true;
                break;
            }

            case GatewayOpcodes.Dispatch: {
                handleGatewayEvents(this, payload);
                break;
            }
        }
    }

    /**
     * Sends a message to a specified channel
     * @param channelId ID of the channel to send the message to
     * @param props Message data, such as content
     */
    public async createMessage(
        channelId: string,
        props: CreateMessageProps
    ): Promise<void> {
        if (!channelId || typeof channelId !== "string") {
            throw new GuildsError("Invalid channel ID", "CreateMessageError");
        }

        if (!props || (props && !props.content)) {
            throw new GuildsError("Invalid message data", "CreateMessageError");
        }

        const body: Record<string, unknown> = { content: props.content };

        if (props.referenceMessageId) {
            body.message_reference = {
                message_id: props.referenceMessageId,
            };
        }

        await this.rest.post(Endpoints.channelMessages(channelId), {
            body: JSON.stringify(body),
        });
    }

    /**
     * Fetch a channel by its ID
     * @param channelId ID of the channel to fetch
     * @param options Fetch options
     * @returns Channel object or null
     */
    public async fetchChannel<T extends AnyChannel = Channel>(
        channelId: string,
        options: ClientStructureFetchOptions = { force: false }
    ): Promise<T | null> {
        if (!options?.force) {
            const cached = this.cache.channels.get(channelId);

            if (cached) {
                return cached as T;
            }
        }

        const res = await this.rest.get(Endpoints.channel(channelId));

        if (!res.ok) {
            return null;
        }

        const data = res.data as any;
        let channel: AnyChannel;
        let guild: Guild | null = null;

        if (data.guild_id) {
            guild =
                this.cache.guilds.get(data.guild_id) ??
                (await this.fetchGuild(data.guild_id, options));
        }

        if (guild && data.type !== undefined && data.type !== null) {
            switch (data.type) {
                case ChannelTypes.GuildText: {
                    channel = new TextChannel(this, guild, res.data);
                    break;
                }

                case ChannelTypes.GuildVoice: {
                    channel = new VoiceChannel(this, guild, res.data);
                    break;
                }

                default: {
                    channel = new Channel(this, res.data);
                    break;
                }
            }
        } else {
            channel = new Channel(this, res.data);
        }

        this.cache.channels.set(channelId, channel);
        return channel as T;
    }

    /**
     * Fetches a guild by its ID
     * @param guildId ID of the guild to fetch
     * @param options Fetch options
     * @returns Guild object or null
     */
    public async fetchGuild(
        guildId: string,
        options: ClientStructureFetchOptions = { force: false }
    ): Promise<Guild | null> {
        if (!options?.force) {
            const cached = this.cache.guilds.get(guildId);

            if (cached) {
                return cached;
            }
        }

        const res = await this.rest.get(Endpoints.guild(guildId));

        if (!res.ok) {
            return null;
        }

        const guild = new Guild(this, res.data);
        this.cache.guilds.set(guildId, guild);
        return guild;
    }

    /**
     * Fetches a role by its ID and guild ID
     * @param guildId ID of the guild where the role belongs
     * @param roleId ID of the role to fetch
     * @param options Fetch options
     * @returns Role object or null
     */
    public async fetchRole(
        guildId: string,
        roleId: string,
        options: ClientStructureFetchOptions = { force: false }
    ): Promise<Role | null> {
        if (!options?.force) {
            const cached = this.cache.roles.get(roleId);

            if (cached) {
                return cached;
            }
        }

        const res = await this.rest.get(Endpoints.guildRole(guildId, roleId));

        if (!res.ok) {
            return null;
        }

        const role = new Role(this, res.data);
        this.cache.roles.set(roleId, role);
        return role;
    }

    /**
     * Fetches a user by their ID
     * @param userId ID of the user to fetch (default: "@me")
     * @param options Fetch options
     * @returns User object or null
     */
    public async fetchUser(
        userId: string = "@me",
        options: ClientStructureFetchOptions = { force: false }
    ): Promise<User | null> {
        if (!options?.force) {
            const cached = this.cache.users.get(userId);

            if (cached) {
                return cached;
            }
        }

        const res = await this.rest.get(Endpoints.user(userId));

        if (!res.ok) {
            return null;
        }

        const user = new User(this, res.data);
        this.cache.users.set(userId, user);
        return user;
    }

    /**
     * Updates the client's presence and over the Gateway if connected
     * @param presence New presence information
     * @returns Client instance
     */
    public setPresence(presence: ClientPresenceProps) {
        this.presence = { ...this.presence, ...presence } as ClientPresence;

        if (this.ws) {
            this.ws.send(
                JSON.stringify({
                    op: GatewayOpcodes.PresenceUpdate,
                    d: {
                        status: this.presence.status,
                        since: null,
                        afk: false,
                        activities: (this.presence.activities ?? []).map((activity) => ({
                            ...activity,
                            type:
                                typeof activity.type === "string"
                                    ? ActivityTypes[
                                          activity.type as keyof typeof ActivityTypes
                                      ]
                                    : activity.type,
                        })),
                    },
                })
            );
        }

        return this;
    }

    /** Disconnects from Discord's gateway and closes the WebSocket connection */
    public disconnect(): void {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }

        this.ws?.close(1000, "Client disconnected");
        this.ws = undefined;
    }
}
