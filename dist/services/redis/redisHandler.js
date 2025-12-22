"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const mesages_schema_1 = require("../../models/mesages.schema");
const redisClient_1 = require("./redisClient");
const CHAT_INCOMING = "chat_incoming";
const CHAT_SAVED = "chat_saved";
// Subscribe to chat_incoming channel
(() => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const count = yield redisClient_1.redisSubscriber.subscribe(CHAT_INCOMING);
        console.log(`📡 Subscribed to ${count} Redis channel(s) for chat`);
    }
    catch (err) {
        console.error("❌ Redis subscribe error:", err);
    }
}))();
// Listen for incoming messages from socket server
redisClient_1.redisSubscriber.on("message", (channel, msg) => __awaiter(void 0, void 0, void 0, function* () {
    if (channel !== CHAT_INCOMING)
        return;
    try {
        const data = JSON.parse(msg);
        console.log("Main server received:", data);
        // Save message to MongoDB
        const newMessage = yield mesages_schema_1.Message.create(data);
        // Re-publish saved message so socket servers can broadcast
        yield redisClient_1.redisPublisher.publish(CHAT_SAVED, JSON.stringify(newMessage));
    }
    catch (err) {
        if (err instanceof Error)
            console.error("❌ Error saving message to DB:", err.message);
        else
            console.error("❌ Unknown error saving message to DB:", err);
    }
}));
