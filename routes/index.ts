// routes/index.js

import attendanceRoutes from "./attendanceRoutes";
import authRoutes from "./authRoutes";
import classesRoutes from "./classRoutes";
import eventRoutes from "./eventRoutes";
import googleAuthRoutes from "./googleAuthRoutes";
import googleMeetRoutes from "./googleMeetRoutes";
import rolesRoutes from "./roleRoutes";
import schoolRoutes from "./school.routes";
import sectionRoutes from "./section.routes";
import superAdminRoutes from "./superadminRoutes";
import tenantRoutes from "./tenantRoutes";
import userRoutes from "./user.routes";
import appConfigRoutes from "./appConfigRoutes";
import academicYearRoutes from "./academicYearRoutes";

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
  tenantRoutes,
  userRoutes,
  googleAuthRoutes,
  googleMeetRoutes,
  superAdminRoutes,
};

export default routes;
