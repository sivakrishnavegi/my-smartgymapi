import { createEvent, getEvents } from "../controllers/eventController";
import Event from "@operational/models/event.model";
import User from "@iam/models/users.schema";
import calendar from "@shared/utils/google/googleCalendar";

// Helper for mocks
const createMockQuery = () => {
    const query: any = {
        exec: jest.fn(),
        populate: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        then: jest.fn(function (this: any, resolve: any) {
            return Promise.resolve(this.exec()).then(resolve);
        }),
    };
    return query;
};

const eventQuery = createMockQuery();
const userQuery = createMockQuery();

jest.mock("@operational/models/event.model", () => ({
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
        save: jest.fn().mockResolvedValue({ _id: "e1", title: "Test Event" })
    })) as any
}));
(Event as any).create = jest.fn().mockResolvedValue({ _id: "e1", title: "Test Event", save: jest.fn() });
(Event as any).find = jest.fn(() => eventQuery);

jest.mock("@iam/models/users.schema", () => ({
    __esModule: true,
    default: {
        findById: jest.fn(() => userQuery),
    },
}));

jest.mock("@shared/utils/google/googleCalendar", () => ({
    __esModule: true,
    default: {
        events: {
            insert: jest.fn().mockResolvedValue({ data: { id: "g1", htmlLink: "http://google.com/calendar" } })
        }
    },
    getGoogleCalendarClient: jest.fn()
}));

jest.mock('@shared/utils/errorLogger', () => ({
    logError: jest.fn()
}));

describe("EventController", () => {
    let req: any;
    let res: any;

    beforeEach(() => {
        jest.clearAllMocks();
        req = {
            body: {},
            user: { id: "u1" }
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
    });

    describe("createEvent", () => {
        it("should create an event and sync to google calendar", async () => {
            req.body = {
                title: "Annual Meet",
                startDate: "2025-01-01",
                endDate: "2025-01-02",
                description: "Test description"
            };

            await createEvent(req, res);

            expect(Event.create).toHaveBeenCalled();
            expect(calendar.events.insert).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });
    });

    describe("getEvents", () => {
        it("should fetch google calendar events if user has token", async () => {
            userQuery.exec.mockResolvedValue({
                _id: "u1",
                account: { google: { accessToken: "token123" } }
            });

            // Mock fetch for Google API
            global.fetch = jest.fn().mockResolvedValue({
                ok: true,
                json: jest.fn().mockResolvedValue({ items: [{ id: "ev1", summary: "Meeting" }] })
            } as any);

            await getEvents(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, data: expect.arrayContaining([expect.objectContaining({ id: "ev1" })]) }));
        });

        it("should return 400 if user has no google token", async () => {
            userQuery.exec.mockResolvedValue(null);
            await getEvents(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
        });
    });
});
