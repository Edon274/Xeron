import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSessionToken, getSessionCookieConfig, hashPassword } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const email = body.email?.toString().trim().toLowerCase();
  const password = body.password?.toString();
  const name = body.name?.toString().trim() || null;

  if (!email || !password || password.length < 8) {
    return NextResponse.json({ error: "Email und Passwort (mind. 8 Zeichen) sind erforderlich." }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Email bereits registriert." }, { status: 409 });
  }

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: hashPassword(password),
      name,
    },
  });

  const token = createSessionToken(user.id);
  const response = NextResponse.json({ ok: true, user: { id: user.id, email: user.email, name: user.name } });
  response.cookies.set(getSessionCookieConfig().name, token, getSessionCookieConfig());
  return response;
}

