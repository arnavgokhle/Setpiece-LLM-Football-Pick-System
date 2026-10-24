import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(req: NextRequest) {
  try {
    const { email, country } = await req.json();

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    }

    const supabase = createServiceClient();
    const { error } = await supabase
      .from("waitlist")
      .insert({ email: email.toLowerCase().trim(), country: country ?? "US" });

    if (error) {
      if (error.code === "23505") {
        // Duplicate — treat as success so we don't leak whether email exists
        return NextResponse.json({ ok: true });
      }
      throw error;
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[Waitlist API]", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
