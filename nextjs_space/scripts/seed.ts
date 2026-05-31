import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('johndoe123', 12);

  await prisma.user.upsert({
    where: { email: 'john@doe.com' },
    update: {},
    create: {
      email: 'john@doe.com',
      name: 'Admin User',
      password: hashedPassword,
    },
  });

  // Seed RPM Benchmarks
  const rpmBenchmarks = [
    { niche: 'finanças', rpmConservative: 4, rpmAverage: 8, rpmAggressive: 15 },
    { niche: 'negócios', rpmConservative: 3, rpmAverage: 7, rpmAggressive: 12 },
    { niche: 'tecnologia', rpmConservative: 2, rpmAverage: 5, rpmAggressive: 10 },
    { niche: 'saúde', rpmConservative: 2, rpmAverage: 5, rpmAggressive: 9 },
    { niche: 'educação', rpmConservative: 1.5, rpmAverage: 4, rpmAggressive: 8 },
    { niche: 'luxo', rpmConservative: 2, rpmAverage: 5, rpmAggressive: 10 },
    { niche: 'crimes reais', rpmConservative: 1, rpmAverage: 3, rpmAggressive: 6 },
    { niche: 'curiosidades', rpmConservative: 0.8, rpmAverage: 2, rpmAggressive: 5 },
    { niche: 'entretenimento', rpmConservative: 0.5, rpmAverage: 1.5, rpmAggressive: 4 },
    { niche: 'espiritualidade', rpmConservative: 0.8, rpmAverage: 2.5, rpmAggressive: 6 },
    { niche: 'infantil', rpmConservative: 0.3, rpmAverage: 1, rpmAggressive: 3 },
    { niche: 'documentário', rpmConservative: 1, rpmAverage: 3, rpmAggressive: 7 },
    { niche: 'outro', rpmConservative: 0.5, rpmAverage: 2, rpmAggressive: 5 },
  ];

  for (const rpm of rpmBenchmarks) {
    await prisma.rPMBenchmark.upsert({
      where: {
        niche_country_language: {
          niche: rpm.niche,
          country: 'global',
          language: 'all',
        },
      },
      update: {
        rpmConservative: rpm.rpmConservative,
        rpmAverage: rpm.rpmAverage,
        rpmAggressive: rpm.rpmAggressive,
        sourceNote: 'Valores padrão estimados',
      },
      create: {
        niche: rpm.niche,
        country: 'global',
        language: 'all',
        rpmConservative: rpm.rpmConservative,
        rpmAverage: rpm.rpmAverage,
        rpmAggressive: rpm.rpmAggressive,
        sourceNote: 'Valores padrão estimados',
      },
    });
  }

  console.log('Seed completed successfully (users + RPM benchmarks)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
