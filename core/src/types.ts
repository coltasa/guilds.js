import type { Intents } from "@/constants"

export type IntentsResolvable = keyof typeof Intents | (keyof typeof Intents)[] | number
