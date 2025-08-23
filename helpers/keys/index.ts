export const parseApiKey = (apiKey: string) => {
  // Expected format: sk_live_<keyId>_<secret>
  const parts = apiKey.split("_");
  if (parts.length < 4) return null;

  return {
    prefix: `${parts[0]}_${parts[1]}`, // e.g. sk_live
    keyId: parts[2],
    secret: parts[3],
  };
};
