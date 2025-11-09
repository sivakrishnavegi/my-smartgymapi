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
exports.protect = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const users_schema_1 = __importDefault(require("../models/users.schema"));
const JWT_SECRET = process.env.JWT_SECRET_KEY;
const protect = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    let token;
    try {
        // Get token from Authorization header
        if (req.headers.authorization &&
            req.headers.authorization.startsWith('Bearer ')) {
            token = req.headers.authorization.split(' ')[1];
            // Verify token
            const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
            // Optional: Fetch user details from DB (can be omitted for speed)
            const user = yield users_schema_1.default.findById(decoded._id).select('-password');
            if (!user) {
                return res.status(401).json({ message: 'User not found' });
            }
            // Attach user to req object
            req.user = {
                //@ts-ignore
                id: user._id.toString(),
                role: user.userType,
                email: (_a = user.account) === null || _a === void 0 ? void 0 : _a.primaryEmail,
            };
            next();
        }
        else {
            return res.status(401).json({ message: 'Not authorized, token missing' });
        }
    }
    catch (error) {
        console.error('[AUTH ERROR]', error);
        return res.status(401).json({ message: 'Not authorized, token invalid' });
    }
});
exports.protect = protect;
