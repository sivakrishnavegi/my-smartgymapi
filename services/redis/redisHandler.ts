import { Message } from "../../models/mesages.schema";
import { redisSubscriber, redisPublisher } from "./redisClient";

const CHAT_INCOMING = "chat_incoming";
const CHAT_SAVED = "chat_saved";

// Interface for incoming chat message
interface ChatMessage {
[key: string]: any; // Replace with strict typing if desired
}

// Subscribe to chat_incoming channel
(async () => {
try {
const count = await redisSubscriber.subscribe(CHAT_INCOMING);
console.log(`📡 Subscribed to ${count} Redis channel(s) for chat`);
} catch (err) {
console.error("❌ Redis subscribe error:", err);
}
})();

// Listen for incoming messages from socket server
redisSubscriber.on("message", async (channel: string, msg: string) => {
if (channel !== CHAT_INCOMING) return;

try {
const data: ChatMessage = JSON.parse(msg);
console.log("Main server received:", data);

// Save message to MongoDB
const newMessage = await Message.create(data);

// Re-publish saved message so socket servers can broadcast
await redisPublisher.publish(CHAT_SAVED, JSON.stringify(newMessage));

} catch (err: unknown) {
if (err instanceof Error) console.error("❌ Error saving message to DB:", err.message);
else console.error("❌ Unknown error saving message to DB:", err);
}
});