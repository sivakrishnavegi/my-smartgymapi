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
exports.refreshToken = exports.loginUser = exports.deleteUser = exports.updateUser = exports.getUserById = exports.listUsers = exports.createUser = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const cookie_1 = require("cookie");
const mongoose_1 = __importDefault(require("mongoose"));
const users_schema_1 = __importDefault(require("../models/users.schema"));
const schools_schema_1 = __importDefault(require("../models/schools.schema"));
const genarateToken_1 = require("../utils/genarateToken");
const SessionSchema_1 = require("../models/SessionSchema");
const createUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { tenantId, schoolId, userType, profile, account, roles, linkedStudentIds, employment, enrollment, } = req.body;
        // Required fields check
        if (!tenantId || !schoolId || !userType) {
            return res
                .status(400)
                .json({ error: "tenantId, schoolId, and userType are required" });
        }
        // Check if school exists
        const schoolExists = yield schools_schema_1.default.findOne({ _id: schoolId, tenantId });
        if (!schoolExists) {
            return res
                .status(404)
                .json({ error: "School not found for the given tenant" });
        }
        // Validate userType
        const validUserTypes = [
            "admin",
            "teacher",
            "student",
            "librarian",
            "guardian",
            "guest",
            "superadmin",
        ];
        if (!validUserTypes.includes(userType)) {
            return res.status(400).json({ error: "Invalid userType" });
        }
        // Account info check
        if (!account) {
            return res.status(400).json({ error: "Account information is required" });
        }
        const { primaryEmail: userEmail, username, passwordHash, status } = account;
        if (!userEmail && !username) {
            return res
                .status(400)
                .json({ error: "Either email or username is required in account" });
        }
        // Normalize and validate email if provided
        let normalizedEmail;
        if (userEmail) {
            normalizedEmail = userEmail.toLowerCase().trim();
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(normalizedEmail)) {
                return res
                    .status(400)
                    .json({ error: "Invalid email format in account" });
            }
            // Check for duplicate email
            const existingUser = yield users_schema_1.default.findOne({
                "account.primaryEmail": normalizedEmail,
            });
            if (existingUser) {
                return res
                    .status(400)
                    .json({ error: `Email already exists: ${normalizedEmail}` });
            }
        }
        // Hash password if provided
        let hashedPassword;
        if (passwordHash) {
            const saltRounds = 10;
            hashedPassword = yield bcrypt_1.default.hash(passwordHash, saltRounds);
        }
        // Enrollment check for students
        if (userType === "student" && !enrollment) {
            return res
                .status(400)
                .json({ error: "Student must have enrollment details" });
        }
        const userAccount = { username, status: status || "active" };
        if (normalizedEmail)
            userAccount.primaryEmail = normalizedEmail;
        if (hashedPassword)
            userAccount.passwordHash = hashedPassword;
        const userData = {
            tenantId,
            schoolId,
            userType,
            profile: profile || {},
            roles: roles || [],
            linkedStudentIds: linkedStudentIds || [],
            employment: employment || {},
            enrollment: enrollment || {},
            account: userAccount,
        };
        console.log("first", userData);
        // Save user
        const user = new users_schema_1.default(userData);
        yield user.save();
        res.status(201).json({ message: "User created successfully", user });
    }
    catch (err) {
        if (err.code === 11000) {
            const duplicateField = Object.keys(err.keyPattern || {})[0];
            const duplicateValue = (_a = err.keyValue) === null || _a === void 0 ? void 0 : _a[duplicateField];
            return res.status(400).json({
                error: `Duplicate value for ${duplicateField}: ${duplicateValue}`,
            });
        }
        console.error("Create user error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});
exports.createUser = createUser;
// List all users
const listUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const users = yield users_schema_1.default.find()
            .populate("roles")
            .populate("linkedStudentIds");
        res.status(200).json(users);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
exports.listUsers = listUsers;
// Get user by ID
const getUserById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        if (!mongoose_1.default.Types.ObjectId.isValid(id))
            return res.status(400).json({ error: "Invalid ID" });
        const user = yield users_schema_1.default.findById(id)
            .populate("roles")
            .populate("linkedStudentIds");
        if (!user)
            return res.status(404).json({ error: "User not found" });
        res.status(200).json(user);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
exports.getUserById = getUserById;
// Update user
const updateUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        if (!mongoose_1.default.Types.ObjectId.isValid(id))
            return res.status(400).json({ error: "Invalid ID" });
        const user = yield users_schema_1.default.findByIdAndUpdate(id, req.body, { new: true });
        if (!user)
            return res.status(404).json({ error: "User not found" });
        res.status(200).json({ message: "User updated", user });
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});
exports.updateUser = updateUser;
// Delete user
const deleteUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        if (!mongoose_1.default.Types.ObjectId.isValid(id))
            return res.status(400).json({ error: "Invalid ID" });
        const user = yield users_schema_1.default.findByIdAndDelete(id);
        if (!user)
            return res.status(404).json({ error: "User not found" });
        res.status(200).json({ message: "User deleted" });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
exports.deleteUser = deleteUser;
const loginUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required" });
        }
        // Find user by email
        const user = yield users_schema_1.default.findOne({
            "account.primaryEmail": email.toLowerCase().trim(),
        });
        if (!user) {
            return res.status(401).json({ error: "Invalid email or password" });
        }
        // Compare password
        if (!user.account || typeof user.account.passwordHash !== "string") {
            return res.status(401).json({ error: "Invalid email or password" });
        }
        const isMatch = yield bcrypt_1.default.compare(password, user.account.passwordHash);
        if (!isMatch) {
            return res.status(401).json({ error: "Invalid email or password" });
        }
        // Generate token
        const token = yield (0, genarateToken_1.generateToken)({
            _id: user === null || user === void 0 ? void 0 : user._id,
            email: user.account.primaryEmail,
            role: user.userType,
        });
        const refreshToken = (0, genarateToken_1.generateRefreshToken)({
            _id: user === null || user === void 0 ? void 0 : user._id,
            email: user.account.primaryEmail,
            role: user.userType,
        });
        const hashedRefreshToken = yield bcrypt_1.default.hash(refreshToken, 10);
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
        yield SessionSchema_1.SessionModel.create({
            userId: user._id,
            refreshToken: hashedRefreshToken,
            ip: req.ip,
            userAgent: req.headers["user-agent"],
            expiresAt,
        });
        // Set cookie
        const cookie = (0, cookie_1.serialize)("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 60 * 60 * 24, // 1 day
            path: "/",
        });
        const refreshCookie = (0, cookie_1.serialize)("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60, // 7 days
            path: "/",
        });
        res.setHeader("Set-Cookie", [cookie, refreshCookie]);
        // Return response
        return res.status(200).json({
            message: "Login successful",
            user: {
                id: user._id,
                email: (_b = (_a = user.account) === null || _a === void 0 ? void 0 : _a.primaryEmail) !== null && _b !== void 0 ? _b : null,
                role: user.userType,
                token: token,
            },
        });
    }
    catch (err) {
        console.error("Login error:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
});
exports.loginUser = loginUser;
const refreshToken = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const token = req.cookies.refreshToken;
        if (!token) {
            return res.status(401).json({ error: "No refresh token provided" });
        }
        // 1. Find all active sessions
        const sessions = yield SessionSchema_1.SessionModel.find({
            expiresAt: { $gt: new Date() },
        });
        // 2. Find session matching the hashed refresh token
        let matchedSession = null;
        for (const sess of sessions) {
            const isMatch = yield bcrypt_1.default.compare(token, sess.refreshToken);
            if (isMatch) {
                matchedSession = sess;
                break;
            }
        }
        if (!matchedSession) {
            return res.status(403).json({ error: "Refresh token expired or invalid" });
        }
        // 3. Load the user
        const user = yield users_schema_1.default.findById(matchedSession.userId);
        if (!user || !user.account) {
            return res.status(404).json({ error: "User not found or account missing" });
        }
        // 4. Generate new tokens
        const newAccessToken = (0, genarateToken_1.generateToken)({
            _id: user._id,
            email: (_a = user.account.primaryEmail) !== null && _a !== void 0 ? _a : "",
            role: user.userType,
        });
        const newRefreshToken = (0, genarateToken_1.generateRefreshToken)({
            _id: user._id,
            email: (_b = user.account.primaryEmail) !== null && _b !== void 0 ? _b : "",
            role: user.userType,
        });
        // 5. Rotate refresh token in DB
        matchedSession.refreshToken = yield bcrypt_1.default.hash(newRefreshToken, 10);
        matchedSession.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        yield matchedSession.save();
        // 6. Set cookies exactly like loginUser
        const tokenCookie = (0, cookie_1.serialize)("token", newAccessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 15 * 60, // 15 minutes
            path: "/",
        });
        const refreshCookie = (0, cookie_1.serialize)("refreshToken", newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60, // 7 days
            path: "/",
        });
        res.setHeader("Set-Cookie", [tokenCookie, refreshCookie]);
        // 7. Return tokens in response
        return res.json({
            token: newAccessToken,
            refreshToken: newRefreshToken,
        });
    }
    catch (err) {
        console.error("Refresh token error:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
});
exports.refreshToken = refreshToken;
