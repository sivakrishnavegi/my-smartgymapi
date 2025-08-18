// src/controllers/event.controller.ts
import { Request, Response } from "express";
import Event from "../models/event.model";
import calendar from "../utils/google/googleCalendar";

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
      calendarId: "primary",
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
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err instanceof Error ? err.message : err,
    });
  }
};

export const getEvents = async (_req: Request, res: Response) => {
  try {
    const events = await Event.find().sort({ startDate: 1 });
    return res.status(200).json({
      success: true,
      message: "Events fetched successfully",
      data: events,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err instanceof Error ? err.message : err,
    });
  }
};
