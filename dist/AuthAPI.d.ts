/// <reference types="node" />
declare class AuthAPI {
    host: string;
    lang: string;
    strings: any;
    constructor(lang: string, host?: string);
    /**
     * Fetch with response strings
     * @param path Request path
     * @param option Request option
     * @returns response data or UNKNOWN ERROR
     */
    private fetchWithStrings;
    /**
     * Login with id and password
     * @param id id
     * @param password password
     * @returns Refresh token
     */
    login(id: string, password: string): Promise<string>;
    /**
     * Signup with id, password, google recaptcha response
     * @param id id
     * @param password password
     * @param g_response google recaptcha response
     * @returns Refresh token
     */
    signup(id: string, password: string, g_response: string): Promise<string>;
    /**
     * Get access token with refresh token
     * @param refreshToken Refresh token
     * @returns Access token
     */
    getAccessToken(refreshToken: string): Promise<string>;
    /**
     * Renew refresh token
     * @param refreshToken Refresh token
     * @returns Renewed refresh token
     */
    renewRefreshToken(refreshToken: string): Promise<string>;
}
declare class TokenKeeper {
    authAPI: AuthAPI;
    refreshToken?: string;
    accessToken?: string;
    refreshInterval?: NodeJS.Timer;
    accessInterval?: NodeJS.Timer;
    watchRefreshToken: ((refreshToken: string) => void) | undefined;
    watchAccessToken: ((accessToken: string) => void) | undefined;
    constructor(authAPI: AuthAPI, refreshToken?: string, accessToken?: string);
    /**
     * Set the interval between refresh callbacks
     * @param refreshInterval Interval between refreshes of the refresh token
     * @param accessInterval Interval between refreshes of the access token
     * @param refreshCallInterval setInterval callback call interval
     * @param accessCallInterval setInterval callback call interval
     */
    setTokenInterval(refreshInterval?: number, accessInterval?: number, refreshCallInterval?: number, accessCallInterval?: number): Promise<void>;
    release(): void;
}
export { AuthAPI, TokenKeeper };
