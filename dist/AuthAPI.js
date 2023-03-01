"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenKeeper = exports.AuthAPI = void 0;
const crypto_1 = __importDefault(require("crypto"));
const JwtParser_1 = require("./JwtParser");
class AuthAPI {
    constructor(lang, host = "") {
        this.host = host;
        this.lang = lang;
        this.strings = {
            UNKNOWN_ERROR: "An unknown error has occurred.",
        };
        fetch(`${this.host}/strings/${lang}.json`)
            .then((res) => res.json())
            .then((data) => {
            this.strings = data;
        });
    }
    /**
     * Fetch with response strings
     * @param path Request path
     * @param option Request option
     * @returns response data or UNKNOWN ERROR
     */
    fetchWithStrings(path, option) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield fetch(`${this.host}${path}`, option);
            let data;
            if ((_a = res.headers.get("content-type")) === null || _a === void 0 ? void 0 : _a.includes("application/json")) {
                data = yield res.json();
            }
            else {
                data = {
                    reason: "UNKNOWN_ERROR",
                };
            }
            if (res.status !== 200) {
                const { reason } = data;
                const reasonText = this.strings[reason];
                if (!reasonText) {
                    throw new Error(this.strings["UNKNOWN_ERROR"]);
                }
                throw new Error(this.strings[reason]);
            }
            else {
                return data;
            }
        });
    }
    /**
     * Login with id and password
     * @param id id
     * @param password password
     * @returns Refresh token
     */
    login(id, password) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = yield this.fetchWithStrings("/login/", {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    id: id,
                    password: crypto_1.default.createHash("sha256").update(Buffer.from(password, "utf-8")).digest("hex"),
                }),
            });
            return data["refresh-token"];
        });
    }
    /**
     * Signup with id, password, google recaptcha response
     * @param id id
     * @param password password
     * @param g_response google recaptcha response
     * @returns Refresh token
     */
    signup(id, password, g_response) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = yield this.fetchWithStrings("/signup/", {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    id: id,
                    password: crypto_1.default.createHash("sha256").update(Buffer.from(password, "utf-8")).digest("hex"),
                    g_response: g_response,
                }),
            });
            return data["refresh-token"];
        });
    }
    /**
     * Get access token with refresh token
     * @param refreshToken Refresh token
     * @returns Access token
     */
    getAccessToken(refreshToken) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = yield this.fetchWithStrings("/access-token/", {
                method: "GET",
                headers: {
                    Authorization: refreshToken,
                },
            });
            return data["access-token"];
        });
    }
    /**
     * Renew refresh token
     * @param refreshToken Refresh token
     * @returns Renewed refresh token
     */
    renewRefreshToken(refreshToken) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = yield this.fetchWithStrings("/refresh-token/", {
                method: "GET",
                credentials: "include",
                headers: {
                    Authorization: refreshToken,
                },
            });
            return data["refresh-token"];
        });
    }
}
exports.AuthAPI = AuthAPI;
class TokenKeeper {
    constructor(authAPI, refreshToken, accessToken) {
        this.authAPI = authAPI;
        this.refreshToken = refreshToken;
        this.accessToken = accessToken;
    }
    /**
     * Set the interval between refresh callbacks
     * @param refreshInterval Interval between refreshes of the refresh token
     * @param accessInterval Interval between refreshes of the access token
     * @param refreshCallInterval setInterval callback call interval
     * @param accessCallInterval setInterval callback call interval
     */
    setTokenInterval(refreshInterval = 60 * 60 * 1000 /* One hour */, accessInterval = 10 * 60 * 1000 /* Ten minutes */, refreshCallInterval = 30 * 60 * 1000 /* Sixty minutes */, accessCallInterval = 5 * 60 * 1000 /* Five minutes */) {
        return __awaiter(this, void 0, void 0, function* () {
            const refreshRefreshToken = () => __awaiter(this, void 0, void 0, function* () {
                try {
                    if (!this.refreshToken)
                        return;
                    const refreshTokenPayload = (0, JwtParser_1.jwtParser)(this.refreshToken);
                    if (refreshTokenPayload && refreshTokenPayload.expires - Date.now() < refreshInterval) {
                        this.refreshToken = yield this.authAPI.renewRefreshToken(this.refreshToken);
                        if (this.watchRefreshToken)
                            this.watchRefreshToken(this.refreshToken);
                    }
                }
                catch (err) {
                    console.error(err);
                }
            });
            this.refreshInterval = setInterval(refreshRefreshToken, refreshCallInterval);
            const refreshAccessToken = () => __awaiter(this, void 0, void 0, function* () {
                try {
                    if (!this.accessToken || !this.refreshToken)
                        return;
                    const accessTokenPayload = (0, JwtParser_1.jwtParser)(this.accessToken);
                    if (accessTokenPayload && accessTokenPayload.expires - Date.now() < accessInterval) {
                        this.accessToken = yield this.authAPI.getAccessToken(this.refreshToken);
                        if (this.watchAccessToken)
                            this.watchAccessToken(this.accessToken);
                    }
                }
                catch (err) {
                    console.error(err);
                }
            });
            this.accessInterval = setInterval(refreshAccessToken, accessCallInterval);
            yield refreshRefreshToken();
            yield refreshAccessToken();
        });
    }
    release() {
        if (this.refreshInterval)
            clearInterval(this.refreshInterval);
        if (this.accessInterval)
            clearInterval(this.accessInterval);
    }
}
exports.TokenKeeper = TokenKeeper;
