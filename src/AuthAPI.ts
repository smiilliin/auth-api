import crypto from "crypto";
import { jwtParser } from "./JwtParser";
import FetchStrings, { BaseAPI } from "fetchstrings";

interface IError {
  reason: string;
}
interface IToken {
  type: string;
  expires: number;
}
interface IRefreshToken extends IToken {
  id: string;
  generation: number;
}
interface IAccessToken extends IToken {
  id: string;
}

class AuthAPI extends BaseAPI {
  /**
   * Login with id and password
   * @param id id
   * @param password password
   * @returns Refresh token
   */
  async login(id: string, password: string): Promise<string> {
    const data = await this.post(
      "/login",
      {
        id: id,
        password: crypto.createHash("sha256").update(Buffer.from(password, "utf-8")).digest("hex"),
      },
      {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return data["refresh-token"];
  }
  /**
   * Signup with id, password, google recaptcha response
   * @param id id
   * @param password password
   * @param g_response google recaptcha response
   * @returns Refresh token
   */
  async signup(id: string, password: string, g_response: string): Promise<string> {
    const data = await this.post(
      "/signup",
      {
        id: id,
        password: crypto.createHash("sha256").update(Buffer.from(password, "utf-8")).digest("hex"),
        g_response: g_response,
      },
      {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return data["refresh-token"];
  }
  /**
   * Get access token with refresh token
   * @param refreshToken Refresh token
   * @returns Access token
   */
  async getAccessToken(refreshToken: string): Promise<string> {
    const data = await this.get(
      "/access-token",
      {},
      {
        headers: {
          Authorization: refreshToken,
        },
      }
    );
    return data["access-token"];
  }
  /**
   * Renew refresh token
   * @param refreshToken Refresh token
   * @returns Renewed refresh token
   */
  async renewRefreshToken(refreshToken: string): Promise<string> {
    const data = await this.get(
      "/refresh-token",
      {},
      {
        headers: {
          Authorization: refreshToken,
        },
      }
    );
    return data["refresh-token"];
  }
}

class TokenKeeper {
  authAPI: AuthAPI;
  refreshToken?: string;
  accessToken?: string;

  refreshInterval?: NodeJS.Timer;
  accessInterval?: NodeJS.Timer;

  watchRefreshToken: ((refreshToken: string) => void) | undefined;
  watchAccessToken: ((accessToken: string) => void) | undefined;

  constructor(authAPI: AuthAPI, refreshToken?: string, accessToken?: string) {
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
  async setTokenInterval(
    refreshInterval: number = 60 * 60 * 1000 /* One hour */,
    accessInterval: number = 10 * 60 * 1000 /* Ten minutes */,
    refreshCallInterval: number = 30 * 60 * 1000 /* Sixty minutes */,
    accessCallInterval: number = 5 * 60 * 1000 /* Five minutes */
  ) {
    const refreshRefreshToken = async () => {
      try {
        if (!this.refreshToken) return;
        const refreshTokenPayload = jwtParser(this.refreshToken) as IRefreshToken;

        if (refreshTokenPayload && refreshTokenPayload.expires - Date.now() < refreshInterval) {
          this.refreshToken = await this.authAPI.renewRefreshToken(this.refreshToken);
          if (this.watchRefreshToken) this.watchRefreshToken(this.refreshToken);
        }
      } catch (err) {
        console.error(err);
      }
    };

    this.refreshInterval = setInterval(refreshRefreshToken, refreshCallInterval);

    const refreshAccessToken = async () => {
      try {
        if (!this.accessToken || !this.refreshToken) return;
        const accessTokenPayload = jwtParser(this.accessToken) as IAccessToken;

        if (accessTokenPayload && accessTokenPayload.expires - Date.now() < accessInterval) {
          this.accessToken = await this.authAPI.getAccessToken(this.refreshToken);
          if (this.watchAccessToken) this.watchAccessToken(this.accessToken);
        }
      } catch (err) {
        console.error(err);
      }
    };

    this.accessInterval = setInterval(refreshAccessToken, accessCallInterval);

    await refreshRefreshToken();
    await refreshAccessToken();
  }
  release() {
    if (this.refreshInterval) clearInterval(this.refreshInterval);
    if (this.accessInterval) clearInterval(this.accessInterval);
  }
}

export { AuthAPI, TokenKeeper };
