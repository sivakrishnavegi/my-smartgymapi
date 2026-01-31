// routes/index.js

import academicYearRoutes from "@academics/routes/academicYearRoutes";
import manageStaffRoutes from "./admin/manageStaffRoutes";
import appConfigRoutes from "./appConfigRoutes";
import attendanceRoutes from "@academics/routes/attendanceRoutes";
import authRoutes from "@iam/routes/authRoutes";
import classesRoutes from "@academics/routes/classRoutes";
import eventRoutes from "@operational/routes/eventRoutes";
import googleAuthRoutes from "@iam/routes/googleAuthRoutes";
import googleMeetRoutes from "@collaboration/routes/googleMeetRoutes";
import rolesRoutes from "@iam/routes/roleRoutes";
import schoolRoutes from "@academics/routes/school.routes";
import sectionRoutes from "@academics/routes/section.routes";
import subjectRoutes from "@academics/routes/subjectRoutes";
import socketRoutes from "./socket/socketRoutes";
import superAdminRoutes from "./superadminRoutes";
import tenantRoutes from "./tenantRoutes";
import userRoutes from "@iam/routes/user.routes";
import teacherRoutes from "@academics/routes/teacherRoutes";
import libraryRoutes from "@operational/routes/library.routes";
import aiTeacherRoutes from "@ai/routes/aiTeacherRoutes";
import studentRoutes from "@academics/routes/studentRoutes";
import aiDocumentRoutes from "@ai/routes/aiDocumentRoutes";
import s3Routes from "./s3Routes";
import aiSubjectRoutes from "@ai/routes/aiSubjectRoutes";
import aiGovernanceRoutes from "@ai/routes/aiGovernance.routes";
import aiPlaygroundRoutes from "@ai/routes/aiPlayground.routes";

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
  aiPlaygroundRoutes,
  s3Routes,
};

export default routes;
