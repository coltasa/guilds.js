import type { GatewayEventMap, GatewayProps } from "@/types"
import { EventHandler } from "@/classes/event-handler"
import { RESTManager } from "@/classes/rest-manager"
import { parseToken } from "@/functions/parse-token"

export class Gateway {
    #token: string

    public events = new EventHandler<GatewayEventMap>()
    public intents: number
    public rest: RESTManager
    public ws?: WebSocket

    public get token() {
        return this.#token
    }

    public constructor(props: GatewayProps) {
        if (!props || typeof props !== "object") {
            throw new TypeError("Invalid props provided")
        }

        if (!props.intents || typeof props.intents !== "number") {
            throw new TypeError("Invalid intents provided")
        }

        if (!props.rest || !(props.rest instanceof RESTManager)) {
            throw new TypeError("Invalid rest provided")
        }

        if (!props.token || typeof props.token !== "string") {
            throw new TypeError("Invalid token provided")
        }

        this.#token = parseToken(props.token)
        this.intents = props.intents
        this.rest = props.rest

        return this
    }

    public async connect() {
        const res = await this.rest.get<{ url: string }>("/gateway/bot")

        this.ws = new WebSocket(`${res.data.url}/?v=10&encoding=json`)
        this.ws.onopen = () => {
            this.#identify()
        }

        this.ws.onmessage = (message) => {
            const payload = JSON.parse(message.data.toString())

            if (payload.t) {
                this.events.emit(payload.t, payload.d)
            }
        }

        return this
    }

    #identify() {
        this.ws?.send(
            JSON.stringify({
                op: 2,
                d: {
                    token: this.#token,
                    intents: this.intents,
                    properties: {
                        $browser: "guilds.js",
                        $device: "guilds.js",
                        $os: "guilds.js",
                    },
                },
            })
        )
    }
}
