"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.googleAuthCallbacks = exports.googleAuthCallbackSignInButton = void 0;
const cookie_1 = require("cookie");
const users_schema_1 = __importDefault(require("../models/users.schema"));
const googleAuthRoutes_1 = require("../routes/googleAuthRoutes");
const genarateToken_1 = require("../utils/genarateToken");
const googleAuthCallbackSignInButton = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    try {
        const { account, profile, user: userData } = req.body;
        if (!(userData === null || userData === void 0 ? void 0 : userData.email)) {
            return res.status(400).json({ error: "User email is required" });
        }
        // 1. Find existing user
        let user = yield users_schema_1.default.findOne({ "account.primaryEmail": userData.email });
        const updatedProfile = {
            firstName: profile === null || profile === void 0 ? void 0 : profile.firstName,
            lastName: profile === null || profile === void 0 ? void 0 : profile.family_name,
            dob: profile === null || profile === void 0 ? void 0 : profile.dob,
            gender: profile === null || profile === void 0 ? void 0 : profile.gender,
            photoUrl: userData === null || userData === void 0 ? void 0 : userData.image,
            address: profile === null || profile === void 0 ? void 0 : profile.address,
            contact: profile === null || profile === void 0 ? void 0 : profile.contact,
        };
        const updateGoogleData = {
            accessToken: account === null || account === void 0 ? void 0 : account.access_token,
            expiryDate: account === null || account === void 0 ? void 0 : account.expires_at,
            idToken: account === null || account === void 0 ? void 0 : account.id_token,
            tokenType: account === null || account === void 0 ? void 0 : account.type,
            scope: account === null || account === void 0 ? void 0 : account.scope,
        };
        if (!user) {
            // 2. Create new user
            user = yield users_schema_1.default.create({
                tenantId: "default",
                schoolId: null,
                userType: (_a = userData.role) !== null && _a !== void 0 ? _a : "guest",
                profile: Object.assign({}, updatedProfile),
                account: {
                    primaryEmail: userData.email,
                    google: Object.assign({}, updateGoogleData),
                },
                integrationPermissions: {
                    googleSignInAuth: "granted",
                },
                providers: [
                    {
                        provider: (_b = account === null || account === void 0 ? void 0 : account.provider) !== null && _b !== void 0 ? _b : "google",
                        providerId: userData.id,
                    },
                ],
            });
        }
        else {
            const provider = (_c = account === null || account === void 0 ? void 0 : account.provider) !== null && _c !== void 0 ? _c : "google";
            // Update user atomically
            const updatedUsr = yield users_schema_1.default.findByIdAndUpdate(user._id, {
                $set: {
                    "account.primaryEmail": userData.email,
                    "account.google": updateGoogleData,
                    integrationPermissions: {
                        googleSignInAuth: "granted",
                    },
                    profile: updatedProfile,
                    "providers.$[elem]": {
                        provider,
                        providerId: userData.id,
                    },
                },
            }, {
                new: true,
                arrayFilters: [{ "elem.provider": provider }],
                upsert: false,
            });
            yield (updatedUsr === null || updatedUsr === void 0 ? void 0 : updatedUsr.save());
        }
        // 4. Generate JWT
        const token = (0, genarateToken_1.generateToken)({
            //@ts-ignore
            _id: user === null || user === void 0 ? void 0 : user._id,
            email: (_d = user.account) === null || _d === void 0 ? void 0 : _d.primaryEmail,
            role: user.userType,
        });
        // 5. Set HttpOnly cookie
        res.setHeader("Set-Cookie", (0, cookie_1.serialize)("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
            maxAge: 60 * 60 * 24,
            path: "/",
        }));
        const redirectUrl = `http://localhost:3001/dashboard/${user.userType}`;
        // 6. Respond with JSON including token and redirect URL
        return res.status(200).json({
            message: "Authentication successful",
            user: {
                id: user._id,
                email: (_e = user.account) === null || _e === void 0 ? void 0 : _e.primaryEmail,
                role: user.userType,
                token,
            },
            redirectUrl,
        });
    }
    catch (err) {
        console.error("Google Auth Callback Error:", err);
        return res
            .status(500)
            .json({ error: "Authentication failed", details: err });
    }
});
exports.googleAuthCallbackSignInButton = googleAuthCallbackSignInButton;
const googleAuthCallbacks = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _f;
    try {
        const code = req.query.code;
        if (!code) {
            return res.status(400).send("Code not provided");
        }
        // Exchange code for tokens
        const { tokens } = yield googleAuthRoutes_1.oauth2Client.getToken(code);
        googleAuthRoutes_1.oauth2Client.setCredentials(tokens);
        // Get user info from Google
        const ticket = yield googleAuthRoutes_1.oauth2Client.verifyIdToken({
            idToken: tokens.id_token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        if (!payload || !payload.email) {
            return res.redirect("http://localhost:3001/login?error=invalid_google_payload");
        }
        const updatedProfile = {
            firstName: payload === null || payload === void 0 ? void 0 : payload.name,
            lastName: payload === null || payload === void 0 ? void 0 : payload.family_name,
            photoUrl: payload === null || payload === void 0 ? void 0 : payload.picture,
        };
        const updateGoogleData = {
            accessToken: tokens === null || tokens === void 0 ? void 0 : tokens.access_token,
            expiryDate: tokens === null || tokens === void 0 ? void 0 : tokens.expiry_date,
            idToken: tokens === null || tokens === void 0 ? void 0 : tokens.id_token,
            tokenType: tokens === null || tokens === void 0 ? void 0 : tokens.token_type,
            scope: tokens === null || tokens === void 0 ? void 0 : tokens.scope,
            refreshToken: tokens === null || tokens === void 0 ? void 0 : tokens.refresh_token,
        };
        // Find existing user
        let user = yield users_schema_1.default.findOne({ "account.primaryEmail": payload.email });
        if (!user) {
            // 2. Create new user
            yield users_schema_1.default.create({
                tenantId: "default",
                schoolId: null,
                integrationPermissions: {
                    googleSignInAuth: "granted",
                    googleCalender: "granted",
                },
                //@ts-ignore
                userType: (_f = user === null || user === void 0 ? void 0 : user.userType) !== null && _f !== void 0 ? _f : "guest",
                profile: Object.assign({}, updatedProfile),
                account: {
                    primaryEmail: payload.email,
                    google: Object.assign({}, updateGoogleData),
                },
                providers: [
                    {
                        provider: "google",
                    },
                ],
            });
        }
        else {
            const provider = "google";
            // Update user atomically
            const updatedUsr = yield users_schema_1.default.findByIdAndUpdate(user._id, {
                $set: {
                    "account.primaryEmail": payload.email,
                    "account.google": updateGoogleData,
                    profile: updatedProfile,
                    "providers.$[elem]": {
                        provider,
                        providerId: user.id,
                    },
                    integrationPermissions: {
                        googleSignInAuth: "granted",
                        googleCalender: "granted",
                    },
                },
            }, {
                new: true,
                arrayFilters: [{ "elem.provider": provider }],
                upsert: false,
            });
            yield (updatedUsr === null || updatedUsr === void 0 ? void 0 : updatedUsr.save());
        }
        // Generate JWT
        const token = yield (0, genarateToken_1.generateToken)({
            //@ts-ignore
            _id: user === null || user === void 0 ? void 0 : user._id,
            email: payload.email,
            role: (user === null || user === void 0 ? void 0 : user.userType) || "guest",
        });
        // Set HttpOnly cookie
        res.setHeader("Set-Cookie", (0, cookie_1.serialize)("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
            maxAge: 60 * 60 * 24,
            path: "/",
        }));
        // Redirect to dashboard
        return res.redirect("http://localhost:3001/dashboard/admin");
    }
    catch (error) {
        console.error("Google Auth Callback Error:", error);
        return res.redirect("http://localhost:3001/login?error=google_auth_failed");
    }
});
exports.googleAuthCallbacks = googleAuthCallbacks;
