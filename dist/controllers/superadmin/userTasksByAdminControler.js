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
exports.getAllUsers = exports.addUser = void 0;
// controllers/user.controller.ts
const bcrypt_1 = __importDefault(require("bcrypt"));
const mongoose_1 = __importDefault(require("mongoose"));
const roles_schema_1 = require("../../models/roles.schema");
const users_schema_1 = __importDefault(require("../../models/users.schema"));
const addUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const payload = req.body;
        // -------- Validation --------
        if (!payload.tenantId || !payload.schoolId)
            return res
                .status(400)
                .json({ message: "tenantId and schoolId are required" });
        if (!payload.userType)
            return res.status(400).json({ message: "userType is required" });
        const { firstName, lastName, contact } = payload.profile;
        if (!firstName || !lastName)
            return res
                .status(400)
                .json({ message: "Profile firstName and lastName are required" });
        if (!(contact === null || contact === void 0 ? void 0 : contact.email) || !(contact === null || contact === void 0 ? void 0 : contact.phone))
            return res
                .status(400)
                .json({ message: "Contact email and phone are required" });
        // -------- Unique Check --------
        const existingUserByEmail = yield users_schema_1.default.findOne({
            "account.primaryEmail": payload.account.primaryEmail.toLowerCase(),
        });
        if (existingUserByEmail) {
            return res.status(409).json({ message: "Email already exists" });
        }
        const existingUserByUsername = yield users_schema_1.default.findOne({
            "account.username": payload.account.username,
        });
        if (existingUserByUsername) {
            return res.status(409).json({ message: "Username already exists" });
        }
        const role = yield roles_schema_1.RoleModel.findOne({ name: payload.userType });
        if (!role) {
            return res
                .status(400)
                .json({ message: `Role '${payload.userType}' does not exist` });
        }
        const roleId = role._id;
        // ---------------- Hash Password ----------------
        const hashedPassword = yield bcrypt_1.default.hash(payload.account.passwordHash, 10);
        // -------- Build User Document --------
        const newUser = {
            tenantId: payload.tenantId,
            schoolId: mongoose_1.default.Types.ObjectId.isValid(payload.schoolId)
                ? new mongoose_1.default.Types.ObjectId(payload.schoolId)
                : undefined,
            userType: payload.userType,
            profile: {
                firstName,
                lastName,
                dob: new Date(payload.profile.dob),
                gender: payload.profile.gender,
                photoUrl: payload.profile.photoUrl,
                address: payload.profile.address,
                contact: {
                    secondaryEmail: contact.email.toLowerCase(),
                    secondaryContact: contact.phone,
                },
            },
            account: {
                primaryEmail: payload.account.primaryEmail.toLowerCase(),
                username: payload.account.username,
                passwordHash: hashedPassword,
                status: ((_a = payload === null || payload === void 0 ? void 0 : payload.account) === null || _a === void 0 ? void 0 : _a.status) || "inactive",
            },
            createdAt: payload.createdAt ? new Date(payload.createdAt) : new Date(),
            createdBy: req.user && mongoose_1.default.Types.ObjectId.isValid(req.user.id)
                ? new mongoose_1.default.Types.ObjectId(req.user.id)
                : undefined,
            providers: [{ provider: "local" }],
            roles: [roleId],
        };
        // -------- Save User --------
        const userDoc = new users_schema_1.default(newUser);
        yield userDoc.save();
        return res.status(201).json({
            message: "User created successfully",
            user: userDoc,
        });
    }
    catch (error) {
        console.error("❌ Error creating user:", error);
        const message = (error === null || error === void 0 ? void 0 : error.message) || "Failed to create user";
        return res.status(500).json({ message });
    }
});
exports.addUser = addUser;
const getAllUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const filters = {};
        if (req.query.userType)
            filters.userType = req.query.userType.toString().toLowerCase();
        if (req.query.status)
            filters["account.status"] = req.query.status;
        if (req.query.search) {
            const search = req.query.search.toString();
            filters.$or = [
                { "profile.firstName": { $regex: search, $options: "i" } },
                { "profile.lastName": { $regex: search, $options: "i" } },
                { "account.primaryEmail": { $regex: search, $options: "i" } },
                { "account.username": { $regex: search, $options: "i" } },
            ];
        }
        const sortBy = req.query.sortBy || "createdAt";
        const order = req.query.order === "asc" ? 1 : -1;
        const [users, total] = yield Promise.all([
            users_schema_1.default.find(filters)
                .sort({ [sortBy]: order })
                .skip(skip)
                .limit(limit)
                .lean(),
            users_schema_1.default.countDocuments(filters),
        ]);
        return res.status(200).json({
            message: "Users fetched successfully",
            data: users,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    }
    catch (error) {
        console.error("❌ Error fetching users:", error);
        return res.status(500).json({ message: (error === null || error === void 0 ? void 0 : error.message) || "Failed to fetch users" });
    }
});
exports.getAllUsers = getAllUsers;
