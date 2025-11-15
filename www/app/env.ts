const requireEnvVar = (name: string) => {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

export const APP_URL = trimTrailingSlash(requireEnvVar("NEXT_PUBLIC_APP_URL"));
export const SIGN_UP_URL = `${APP_URL}/signup`;
export const FOUNDER_EMAIL = requireEnvVar("NEXT_PUBLIC_FOUNDER_EMAIL");
export const CONTACT_EMAIL = `mailto:${FOUNDER_EMAIL}`;
