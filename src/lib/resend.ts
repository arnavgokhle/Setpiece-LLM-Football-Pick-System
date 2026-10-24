import { Resend } from "resend";

export const FROM_ADDRESS = "Scout <scout@setpiecepicks.com>";
export const SUPPORT_EMAIL = "support@setpiecepicks.com";

let _resend: Resend | null = null;

export function getResend(): Resend {
  if (!_resend) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error("[resend] RESEND_API_KEY is not set");
    }
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}
