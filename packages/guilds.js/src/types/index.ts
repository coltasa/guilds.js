import type { Gateway } from "@/classes/gateway"
import type { RESTManager } from "@/classes/rest-manager"
import type { APIGuildMember, APIMessage, APISnowflake, APIUser } from "@/api"

export interface ClientProps {
    gateway: Gateway
    rest: RESTManager
}

/** Shorthand type for `(typeof T)[keyof typeof T]` */
export type ConstValues<T> = T[keyof T]

export type GatewayEventMap = {
    [K in keyof GatewayEvents]: [
        event: {
            data: GatewayEvents[K]
            gateway: Gateway
            rest: RESTManager
        },
    ]
}

/** @see https://docs.discord.com/developers/events/gateway-events */
export interface GatewayEvents {
    MESSAGE_CREATE: APIMessage & {
        guild_id?: APISnowflake
        member?: Partial<APIGuildMember>
        mentions: (APIUser & { member?: Partial<APIGuildMember> | null })[]
    }

    MESSAGE_DELETE: {
        channel_id: APISnowflake
        guild_id?: APISnowflake
        id: APISnowflake
    }

    MESSAGE_UPDATE: APIMessage & { tts: false }

    READY: {
        user: APIUser
        session_id: string
    }

    WS_DEBUG: string
    WS_ERROR: string
}

export interface GatewayProps {
    intents: number
    rest: RESTManager
    token: string
}

export type HTTPMethod = "DELETE" | "GET" | "PATCH" | "POST" | "PUT"

export interface RESTManagerProps {
    token: string
}
