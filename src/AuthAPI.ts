import crypto from "crypto";
import { jwtParser } from "./JwtParser";

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

class AuthAPI {
  host: string;
  lang: string;
  strings: any;

  constructor(lang: string, host: string = "") {
    this.host = host;
    this.lang = lang;
    this.strings = {
      UNKNOWN_ERROR: "An unknown error has occurred.",
    };

    fetch(`${this.host}/strings/${lang}.json`)
      .then((res) => {
        if (res.headers.get("content-type")?.includes("application/json")) {
          res.json().then((data) => {
            this.strings = data;
          });
        }
      })
      .catch((err) => {
        console.error(err);
      });
  }
  /**
   * Fetch with response strings
   * @param path Request path
   * @param option Request option
   * @returns response data or UNKNOWN ERROR
   */
  private async fetchWithStrings(path: string, option: RequestInit): Promise<IError | any> {
    try {
      const res = await fetch(`${this.host}${path}`, option);
      let data: IError | any;

      if (res.headers.get("content-type")?.includes("application/json")) {
        data = await res.json();
      } else {
        data = {
          reason: "UNKNOWN_ERROR",
        };
      }

      if (res.status !== 200) {
        const { reason } = data as IError;

        const reasonText = this.strings[reason];

        if (!reasonText) {
          throw new Error(this.strings["UNKNOWN_ERROR"]);
        }

        throw new Error(this.strings[reason]);
      } else {
        return data;
      }
    } catch {
      throw new Error(this.strings["UNKNOWN_ERROR"]);
    }
  }

  /**
   * Login with id and password
   * @param id id
   * @param password password
   * @returns Refresh token
   */
  async login(id: string, password: string): Promise<string> {
    const data = await this.fetchWithStrings("/login/", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: id,
        password: crypto.createHash("sha256").update(Buffer.from(password, "utf-8")).digest("hex"),
      }),
    });
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
    const data = await this.fetchWithStrings("/signup/", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: id,
        password: crypto.createHash("sha256").update(Buffer.from(password, "utf-8")).digest("hex"),
        g_response: g_response,
      }),
    });
    return data["refresh-token"];
  }
  /**
   * Get access token with refresh token
   * @param refreshToken Refresh token
   * @returns Access token
   */
  async getAccessToken(refreshToken: string): Promise<string> {
    const data = await this.fetchWithStrings("/access-token/", {
      method: "GET",
      headers: {
        Authorization: refreshToken,
      },
    });
    return data["access-token"];
  }
  /**
   * Renew refresh token
   * @param refreshToken Refresh token
   * @returns Renewed refresh token
   */
  async renewRefreshToken(refreshToken: string): Promise<string> {
    const data = await this.fetchWithStrings("/refresh-token/", {
      method: "GET",
      credentials: "include",
      headers: {
        Authorization: refreshToken,
      },
    });
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
