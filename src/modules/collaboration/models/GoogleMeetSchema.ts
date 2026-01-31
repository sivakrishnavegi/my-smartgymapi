import mongoose, { Schema, Document, Types } from "mongoose";

interface IGoogleMeetEvent extends Document {
  success: boolean;
  message: string;
  eventId: string;
  meetLink: string;
  createdBy: Types.ObjectId; // Reference to User
  event: {
    kind: string;
    etag: string;
    id: string;
    status: string;
    htmlLink: string;
    created: Date;
    updated: Date;
    summary: string;
    description?: string;
    creator: {
      email: string;
      self: boolean;
    };
    organizer: {
      email: string;
      self: boolean;
    };
    start: {
      dateTime: string;
      timeZone: string;
    };
    end: {
      dateTime: string;
      timeZone: string;
    };
    iCalUID: string;
    sequence: number;
    hangoutLink: string;
    conferenceData: {
      createRequest: {
        requestId: string;
        conferenceSolutionKey: { type: string };
        status: { statusCode: string };
      };
      entryPoints: [
        {
          entryPointType: string;
          uri: string;
          label: string;
        }
      ];
      conferenceSolution: {
        key: { type: string };
        name: string;
        iconUri: string;
      };
      conferenceId: string;
    };
    reminders: {
      useDefault: boolean;
    };
    eventType: string;
  };
}

const GoogleMeetEventSchema: Schema = new Schema(
  {
    success: { type: Boolean, required: true },
    message: { type: String, required: true },
    eventId: { type: String, required: true },
    meetLink: { type: String, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true }, // 🔥 user who created it
    event: {
      kind: String,
      etag: String,
      id: String,
      status: String,
      htmlLink: String,
      created: Date,
      updated: Date,
      summary: String,
      description: String,
      creator: {
        email: String,
        self: Boolean,
      },
      organizer: {
        email: String,
        self: Boolean,
      },
      start: {
        dateTime: String,
        timeZone: String,
      },
      end: {
        dateTime: String,
        timeZone: String,
      },
      iCalUID: String,
      sequence: Number,
      hangoutLink: String,
      conferenceData: {
        createRequest: {
          requestId: String,
          conferenceSolutionKey: {
            type: { type: String },
          },
          status: {
            statusCode: String,
          },
        },
        entryPoints: [
          {
            entryPointType: String,
            uri: String,
            label: String,
          },
        ],
        conferenceSolution: {
          key: {
            type: { type: String },
          },
          name: String,
          iconUri: String,
        },
        conferenceId: String,
      },
      reminders: {
        useDefault: Boolean,
      },
      eventType: String,
    },
  },
  { timestamps: true }
);

export default mongoose.model<IGoogleMeetEvent>(
  "GoogleMeetEvent",
  GoogleMeetEventSchema
);
