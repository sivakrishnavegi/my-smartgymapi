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
exports.checkIn = void 0;
const attendence_user_1 = __importDefault(require("../models/attendence.user"));
const mongoose_1 = __importDefault(require("mongoose"));
const checkIn = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);
        const existingCheckIn = yield attendence_user_1.default.findOne({
            userId: new mongoose_1.default.Types.ObjectId(userId),
            date: { $gte: todayStart, $lte: todayEnd },
        });
        // ✅ If already checked in today
        if (existingCheckIn) {
            if (existingCheckIn.status === 'pending') {
                return res.status(200).json({
                    success: false,
                    message: 'Already checked in today. Awaiting approval.',
                    data: existingCheckIn,
                    qrCodeData: `check-in:${existingCheckIn._id}:${userId}`,
                });
            }
            else {
                return res.status(409).json({
                    success: false,
                    message: 'Already checked in today.',
                    data: existingCheckIn,
                });
            }
        }
        // ✅ New check-in entry
        const attendance = yield attendence_user_1.default.create({
            userId,
            date: new Date(),
            checkInTime: new Date(),
            status: 'pending', // initially pending, can be updated by staff
        });
        return res.status(201).json({
            success: true,
            message: 'Check-in recorded. Awaiting staff approval.',
            data: attendance,
            qrCodeData: `check-in:${attendance._id}:${userId}`,
        });
    }
    catch (error) {
        console.error('[CHECK-IN ERROR]', error);
        return res.status(500).json({
            success: false,
            message: 'Internal Server Error',
        });
    }
});
exports.checkIn = checkIn;
