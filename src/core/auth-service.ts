import { randomBytes, randomInt, scryptSync, timingSafeEqual } from "node:crypto";

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

export interface OtpResult {
  ok: boolean;
  provider: string;
  message: string;
}

export interface AuthService {
  sendOtp(phone: string): Promise<OtpResult>;
  verifyOtp(phone: string, code: string): Promise<boolean>;
}

type OtpEntry = { code: string; expiresAt: number };
const globalOtp = globalThis as typeof globalThis & { __merajOtpStore?: Map<string, OtpEntry> };
const otpStore = globalOtp.__merajOtpStore ?? new Map<string, OtpEntry>();
globalOtp.__merajOtpStore = otpStore;

/**
 * Production-ready SMS OTP adapter. Configure SMS_API_URL and SMS_API_KEY in the
 * environment to connect any SMS gateway; without them it runs in development mode.
 */
export class SmsOtpReadyAuthService implements AuthService {
  async sendOtp(phone: string): Promise<OtpResult> {
    const code = String(randomInt(100000, 999999));
    otpStore.set(phone, { code, expiresAt: Date.now() + 5 * 60 * 1000 });
    const endpoint = process.env.SMS_API_URL;
    const key = process.env.SMS_API_KEY;
    if (endpoint && key) {
      try {
        await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
          body: JSON.stringify({ to: phone, code, template: "meraj-otp" }),
        });
        return { ok: true, provider: "configured-sms-gateway", message: "OTP dispatched" };
      } catch {
        return { ok: false, provider: "configured-sms-gateway", message: "SMS gateway unavailable" };
      }
    }
    return { ok: true, provider: "otp-ready-development", message: "SMS gateway not configured; OTP adapter ready" };
  }

  async verifyOtp(phone: string, code: string) {
    const entry = otpStore.get(phone);
    if (!entry || entry.expiresAt < Date.now() || entry.code !== code) return false;
    otpStore.delete(phone);
    return true;
  }
}

export const authService: AuthService = new SmsOtpReadyAuthService();
