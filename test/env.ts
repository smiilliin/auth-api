import dotenv from "dotenv";

dotenv.config({ path: ".env" });

const env = {
  host: process.env.HOST as string,
  id: process.env.ID as string,
  password: process.env.PASSWORD as string,
  lang: process.env.STRINGS_LANG as string,
};

new Map(Object.entries(env)).forEach((value, key) => {
  if (value === undefined) {
    throw new Error(`${key} not defined`);
  }
});

export { env };
