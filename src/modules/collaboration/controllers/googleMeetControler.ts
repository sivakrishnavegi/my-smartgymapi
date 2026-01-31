import { Request, Response } from "express";
import GoogleMeetEvent from "@collaboration/models/GoogleMeetSchema";
import User from "@iam/models/users.schema";
import { logError } from '@shared/utils/errorLogger';


export const createGoogleMeetEvent = async (req: Request, res: Response) => {
  try {
    const userId = req?.user?.id;
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

    const accessToken = user?.account?.google?.accessToken;

    // pull event details from request body
    const { title, summary, description, start, end } = req.body;

    if (!summary && !title) {
      return res.status(400).json({
        success: false,
        message: "Event must include at least a title or summary",
      });
    }

    if (!start?.dateTime || !end?.dateTime) {
      return res.status(400).json({
        success: false,
        message: "Event must include start and end dateTime",
      });
    }

    // ✅ Check for time clash for this user
    const clash = await GoogleMeetEvent.findOne({
      createdBy: userId,
      $or: [
        {
          "event.start.dateTime": { $lt: end.dateTime },
          "event.end.dateTime": { $gt: start.dateTime },
        },
      ],
    });

    if (clash) {
      return res.status(409).json({
        success: false,
        message: "You already have a meeting scheduled in this time slot",
        conflictingEvent: clash,
      });
    }

    // construct event body
    const eventBody = {
      summary: title || summary,
      description,
      start,
      end,
      conferenceData: {
        createRequest: {
          requestId: `meet-${Date.now()}`,
          conferenceSolutionKey: { type: "hangoutsMeet" },
        },
      },
    };

    // call Google Calendar API
    const response = await fetch(
      "https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventBody),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        `Google API error: ${response.status} ${JSON.stringify(data)}`
      );
    }

    const savedEvent = await GoogleMeetEvent.create({
      success: true,
      message: "Google Meet created and added to calendar",
      eventId: data.id,
      meetLink: data.hangoutLink || data.conferenceData?.entryPoints?.[0]?.uri,
      createdBy: userId,
      event: data,
    });

    return res.status(201).json({
      success: true,
      message: "Google Meet created and added to calendar",
      eventId: savedEvent.eventId,
      meetLink: savedEvent.meetLink,
      event: savedEvent,
    });
  } catch (err) {
    console.error("Error creating Google Meet event:", err);
    await logError(req, err);
    return res.status(500).json({
      success: false,
      message: "Failed to create Google Meet event",
      error: err instanceof Error ? err.message : err,
    });
  }
};