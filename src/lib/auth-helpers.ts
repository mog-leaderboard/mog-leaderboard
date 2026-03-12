import { adminAuth } from "./firebase-admin";
import { NextRequest } from "next/server";

export async function verifyAuth(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }
  try {
    const token = authHeader.split("Bearer ")[1];
    return await adminAuth.verifyIdToken(token);
  } catch {
    return null;
  }
}
