"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { createSession, destroySession, hashPassword, verifyPassword } from "@/lib/auth";

export async function registerAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!name || !email || password.length < 6) {
    redirect("/registro?erro=" + encodeURIComponent("Preencha nome, e-mail e uma senha com pelo menos 6 caracteres."));
  }

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    redirect("/registro?erro=" + encodeURIComponent("Já existe uma conta com esse e-mail."));
  }

  const passwordHash = await hashPassword(password);
  const user = await db.user.create({ data: { name, email, passwordHash } });
  await createSession(user.id);
  redirect("/listas");
}

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  const user = await db.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    redirect("/login?erro=" + encodeURIComponent("E-mail ou senha incorretos."));
  }

  await createSession(user.id);
  redirect("/listas");
}

export async function logoutAction() {
  await destroySession();
  redirect("/");
}
