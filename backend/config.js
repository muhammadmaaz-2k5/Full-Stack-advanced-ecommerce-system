const config = {
  SUPABASE_URL: process.env.SUPABASE_URL || "https://usypwtrdphnyqldktgrb.supabase.co",
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || "",
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  ORIGIN: process.env.ORIGIN || "https://full-stack-advanced-ecommerce-syste.vercel.app",
  EMAIL: process.env.EMAIL || "",
  PASSWORD: process.env.PASSWORD || "",
  LOGIN_TOKEN_EXPIRATION: process.env.LOGIN_TOKEN_EXPIRATION || "30d",
  OTP_EXPIRATION_TIME: process.env.OTP_EXPIRATION_TIME || "120000",
  PASSWORD_RESET_TOKEN_EXPIRATION: process.env.PASSWORD_RESET_TOKEN_EXPIRATION || "2m",
  COOKIE_EXPIRATION_DAYS: process.env.COOKIE_EXPIRATION_DAYS || "30",
  SECRET_KEY: process.env.SECRET_KEY || "your-secret-key",
  PRODUCTION: process.env.PRODUCTION || "false",
  BYPASS_OTP: process.env.BYPASS_OTP || "false",
};

module.exports = config;
