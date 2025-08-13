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
exports.signup = exports.login = void 0;
const auth_user_1 = __importDefault(require("../models/auth.user"));
const genarateToken_1 = require("../utils/genarateToken");
const bcrypt_1 = __importDefault(require("bcrypt"));
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    const user = yield auth_user_1.default.findOne({ email });
    if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }
    const isMatch = yield bcrypt_1.default.compare(password, user.password);
    if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }
    const token = (0, genarateToken_1.generateToken)({
        _id: user._id.toString(),
        email: user.email,
        role: user.role,
    });
    res.status(200).json({
        message: 'Login successful',
        token,
        user: {
            id: user._id,
            email: user.email,
            role: user.role,
        },
    });
});
exports.login = login;
const signup = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password, role } = req.body;
    try {
        const existingUser = yield auth_user_1.default.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already registered' });
        }
        const hashedPassword = yield bcrypt_1.default.hash(password, 10);
        const newUser = yield auth_user_1.default.create({
            email,
            password: hashedPassword,
            role: role || 'user',
        });
        const token = (0, genarateToken_1.generateToken)({
            _id: newUser._id.toString(),
            email: newUser.email,
            role: newUser.role,
        });
        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                id: newUser._id,
                email: newUser.email,
                role: newUser.role,
            },
        });
    }
    catch (error) {
        console.error('[SIGNUP ERROR]', error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.signup = signup;
