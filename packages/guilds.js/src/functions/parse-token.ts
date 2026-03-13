/** Ensures token has Bot prefix */
export function parseToken(token: string): string {
    if (typeof token !== "string" || token === undefined || token === null) {
        throw new TypeError("Invalid token provided")
    }

    if (token.trim().toLowerCase().startsWith("bot ")) {
        return token
    } else {
        return `Bot ${token}`
    }
}
