import { PrismaClient } from "@prisma/client";
import { USERS, PRODUCTS } from "./mock.js";

const prisma = new PrismaClient();

//npx prisma db seed
async function main() {
  // 기존 데이터 삭제
  await prisma.user.deleteMany();
  await prisma.product.deleteMany();

  // 목 데이터 삽입
  await prisma.user.createMany({
    data: USERS,
    skipDuplicates: true,
  });

  await prisma.product.createMany({
    data: PRODUCTS,
    skipDuplicates: true,
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
