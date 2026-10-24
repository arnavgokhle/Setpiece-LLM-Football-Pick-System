import { NextResponse } from "next/server";
import { getResend, FROM_ADDRESS } from "@/lib/resend";

export async function GET() {
  const keyPresent = !!process.env.RESEND_API_KEY;
  const keyPrefix = process.env.RESEND_API_KEY?.slice(0, 8) ?? "missing";

  try {
    const { data, error } = await getResend().emails.send({
      from: FROM_ADDRESS,
      to: "support@setpiecepicks.com",
      subject: "Setpiece email test",
      html: "<p>Test email — Resend is working.</p>",
    });

    return NextResponse.json({ ok: !error, keyPresent, keyPrefix, data, error });
  } catch (err) {
    return NextResponse.json({ ok: false, keyPresent, keyPrefix, exception: String(err) });
  }
}
