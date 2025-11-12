"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGoogleCalendarClient = void 0;
const googleapis_1 = require("googleapis");
const path_1 = __importDefault(require("path"));
// Load service account credentials
const keyFilePath = path_1.default.join(__dirname, '../../config/google-service-account.json');
const auth = new googleapis_1.google.auth.GoogleAuth({
    keyFile: keyFilePath,
    scopes: ['https://www.googleapis.com/auth/calendar'],
});
const calendar = googleapis_1.google.calendar({ version: 'v3', auth: auth });
function getGoogleCalendarClient(accessToken) {
    const auth = new googleapis_1.google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });
    return googleapis_1.google.calendar({ version: "v3", auth });
}
exports.getGoogleCalendarClient = getGoogleCalendarClient;
exports.default = calendar;
