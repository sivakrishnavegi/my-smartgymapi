import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema(
  {
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChatRoom",
      required: true,
      index: true,
    },

    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    messageType: {
      type: String,
      enum: ["text", "image", "file", "system"],
      default: "text",
    },

    text: {
      type: String,
      trim: true,
      maxlength: 5000,
    },

    attachments: [
      {
        url: { type: String },
        fileName: { type: String },
        fileSize: { type: Number },
        fileType: { type: String },
      },
    ],

    status: {
      type: String,
      enum: ["sent", "delivered", "read"],
      default: "sent",
      index: true,
    },

    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    deletedFor: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    isDeleted: {
      type: Boolean,
      default: false,
    },

    meta: {
      ipAddress: { type: String },
      userAgent: { type: String },
    },
  },
  {
    timestamps: true,
  }
);


MessageSchema.index({ roomId: 1, createdAt: -1 }); 
MessageSchema.index({ senderId: 1 });
MessageSchema.index({ status: 1 });

export const Message = mongoose.model("Message", MessageSchema);
