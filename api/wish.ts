import { createClient } from "@supabase/supabase-js";
import { Redis } from "@upstash/redis";

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

export async function GET(): Promise<Response> {
  const { data: wishes, error } = await supabase
    .from("wishes")
    .select("wish, created_at")
    .order("created_at", { ascending: false });

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
  }));

  return Response.json(wishesReponse, { status: 200 });
}

export async function POST(req: Request): Promise<Response> {
  const ipAddress = extractOriginalIp(req.headers.get("x-forwarded-for"));

  if (!ipAddress) {
    return Response.json({ error: "Missing IP address" }, { status: 400 });
  }

  try {
    const ipCount = await redis.incr(ipAddress);
    if (ipCount === 1) {
      await redis.expire(ipAddress, 60);
    }

    if (ipCount > 10) {
      return Response.json({ error: "Rate limit exceeded" }, { status: 429 });
    }
  } catch (err) {
    return Response.json(
      { error: "Service unavailable, sorry!" },
      { status: 503 }
    );
  }

  let wish: FormDataEntryValue | null;
  try {
    const formData = await req.formData();
    wish = formData.get("wish");
  } catch (err) {
    console.error(new Error("Invalid form data", { cause: err }));

    return Response.json({ error: "Invalid form data" }, { status: 400 });
  }

  if (typeof wish !== "string") {
    return Response.json({ error: "Missing wish field" }, { status: 400 });
  }

  if (wish.length < 5 || wish.length > 255) {
    return Response.json(
      { error: "Wish must be between 5 and 255 characters" },
      { status: 400 }
    );
  }

  if (wish === "test!") {
    Response.json({ wish }, { status: 201 });
  }

  const { error } = await supabase
    .from("wishes")
    .insert({ wish, ip: ipAddress });

  if (error) {
    console.error(new Error("Database error", { cause: error }));

    return Response.json(
      { error: "Service unavailable, sorry!" },
      { status: 503 }
    );
  }

  return Response.json({ wish }, { status: 201 });
}
