/** Class representing an asynchronous event handler */
export class EventHandler<Events extends Record<string, any[]>> {
    #listeners: {
        [K in keyof Events]?: Array<(...args: Events[K]) => any | Promise<any>>
    } = {}

    /**
     * Add an event listener that can run multiple times
     * @param event Event name
     * @param listener Listener callback
     * @returns EventHandler instance
     */
    public on<K extends keyof Events>(
        event: K,
        listener: (...args: Events[K]) => any | Promise<any>
    ) {
        if (!this.#listeners[event]) {
            this.#listeners[event] = []
        }

        this.#listeners[event]!.push(listener)
        return this
    }

    /**
     * Add an event listener that only runs one time
     * @param event Event name
     * @param listener Listener callback
     * @returns EventHandler instance
     */
    public once<K extends keyof Events>(
        event: K,
        listener: (...args: Events[K]) => any | Promise<any>
    ) {
        const wrapped = async (...args: Events[K]) => {
            await Promise.resolve(listener(...args))
            this.off(event, wrapped)
        }

        this.on(event, wrapped)
        return this
    }

    /**
     * Remove an event listener
     * @param event Event name
     * @param listener Listener callback
     * @returns EventHandler instance
     */
    public off<K extends keyof Events>(
        event: K,
        listener: (...args: Events[K]) => any | Promise<any>
    ) {
        if (!this.#listeners[event]) {
            return this
        }

        this.#listeners[event] = this.#listeners[event]!.filter((l) => l !== listener)
        return this
    }

    /**
     * Emit an event by name
     * @param event Event name
     * @param args Event arguments
     * @returns Boolean representing whether at least one listener function was called
     */
    public async emit<K extends keyof Events>(event: K, ...args: Events[K]) {
        const listeners = this.#listeners[event]

        if (!listeners) {
            return false
        }

        for (const listener of listeners) {
            await Promise.resolve(listener(...args))
        }

        return true
    }
}
