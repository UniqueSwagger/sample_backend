require("dotenv").config({ quiet: true });
const { createApp } = require("./app");
const { loadConfig } = require("./config");

const config = loadConfig();
const app = createApp({ config });

app.listen(config.PORT, () => console.log(`listening to the port on ${config.PORT} (${config.APP_ENV})`));
