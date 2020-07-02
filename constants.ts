//Load Env Variables. DOTENV
import "https://deno.land/x/dotenv@v0.5.0/load.ts";

const DATABASE_NAME = Deno.env.get("DATABASE_NAME")!;
const MONGO_URL = Deno.env.get("MONGO_URL")!;
const JWT_SECRET = Deno.env.get("JWT_SECRET")!;
const PORT = Deno.env.get("PORT") || "8000";
if (!DATABASE_NAME) {
  throw new Error("DATABASE_NAME enviroment variable should be set.");
}
if (!MONGO_URL) {
  throw new Error("MONGO_URL enviroment variable should be set.");
}
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET enviroment variable should be set.");
}

export { DATABASE_NAME, MONGO_URL, PORT, JWT_SECRET };
