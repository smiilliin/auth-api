/**
 * Parse the jwt token
 * @param token Token to be parsed
 * @returns Token data
 */
const jwtParser = (token: string): any => {
  try {
    const dotParsed = token.split(".");
    if (dotParsed.length < 2) {
      throw new Error("The number of dots is wrong");
    }
    const encodedPayload = dotParsed[1];
    const base64ParsedPayload = Buffer.from(encodedPayload, "base64").toString();
    const payload = JSON.parse(base64ParsedPayload);

    return payload;
  } catch (err) {
    console.error(err);
    return undefined;
  }
};

export { jwtParser };
