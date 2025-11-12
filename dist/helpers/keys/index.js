"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseApiKey = void 0;
const parseApiKey = (apiKey) => {
    // Expected format: sk_live_<keyId>_<secret>
    const parts = apiKey.split("_");
    if (parts.length < 4)
        return null;
    return {
        prefix: `${parts[0]}_${parts[1]}`,
        keyId: parts[2],
        secret: parts[3],
    };
};
exports.parseApiKey = parseApiKey;
