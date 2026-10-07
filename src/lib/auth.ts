import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { requireJwtSecret } from "./jwt-secret";

export async function createToken(payload: { userId: string; email: string }) {
  return jwt.sign(payload, requireJwtSecret(), { expiresIn: "7d" });
}

export async function getAuthUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("itera_token")?.value;
    if (!token) return null;
    const decoded = jwt.verify(token, requireJwtSecret()) as {
      userId: string;
      email: string;
    };
    return decoded;
  } catch {
    return null;
  }
}