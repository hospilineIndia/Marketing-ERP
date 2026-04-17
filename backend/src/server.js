import app from "./app.js";
import { env } from "./config/env.js";

app.listen(env.port, () => {
  console.log(`Marketing ERP backend listening on http://localhost:${env.port}`);
});
