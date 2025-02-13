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
    return HttpResponse.json([
      {
        wish: "test!",
        time: "2025-02-12T12:00:00.000Z",
      },
      {
        wish: "x".repeat(255),
        time: "2025-02-11T11:23:45.000Z",
      },
      {
        wish: "y".repeat(5),
        time: "2025-02-10T10:12:34.000Z",
      },
      {
        wish: "test5 ".repeat(42),
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
        time: "2025-02-02T02:53:17.000Z",
      },
      {
        wish: "test11",
        time: "2025-02-01T01:42:06.000Z",
      },
      {
        wish: "test12",
        time: "2025-01-31T12:31:55.000Z",
      },
      {
        wish: "test13",
        time: "2025-01-30T11:20:44.000Z",
      },
    ]);
  })
);
