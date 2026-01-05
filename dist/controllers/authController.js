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
exports.logout = exports.signup = exports.login = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const cookie_1 = require("cookie");
const SessionSchema_1 = require("../models/SessionSchema");
const users_schema_1 = __importDefault(require("../models/users.schema"));
const genarateToken_1 = require("../utils/genarateToken");
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    const { email, password } = req.body;
    try {
        const user = yield users_schema_1.default.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: "Invalid credentials" });
        }
        const isMatch = yield bcrypt_1.default.compare(password, (_a = user === null || user === void 0 ? void 0 : user.account) === null || _a === void 0 ? void 0 : _a.passwordHash);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials" });
        }
        // Generate JWT
        const token = (0, genarateToken_1.generateToken)({
            //@ts-ignore
            _id: user._id.toString(),
            email: (_b = user.account) === null || _b === void 0 ? void 0 : _b.primaryEmail,
            role: user.userType,
        });
        // Set secure HTTP-only cookie
        res.setHeader("Set-Cookie", (0, cookie_1.serialize)("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "none", // cross-site cookies
            maxAge: 60 * 60 * 24,
            path: "/",
        }));
        // Respond with user data (no token in body)
        return res.status(200).json({
            message: "Login successful",
            user: {
                id: user._id,
                email: (_c = user.account) === null || _c === void 0 ? void 0 : _c.primaryEmail,
                role: user.userType,
                token: token,
            },
        });
    }
    catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({ message: "Server error" });
    }
});
exports.login = login;
const signup = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { email, password, role } = req.body;
    try {
        const existingUser = yield users_schema_1.default.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email already registered" });
        }
        const hashedPassword = yield bcrypt_1.default.hash(password, 10);
        const newUser = yield users_schema_1.default.create({
            email,
            password: hashedPassword,
            role: role || "guest",
        });
        const token = (0, genarateToken_1.generateToken)({
            //@ts-ignore
            _id: newUser._id.toString(),
            email: (_a = newUser.account) === null || _a === void 0 ? void 0 : _a.primaryEmail,
            role: newUser.userType,
        });
        res.status(201).json({
            message: "User registered successfully",
            token,
            user: {
                id: newUser._id,
                email: (_b = newUser.account) === null || _b === void 0 ? void 0 : _b.primaryEmail,
                role: newUser.userType,
            },
        });
    }
    catch (error) {
        console.error("[SIGNUP ERROR]", error);
        res.status(500).json({ message: "Server error" });
    }
});
exports.signup = signup;
const logout = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const cookies = req.cookies || {};
        const token = req.cookies.refreshToken;
        if (token) {
            yield SessionSchema_1.SessionModel.deleteOne({ refreshToken: token });
        }
        Object.keys(cookies).forEach((cookieName) => {
            res.clearCookie(cookieName, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                path: "/", // must match the cookie path
            });
        });
        // res.setHeader("Set-Cookie", [
        //   serialize("token", "", { maxAge: 0, path: "/" }),
        //   serialize("refreshToken", "", { maxAge: 0, path: "/" }),
        // ]);
        return res.status(200).json({ message: "Logged out successfully" });
    }
    catch (error) {
        return res.status(500).json({ message: "Server error" });
    }
});
exports.logout = logout;
