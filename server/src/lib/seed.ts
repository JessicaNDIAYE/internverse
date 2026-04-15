import { prisma } from './prisma';

async function main() {
  const companies = [
    { name: 'TechNova', slogan: 'Innovate or die.' },
    { name: 'MegaCorp', slogan: 'We own the future.' },
    { name: 'StartupHive', slogan: 'Move fast, break things.' },
    { name: 'Synergy Inc.', slogan: 'Synergizing synergies.' },
    { name: 'Disruptify', slogan: 'Disruption is our product.' },
  ];

  for (const c of companies) {
    await prisma.company.upsert({
      where: { name: c.name },
      update: {},
      create: c,
    });
  }

  console.log('Seeded companies:', companies.map((c) => c.name).join(', '));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
