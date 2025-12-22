"use strict";
// routes/index.js
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const academicYearRoutes_1 = __importDefault(require("./academicYearRoutes"));
const manageStaffRoutes_1 = __importDefault(require("./admin/manageStaffRoutes"));
const appConfigRoutes_1 = __importDefault(require("./appConfigRoutes"));
const attendanceRoutes_1 = __importDefault(require("./attendanceRoutes"));
const authRoutes_1 = __importDefault(require("./authRoutes"));
const classRoutes_1 = __importDefault(require("./classRoutes"));
const eventRoutes_1 = __importDefault(require("./eventRoutes"));
const googleAuthRoutes_1 = __importDefault(require("./googleAuthRoutes"));
const googleMeetRoutes_1 = __importDefault(require("./googleMeetRoutes"));
const roleRoutes_1 = __importDefault(require("./roleRoutes"));
const school_routes_1 = __importDefault(require("./school.routes"));
const section_routes_1 = __importDefault(require("./section.routes"));
const socketRoutes_1 = __importDefault(require("./socket/socketRoutes"));
const superadminRoutes_1 = __importDefault(require("./superadminRoutes"));
const tenantRoutes_1 = __importDefault(require("./tenantRoutes"));
const user_routes_1 = __importDefault(require("./user.routes"));
const routes = {
    appConfigRoutes: appConfigRoutes_1.default,
    attendanceRoutes: attendanceRoutes_1.default,
    authRoutes: authRoutes_1.default,
    classesRoutes: classRoutes_1.default,
    eventRoutes: eventRoutes_1.default,
    rolesRoutes: roleRoutes_1.default,
    academicYearRoutes: academicYearRoutes_1.default,
    schoolRoutes: school_routes_1.default,
    sectionRoutes: section_routes_1.default,
    tenantRoutes: tenantRoutes_1.default,
    userRoutes: user_routes_1.default,
    googleAuthRoutes: googleAuthRoutes_1.default,
    googleMeetRoutes: googleMeetRoutes_1.default,
    superAdminRoutes: superadminRoutes_1.default,
    manageStaffRoutes: manageStaffRoutes_1.default,
    socketRoutes: socketRoutes_1.default,
};
exports.default = routes;
