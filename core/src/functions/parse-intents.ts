import type { IntentsResolvable } from "@/types"
import { Intents } from "@/constants"

export function parseIntents(intents: IntentsResolvable): number {
    if (typeof intents === "number") {
        return intents
    }

    if (typeof intents === "string") {
        if (!(intents in Intents)) {
            throw new Error(`Invalid intents provided`)
        }

        return Intents[intents as keyof typeof Intents]
    }

    return intents.reduce((acc, intent) => {
        if (!(intent in Intents)) {
            throw new Error(`Invalid intents provided`)
        }

        return acc | Intents[intent as keyof typeof Intents]
    }, 0)
}
