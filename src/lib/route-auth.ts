import { NextRequest } from "next/server";
import { getUserIdFromRequest } from "@/lib/auth";

export function requireUserId(request: NextRequest) {
  return getUserIdFromRequest(request);
}

