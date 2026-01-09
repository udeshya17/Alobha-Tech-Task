import { createApp } from "./app.js";
import { connectDb } from "./config/db.js";
import { env } from "./config/env.js";

await connectDb();

const app = createApp();
app.listen(env.port, () => {
  console.log(`API listening on ${env.port}`);
});


