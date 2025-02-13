import { http, HttpResponse } from "msw";
import { setupWorker } from "msw/browser";

export const worker = setupWorker(
  http.post("/api/wish", () => {
    return HttpResponse.json({
      wish: "test!",
      time: "2025-02-12T12:00:00.000Z",
    });
  }),
  http.get("/api/wish", () => {
    if (Math.random() < 0.2) {
      return HttpResponse.json(
        {
          error: "Rate limit exceeded",
        },
        { status: 503 }
      );
    }

    if (Math.random() < 0.1) {
      return HttpResponse.json([]);
    }

    return HttpResponse.json([
      {
        wish: "test1",
        time: "2025-02-12T12:00:00.000Z",
      },
      {
        wish: "test3".repeat(51),
        time: "2025-02-11T11:23:45.000Z",
      },
      {
        wish: "test3",
        time: "2025-02-10T10:12:34.000Z",
      },
      {
        wish: "test4 ".repeat(42),
        time: "2025-02-09T09:01:23.000Z",
      },
      {
        wish: "test5",
        time: "2025-02-08T08:50:12.000Z",
      },
      {
        wish: "test6",
        time: "2025-02-07T07:39:01.000Z",
      },
      {
        wish: "test7",
        time: "2025-02-06T06:28:50.000Z",
      },
      {
        wish: "test8",
        time: "2025-02-05T05:17:39.000Z",
      },
      {
        wish: "test9",
        time: "2025-02-03T03:04:28.000Z",
      },
      {
        wish: "test10",
        time: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
      },
    ]);
  })
);
