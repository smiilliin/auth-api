import assert from "assert";
import { env } from "./env";
import { AuthAPI, TokenKeeper } from "../src/AuthAPI";

const authAPI = new AuthAPI(env.host);
const tokenKeeper = new TokenKeeper(authAPI);

describe(`AuthAPI`, () => {
  it("Initialize AuthAPI", async () => {
    await authAPI.load(env.lang);
  });
  it(`Login`, async () => {
    const refreshToken = await authAPI.login(env.id, env.password);
    tokenKeeper.refreshToken = refreshToken;
    assert(refreshToken);
  }).timeout(3000);
  it(`Get access token`, async () => {
    if (!tokenKeeper.refreshToken) assert(false);

    const accessToken = await authAPI.getAccessToken(tokenKeeper.refreshToken);
    tokenKeeper.accessToken = accessToken;
    assert(accessToken);
  });
  it(`Renew refresh token`, async () => {
    if (!tokenKeeper.refreshToken) assert(false);

    tokenKeeper.refreshToken = await authAPI.renewRefreshToken(tokenKeeper.refreshToken);
    assert(tokenKeeper.refreshToken);
  });
});
describe(`TokenKeeper`, () => {
  let oldRefreshToken: string;
  let oldAccessToken: string;

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
