import type { HTTPMethod, RESTManagerProps } from "@/types"
import { baseApiUrl } from "@/constants"
import { parseToken } from "@/functions/parse-token"

/** Class representing a manager for handling REST API calls */
export class RESTManager {
    #token: string

    /** Client token used for authorization */
    public get token() {
        return this.#token
    }

    /**
     * Instantiate a new RESTManager
     * @param props RESTManager props
     * @returns RESTManager instance
     */
    public constructor(props: RESTManagerProps) {
        if (!props || typeof props !== "object") {
            throw new TypeError("Invalid props provided")
        }

        if (!props.token || typeof props.token !== "string") {
            throw new TypeError("Invalid token provided")
        }

        this.#token = parseToken(props.token)
        return this
    }

    /**
     * Send a request to the API
     * @param method HTTP method (GET, POST, PATCH, PUT, DELETE)
     * @param endpoint Endpoint URI
     * @param options Request options
     * @returns Response extended with `data` property
     */
    public async request<T = unknown>(
        method: HTTPMethod,
        endpoint: string,
        options?: { body?: any }
    ) {
        const res = await fetch(baseApiUrl + endpoint, {
            method,
            body: options?.body ? JSON.stringify(options.body) : undefined,
            headers: {
                Authorization: this.#token,
                "Content-Type": "application/json",
            },
        })

        const json = (await res.json().catch(() => null)) as T
        return Object.assign(res, { data: json })
    }

    /**
     * Send a DELETE request
     * @param endpoint Endpoint URI
     * @returns Response extended with `data` property
     */
    public delete<T = unknown>(endpoint: string) {
        return this.request<T>("DELETE", endpoint)
    }

    /**
     * Send a GET request
     * @param endpoint Endpoint URI
     * @returns Response extended with `data` property
     */
    public get<T = unknown>(endpoint: string) {
        return this.request<T>("GET", endpoint)
    }

    /**
     * Send a PATCH request
     * @param endpoint Endpoint URI
     * @param options Request options
     * @returns Response extended with `data` property
     */
    public patch<T = unknown>(endpoint: string, options?: { body?: any }) {
        return this.request<T>("PATCH", endpoint, options)
    }

    /**
     * Send a POST request
     * @param endpoint Endpoint URI
     * @param options Request options
     * @returns Response extended with `data` property
     */
    public post<T = unknown>(endpoint: string, options?: { body?: any }) {
        return this.request<T>("POST", endpoint, options)
    }

    /**
     * Send a PUT request
     * @param endpoint Endpoint URI
     * @param options Request options
     * @returns Response extended with `data` property
     */
    public put<T = unknown>(endpoint: string, options?: { body?: any }) {
        return this.request<T>("PUT", endpoint, options)
    }
}
