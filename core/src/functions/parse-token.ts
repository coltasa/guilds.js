export function parseToken(token: string): string {
    if (!token || typeof token !== "string") {
        throw new TypeError("Invalid token provided")
    }

    if (token.startsWith("Bot ")) {
        return token
    } else {
        return `Bot ${token}`
    }
}
