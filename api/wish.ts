import { createClient } from "@supabase/supabase-js";
import { Redis } from "@upstash/redis";
import fs from "node:fs";
import path from "node:path";
const KNOWN_TOOLS = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "tools.json"), "utf-8")
) as string[];

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  throw new Error("SUPABASE_URL and SUPABASE_ANON_KEY must be set");
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

if (
  !process.env.UPSTASH_REDIS_KV_REST_API_URL ||
  !process.env.UPSTASH_REDIS_KV_REST_API_TOKEN
) {
  throw new Error(
    "UPSTASH_REDIS_KV_REST_API_URL and UPSTASH_REDIS_KV_REST_API_TOKEN must be set"
  );
}

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_KV_REST_API_URL,
  token: process.env.UPSTASH_REDIS_KV_REST_API_TOKEN,
});

function extractOriginalIp(xForwardedFor: string | null): string | null {
  if (!xForwardedFor) {
    return null;
  }

  return xForwardedFor.split(",")[0].trim();
}

export async function GET(req: Request): Promise<Response> {
  const searchParams = new URL(req.url).searchParams;
  const limit = searchParams.get("limit");
  const cursor = searchParams.get("cursor");

  if (limit !== null && isNaN(Number(limit))) {
    console.warn(`Invalid limit: ${limit}`);

    return Response.json({ error: "Invalid limit" }, { status: 400 });
  }

  if (cursor !== null && isNaN(Number(cursor))) {
    console.warn(`Invalid cursor: ${cursor}`);

    return Response.json({ error: "Invalid cursor" }, { status: 400 });
  }

  const createdAt = cursor !== null ? new Date(Number(cursor)) : new Date();
  const { data: wishes, error } = await supabase
    .from("wishes")
    .select("wish, created_at, country, tool")
    .order("created_at", { ascending: false })
    .lt("created_at", createdAt.toISOString())
    .limit(limit !== null ? Number(limit) : 10);

  if (error) {
    console.error(new Error("Database error", { cause: error }));

    return Response.json(
      { error: "Service unavailable, sorry!" },
      { status: 503 }
    );
  }

  const wishesReponse = wishes.map((wish) => ({
    wish: wish.wish,
    time: wish.created_at,
    country: wish.country,
    tool: wish.tool,
  }));

  return Response.json(wishesReponse, { status: 200 });
}

export async function POST(req: Request): Promise<Response> {
  const ipAddress = extractOriginalIp(req.headers.get("x-forwarded-for"));

  if (!ipAddress) {
    console.warn("Missing IP address");

    return Response.json({ error: "Missing IP address" }, { status: 400 });
  }

  try {
    const ipCount = await redis.incr(ipAddress);
    if (ipCount === 1) {
      await redis.expire(ipAddress, 60);
    }

    if (ipCount > 10) {
      console.warn(`Rate limit exceeded for IP: ${ipAddress}`);
      return Response.json({ error: "Rate limit exceeded" }, { status: 429 });
    }
  } catch (err) {
    console.error(new Error("Redis error", { cause: err }));

    return Response.json(
      { error: "Service unavailable, sorry!" },
      { status: 503 }
    );
  }

  let wish: FormDataEntryValue | null;
  let tool: FormDataEntryValue | null;
  try {
    const formData = await req.formData();
    wish = formData.get("wish");
    tool = formData.get("tool");
  } catch (err) {
    console.error(new Error("Invalid form data", { cause: err }));

    return Response.json({ error: "Invalid form data" }, { status: 400 });
  }

  if (typeof wish !== "string") {
    console.warn(`Missing wish field: ${wish}`);

    return Response.json({ error: "Missing wish field" }, { status: 400 });
  }

  if (wish.length < 5 || wish.length > 255) {
    console.warn(`Invalid wish length: ${wish.length}`);

    return Response.json(
      { error: "Wish must be between 5 and 255 characters" },
      { status: 400 }
    );
  }

  if (typeof tool !== "string") {
    console.warn(`Missing tool field: ${tool}`);

    return Response.json({ error: "Missing tool field" }, { status: 400 });
  }

  if (!KNOWN_TOOLS.includes(tool)) {
    console.warn(`Unknown tool: ${tool}`);

    return Response.json(
      { error: "What's that, I don't know this tool!" },
      { status: 400 }
    );
  }

  if (wish === "test!") {
    console.info("Test wish, skipping");

    return Response.json({ wish }, { status: 201 });
  }

  const country = req.headers.get("X-Vercel-IP-Country");

  const { error } = await supabase
    .from("wishes")
    .insert({ wish, ip: ipAddress, country, tool });

  if (error) {
    console.error(new Error("Database error", { cause: error }));

    return Response.json(
      { error: "Service unavailable, sorry!" },
      { status: 503 }
    );
  }

  return Response.json({ wish }, { status: 201 });
}
