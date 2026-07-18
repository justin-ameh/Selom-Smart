const { app } = require("../src/server");

// Vercel exécute Express comme une fonction serverless : aucun app.listen() ici.
module.exports = app;
