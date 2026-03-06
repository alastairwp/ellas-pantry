import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2] || "admin@ellaspantry.co.uk";
  const password = process.argv[3] || "admin123456";

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: { role: "admin", passwordHash },
    create: {
      email,
      name: "Admin",
      passwordHash,
      role: "admin",
    },
  });

  console.log(`Admin user created/updated: ${user.email} (id: ${user.id})`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
