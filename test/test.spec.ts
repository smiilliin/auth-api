import assert from "assert";
import dotenv from "dotenv";
import { env } from "./env";
import { AuthAPI, TokenKeeper } from "../src/AuthAPI";

dotenv.config({ path: ".test.env" });

const authAPI = new AuthAPI(env.lang, env.host);
let refreshToken: string;
let accessToken: string;
describe(`AutAPI`, () => {
  it(`Login`, async () => {
    refreshToken = await authAPI.login(env.id, env.password);
    assert(refreshToken);
  });
  it(`Get Access Token`, async () => {
    accessToken = await authAPI.getAccessToken(refreshToken);
    assert(accessToken);
  });
  it(`Renew Refresh Token`, async () => {
    const renewedRefreshToken: string = await authAPI.renewRefreshToken(refreshToken);
    assert(renewedRefreshToken);
  });
});

const sleep = async (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

describe(`TokenKeeper`, () => {
  const tokenKeeper = new TokenKeeper(authAPI, refreshToken, accessToken);
  const oldRefreshToken = refreshToken;
  const oldAccessToken = accessToken;

  tokenKeeper.setTokenInterval(Infinity, Infinity);

  it(`Sleep for a refresh`, async () => {
    await sleep(1000);
    assert(true);
  });

  it(`Check if renewed refresh token`, () => {
    assert(oldRefreshToken !== refreshToken);
  });
  it(`Check if renewed access token`, () => {
    assert(oldAccessToken !== accessToken);
  });

  it(`Release`, () => {
    tokenKeeper.release();
  });
});
