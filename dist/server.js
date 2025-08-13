"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app_1 = __importDefault(require("./app"));
const ds_1 = require("./config/ds");
const PORT = process.env.PORT || 3000;
(0, ds_1.connectDB)();
app_1.default.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
