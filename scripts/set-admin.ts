import "dotenv/config";
import { db } from "../src/lib/db";

// Uso: npm run make-admin -- email@exemplo.com

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email) {
    console.error("Uso: npm run make-admin -- email@exemplo.com");
    process.exitCode = 1;
    return;
  }

  const user = await db.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`Nenhum usuário encontrado com o e-mail ${email}. Crie a conta pelo site primeiro.`);
    process.exitCode = 1;
    return;
  }

  await db.user.update({ where: { id: user.id }, data: { isAdmin: true } });
  console.log(`${user.name} (${email}) agora é administrador.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
