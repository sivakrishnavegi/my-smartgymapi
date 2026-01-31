// src/controllers/event.controller.ts
import { Request, Response } from "express";
import Event from "@operational/models/event.model";
import calendar, {
  getGoogleCalendarClient,
} from "@shared/utils/google/googleCalendar";
import User from "@iam/models/users.schema";
import GoogleMeetEvent from "@collaboration/models/GoogleMeetSchema";
import { logError } from '@shared/utils/errorLogger';

export const createEvent = async (req: Request, res: Response) => {
  try {
    const { title, description, startDate, endDate, bannerUrl } = req.body;

    // Create event in MongoDB
    const newEvent = await Event.create({
      title,
      description,
      startDate,
      endDate,
      bannerUrl,
      createdBy: req?.user?.id, // from auth middleware
    });

    // Push event to Google Calendar
    //   calendarId: 'c2fbf05f64dae08edb6a733b3345c7fcd70cf5d366bdfd5d518aa5c0644a5886@group.calendar.google.com',
    const googleEvent = await calendar.events.insert({
      calendarId:
        "c2fbf05f64dae08edb6a733b3345c7fcd70cf5d366bdfd5d518aa5c0644a5886@group.calendar.google.com",
      requestBody: {
        summary: title,
        description,
        start: { dateTime: new Date(startDate).toISOString() },
        end: { dateTime: new Date(endDate).toISOString() },
      },
    });

    // Log the created Google Calendar event
    console.log("Google Calendar Event Created:", googleEvent.data);

    // Optionally, store googleEvent.data.id
    // newEvent.googleCalendarId = googleEvent.data.id;
    await newEvent.save();

    return res.status(201).json({
      success: true,
      message: "Event created successfully",
      data: newEvent,
      googleEvent: googleEvent.data, // optionally return it to frontend
    });
  } catch (err) {
    console.error("Error creating event:", err);
    await logError(req, err);
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err instanceof Error ? err.message : err,
    });
  }
};

export const getEvents = async (req: Request, res: Response) => {
  try {
    // get user id from auth middleware (e.g., req.user.id)
    const userId = req?.user?.id;
    console.log("first ggg", userId)
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // fetch user from DB
    const user = await User.findById(userId);
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "No Google access token found for this user",
      });
    }
    console.log("first ggg", user)

    const accessToken = user?.account?.google?.accessToken;

    // Call Google Calendar API directly
    const response = await fetch(
      "https://www.googleapis.com/calendar/v3/calendars/primary/events?singleEvents=true",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const errorBody = await response.json();
      throw new Error(
        `Google API error: ${response.status} ${JSON.stringify(errorBody)}`
      );
    }

    const data = await response.json();

    return res.status(200).json({
      success: true,
      message: "Calendars fetched successfully",
      data: data.items || [],
    });
  } catch (err) {
    console.error("Error fetching Google Calendars:", err);
    await logError(req, err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch calendars",
      error: err instanceof Error ? err.message : err,
    });
  }
};






