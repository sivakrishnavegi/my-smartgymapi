// routes/index.js

import academicYearRoutes from "./academicYearRoutes";
import manageStaffRoutes from "./admin/manageStaffRoutes";
import appConfigRoutes from "./appConfigRoutes";
import attendanceRoutes from "./attendanceRoutes";
import authRoutes from "@iam/routes/authRoutes";
import classesRoutes from "./classRoutes";
import eventRoutes from "./eventRoutes";
import googleAuthRoutes from "@iam/routes/googleAuthRoutes";
import googleMeetRoutes from "./googleMeetRoutes";
import rolesRoutes from "@iam/routes/roleRoutes";
import schoolRoutes from "./school.routes";
import sectionRoutes from "./section.routes";
import subjectRoutes from "./subjectRoutes";
import socketRoutes from "./socket/socketRoutes";
import superAdminRoutes from "./superadminRoutes";
import tenantRoutes from "./tenantRoutes";
import userRoutes from "@iam/routes/user.routes";
import teacherRoutes from "./teacherRoutes";
import libraryRoutes from "./library.routes";
import aiTeacherRoutes from "@ai/routes/aiTeacherRoutes";
import studentRoutes from "./studentRoutes";
import aiDocumentRoutes from "@ai/routes/aiDocumentRoutes";
import s3Routes from "./s3Routes";
import aiSubjectRoutes from "@ai/routes/aiSubjectRoutes";
import aiGovernanceRoutes from "@ai/routes/aiGovernance.routes";

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
  aiTeacherRoutes,
  studentRoutes,
  aiDocumentRoutes,
  aiSubjectRoutes,
  aiGovernanceRoutes,
  s3Routes,
};

export default routes;
