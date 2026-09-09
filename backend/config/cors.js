// Bearer-token clients do not need credentialed cookies. Non-browser API clients
// remain usable; CORS only controls which browser origins may read responses.
const corsOptions = (env = process.env) => ({
  origin: env.CLIENT_URL || (env.NODE_ENV === "production" ? false : "http://localhost:5173"),
});

module.exports = corsOptions;
