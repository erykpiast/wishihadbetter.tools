import { createClient } from "@supabase/supabase-js";

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  throw new Error("SUPABASE_URL and SUPABASE_ANON_KEY must be set");
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export async function GET(): Promise<Response> {
  const { data: wishes, error } = await supabase.from("wishes").select("wish");

  if (error) {
    console.error(new Error("Database error", { cause: error }));

    return Response.json(
      { error: "Service unavailable, sorry!" },
      { status: 503 }
    );
  }

  return Response.json(wishes ?? [], { status: 200 });
}
export async function POST(req: Request): Promise<Response> {
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
  const { data, error } = await supabase.from("wishes").insert({ wish: wish });

  if (error) {
    console.error(new Error("Database error", { cause: error }));

    return Response.json(
      { error: "Service unavailable, sorry!" },
      { status: 503 }
    );
  }

  return Response.json({ data }, { status: 201 });
}
