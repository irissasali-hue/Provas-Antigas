import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?erro=" + encodeURIComponent("Entre na sua conta para acessar a área administrativa."));
  }
  if (!user.isAdmin) {
    redirect("/?erro=" + encodeURIComponent("Você não tem permissão para acessar essa página."));
  }
  return user;
}
