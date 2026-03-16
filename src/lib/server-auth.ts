import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getUserIdFromCookieStore } from "@/lib/auth";

export async function requireServerUserId() {
  const cookieStore = await cookies();
  const userId = getUserIdFromCookieStore(cookieStore);
  if (!userId) {
    redirect("/login");
  }
  return userId;
}

