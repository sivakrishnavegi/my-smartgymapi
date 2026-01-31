import { createGoogleMeetEvent } from "../controllers/googleMeetControler";
import GoogleMeetEvent from "@collaboration/models/GoogleMeetSchema";
import User from "@iam/models/users.schema";

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

const meetQuery = createMockQuery();
const userQuery = createMockQuery();

jest.mock("@collaboration/models/GoogleMeetSchema", () => ({
    __esModule: true,
    default: {
        create: jest.fn().mockResolvedValue({ eventId: "g1", meetLink: "http://meet.google.com/abc" }),
        findOne: jest.fn(() => meetQuery)
    }
}));

jest.mock("@iam/models/users.schema", () => ({
    __esModule: true,
    default: {
        findById: jest.fn(() => userQuery),
    },
}));

jest.mock('@shared/utils/errorLogger', () => ({
    logError: jest.fn()
}));

describe("GoogleMeetController", () => {
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

    describe("createGoogleMeetEvent", () => {
        it("should create a meet event", async () => {
            userQuery.exec.mockResolvedValue({
                _id: "u1",
                account: { google: { accessToken: "token123" } }
            });
            meetQuery.exec.mockResolvedValue(null); // No clash

            // Mock fetch for Google API
            global.fetch = jest.fn().mockResolvedValue({
                ok: true,
                json: jest.fn().mockResolvedValue({ id: "g1", hangoutLink: "http://meet.google.com/abc" })
            } as any);

            req.body = {
                title: "Team Sync",
                start: { dateTime: "2025-01-01T10:00:00Z" },
                end: { dateTime: "2025-01-01T11:00:00Z" }
            };

            await createGoogleMeetEvent(req, res);

            expect(GoogleMeetEvent.create).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, meetLink: "http://meet.google.com/abc" }));
        });

        it("should return 409 if there is a clash", async () => {
            userQuery.exec.mockResolvedValue({ _id: "u1", account: { google: { accessToken: "token123" } } });
            meetQuery.exec.mockResolvedValue({ _id: "existing1" }); // Clash exists

            req.body = {
                title: "Team Sync",
                start: { dateTime: "2025-01-01T10:00:00Z" },
                end: { dateTime: "2025-01-01T11:00:00Z" }
            };

            await createGoogleMeetEvent(req, res);
            expect(res.status).toHaveBeenCalledWith(409);
        });
    });
});
