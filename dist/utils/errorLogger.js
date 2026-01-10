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
Object.defineProperty(exports, "__esModule", { value: true });
exports.logError = void 0;
const errorLog_schema_1 = require("../models/errorLog.schema");
/**
 * Logs an error to the ErrorLog collection.
 * @param req - The Express Request object.
 * @param error - The error object or message string.
 * @param customMessage - Optional custom message to override or prepend.
 */
const logError = (req, error, customMessage) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    try {
        const errorMsg = customMessage || error.message || 'Unknown Error';
        const stack = error.stack || undefined;
        // Extract metadata from request
        const metadata = {
            query: req.query,
            params: req.params,
            body: req.body, // Be careful with sensitive data in body, maybe sanitize if needed
        };
        // Determine tenantId - look in query, body, or params
        const tenantId = ((_a = req.query) === null || _a === void 0 ? void 0 : _a.tenantId) || ((_b = req.body) === null || _b === void 0 ? void 0 : _b.tenantId) || ((_c = req.params) === null || _c === void 0 ? void 0 : _c.tenantId);
        yield errorLog_schema_1.ErrorLog.create({
            tenantId,
            userId: (_d = req.user) === null || _d === void 0 ? void 0 : _d.id,
            route: req.originalUrl,
            method: req.method,
            message: errorMsg,
            stack,
            metadata,
        });
    }
    catch (loggingError) {
        // Fail silently or log to console so as not to disrupt the main flow
        console.error('Failed to write to ErrorLog:', loggingError);
    }
});
exports.logError = logError;
