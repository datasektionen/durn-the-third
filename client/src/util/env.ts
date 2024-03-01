const unspecified = (var_name: string): never => {
  throw new Error(`${var_name} env-var has to be set`);
}

export const env = {
  LOGIN_URL: process.env.LOGIN_URL ?? "https://login.datasektionen.se",
  API_URL: process.env.API_URL ?? unspecified("API_URL"),
  PLS_URL: process.env.PLS_URL ?? "https://pls.datasektionen.se"
}