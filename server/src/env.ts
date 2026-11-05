import path from "node:path";
import { config } from "dotenv";
import { fileURLToPath } from "node:url";

const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
config({ path: path.join(serverRoot, ".env") });
