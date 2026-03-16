import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSessionToken, getSessionCookieConfig, verifyPassword } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const email = body.email?.toString().trim().toLowerCase();
  const password = body.password?.toString();

  if (!email || !password) {
    return NextResponse.json({ error: "Email und Passwort sind erforderlich." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return NextResponse.json({ error: "Ungueltige Zugangsdaten." }, { status: 401 });
  }

  const token = createSessionToken(user.id);
  const response = NextResponse.json({ ok: true, user: { id: user.id, email: user.email, name: user.name } });
  response.cookies.set(getSessionCookieConfig().name, token, getSessionCookieConfig());
  return response;
}

