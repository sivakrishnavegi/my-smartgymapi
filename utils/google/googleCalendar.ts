import { google } from 'googleapis';
import path from 'path';
// Load service account credentials
const keyFilePath = path.join(__dirname, '../../config/google-service-account.json');

const auth = new google.auth.GoogleAuth({
  keyFile: keyFilePath,
  scopes: ['https://www.googleapis.com/auth/calendar'],
});

const calendar = google.calendar({ version: 'v3', auth : auth });

export default calendar;
