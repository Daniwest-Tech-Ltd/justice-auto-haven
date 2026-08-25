/**
 * Centralised environment configuration.
 * Validates required variables at boot and exposes a typed config object.
 * The server degrades gracefully (with clear logs) if optional keys are missing,
 * but refuses to start without Supabase credentials since all data flows depend on them.
 */
require("dotenv").config();

const config = {
  port: parseInt(process.env.PORT, 10) || 10000,
  nodeEnv: process.env.NODE_ENV || "development",
  isProduction: (process.env.NODE_ENV || "development") === "production",

  supabase: {
    url: process.env.SUPABASE_URL || "",
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  },

  africasTalking: {
    username: process.env.AT_USERNAME || "",
    apiKey: process.env.AT_API_KEY || "",
    environment: process.env.AT_ENVIRONMENT || "production",
  },

  ussdCode: "*384*4940#",
};

/**
 * Validate critical environment variables.
 * Returns an array of human-readable problems (empty = all good).
 */
function validateEnvironment() {
  const problems = [];

  if (!config.supabase.url) {
    problems.push("SUPABASE_URL is not set");
  }
  if (!config.supabase.serviceRoleKey) {
    problems.push("SUPABASE_SERVICE_ROLE_KEY is not set");
  }
  if (Number.isNaN(config.port)) {
    problems.push("PORT is not a valid number");
  }

  return problems;
}

module.exports = { config, validateEnvironment };
