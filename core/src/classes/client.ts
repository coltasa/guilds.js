import type { ClientProps } from "@/types"
import { parseIntents } from "@/functions/parse-intents"
import { parseToken } from "@/functions/parse-token"

export class Client {
    #token: string

    public intents: number

    public constructor(props: ClientProps) {
        if (!props || typeof props !== "object") {
            throw new TypeError("Invalid client props provided")
        }

        if (!props.token || typeof props.token !== "string") {
            throw new TypeError("Invalid token provided")
        }

        if (
            !props.intents ||
            (typeof props.intents !== "number" &&
                typeof props.intents !== "string" &&
                !Array.isArray(props.intents))
        ) {
            throw new TypeError("Invalid intents provided")
        }

        this.#token = parseToken(props.token)
        this.intents = parseIntents(props.intents)
    }

    public get token() {
        return this.#token
    }
}
