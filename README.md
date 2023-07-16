# auth-api - auth API

## Usage

### AuthAPI

Initialize AuthAPI class

```typescript
const authAPI = new AuthAPI("https://smiilliin.com/api");
```

### Load

Load fetchstrings

```typescript
await authAPI.load("en");
```

### login

Login with id and password

```typescript
const refreshToken: string = await authAPI.login(id, password);
console.log("[Refresh Token]", refreshToken);
```

### signup

Signup with id, password, google recaptcha response

```typescript
const refreshToken: string = await authAPI.signup(id, password, g_response);
console.log("[Refresh Token]", refreshToken);
```

### get access token

Get access token with refresh token

```typescript
const accessToken: string = await authAPI.getAccessToken(refreshToken);
console.log("[Access Token]", accessToken);
```

### renew refresh token

Renew refresh token

```typescript
const renewedRefreshToken: string = await authAPI.renewRefreshToken(refreshToken);
console.log("[Refresh Token]", renewedRefreshToken);
```

### TokenKeeper

```typescript
const tokenKeeper = new TokenKeeper(authAPI, refreshToken, accessToken);
```

### setTokenInterval

Set the interval between refresh callbacks

```typescript
tokenKeeper.setTokenInterval(60 * 60 * 1000, 10 * 60 * 1000, 30 * 60 * 1000, 5 * 60 * 1000);
```

### watchRefreshToken

Watch if the refresh token changed

```typescript
tokenKeeper.watchRefreshToken = (refreshToken: string) => {
  console.log(refreshToken);
};
```

### watchAccessToken

Watch if the access token changed

```typescript
tokenKeeper.watchAccessToken = (accessToken: string) => {
  console.log(accessToken);
};
```
