import assert from "assert";
import dotenv from "dotenv";
import { env } from "./env";
import AuthAPI from "../src/AuthAPI";

dotenv.config({ path: ".test.env" });

const authAPI = new AuthAPI(env.lang, env.host);
describe(`AUTH`, async () => {
  let refreshToken: string;

  it(`Login`, async () => {
    const refreshToken: string = await authAPI.login(env.id, env.password);
    assert(refreshToken);
  });
  it(`Get Access Token`, async () => {
    const accessToken: string = await authAPI.getAccessToken(refreshToken);
    assert(accessToken);
  });
  it(`Renew Refresh Token`, async () => {
    const renewedRefreshToken: string = await authAPI.renewRefreshToken(refreshToken);
    assert(renewedRefreshToken);
  });
});
