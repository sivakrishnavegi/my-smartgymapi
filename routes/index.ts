// routes/index.js

import academicYearRoutes from "./academicYearRoutes";
import manageStaffRoutes from "./admin/manageStaffRoutes";
import appConfigRoutes from "./appConfigRoutes";
import attendanceRoutes from "./attendanceRoutes";
import authRoutes from "./authRoutes";
import classesRoutes from "./classRoutes";
import eventRoutes from "./eventRoutes";
import googleAuthRoutes from "./googleAuthRoutes";
import googleMeetRoutes from "./googleMeetRoutes";
import rolesRoutes from "./roleRoutes";
import schoolRoutes from "./school.routes";
import sectionRoutes from "./section.routes";
import subjectRoutes from "./subjectRoutes";
import socketRoutes from "./socket/socketRoutes";
import superAdminRoutes from "./superadminRoutes";
import tenantRoutes from "./tenantRoutes";
import userRoutes from "./user.routes";
import teacherRoutes from "./teacherRoutes";
import libraryRoutes from "./library.routes";

const routes = {
  appConfigRoutes,
  attendanceRoutes,
  authRoutes,
  classesRoutes,
  eventRoutes,
  rolesRoutes,
  academicYearRoutes,
  schoolRoutes,
  sectionRoutes,
  subjectRoutes,
  tenantRoutes,
  userRoutes,
  googleAuthRoutes,
  googleMeetRoutes,
  superAdminRoutes,
  manageStaffRoutes,
  socketRoutes,
  teacherRoutes,
  libraryRoutes,
};

export default routes;
