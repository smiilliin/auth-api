import crypto from "crypto";

interface IError {
  reason: string;
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
  private async fetchWithStrings(path: string, option: RequestInit): Promise<IError | any> {
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
      headers: {
        Authorization: refreshToken,
      },
    });
    return data["refresh-token"];
  }
}

export default AuthAPI;
