import assert from "assert";
import { env } from "./env";
import { AuthAPI, TokenKeeper } from "../src/AuthAPI";
import { jwtParser } from "../src/JwtParser";

const authAPI = new AuthAPI(env.host);

let tokenKeeper: TokenKeeper;
let refreshToken: string;
let accessToken: string;

describe(`AuthAPI`, () => {
  it("Initialize AuthAPI", async () => {
    await authAPI.load(env.lang);
  });
  it(`Login`, async () => {
    refreshToken = await authAPI.login(env.id, env.password);
    assert(refreshToken);
  }).timeout(3000);
  it(`Login with keepLoggedin`, async () => {
    refreshToken = await authAPI.login(env.id, env.password, true);
    assert(new Date(jwtParser(refreshToken)?.expires).getTime() > Date.now());
  }).timeout(3000);
  it(`Get access token`, async () => {
    if (!refreshToken) assert(false);

    accessToken = await authAPI.getAccessToken(refreshToken);
    assert(accessToken);
  });
  it(`Renew refresh token`, async () => {
    if (!refreshToken) assert(false);

    refreshToken = await authAPI.renewRefreshToken(refreshToken);
    assert(refreshToken);
  });
});
describe(`TokenKeeper`, () => {
  let oldRefreshToken: string;
  let oldAccessToken: string;

  it(`Initalize`, () => {
    tokenKeeper = new TokenKeeper(authAPI, refreshToken, accessToken);
  });
  it(`Set old tokens`, () => {
    oldRefreshToken = tokenKeeper.refreshToken as string;
    oldAccessToken = tokenKeeper.accessToken as string;
  });
  it(`Watch tokens`, async () => {
    let refreshedRefreshToken: boolean = false;
    let refreshedAccessToken: boolean = false;

    tokenKeeper.watchRefreshToken = () => {
      refreshedRefreshToken = true;
    };
    tokenKeeper.watchAccessToken = () => {
      refreshedAccessToken = true;
    };

    await tokenKeeper.setTokenInterval(Infinity, Infinity);

    assert(refreshedRefreshToken && refreshedAccessToken);
  });

  it(`Check if renewed refresh token`, () => {
    assert(oldRefreshToken !== tokenKeeper.refreshToken);
  });
  it(`Check if renewed access token`, () => {
    assert(oldAccessToken !== tokenKeeper.accessToken);
  });

  it(`Release`, () => {
    tokenKeeper.release();
  });
});
