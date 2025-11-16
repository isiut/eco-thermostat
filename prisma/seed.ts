import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create Buildings
  const scienceCenter = await prisma.building.upsert({
    where: { name: 'Science Center' },
    update: {},
    create: {
      name: 'Science Center',
      address: '555 N Sheridan Rd',
    },
  });

  const library = await prisma.building.upsert({
    where: { name: 'Library' },
    update: {},
    create: {
      name: 'Library',
      address: '100 Library Ln',
    },
  });

  const techHub = await prisma.building.upsert({
    where: { name: 'Tech Hub' },
    update: {},
    create: {
      name: 'Tech Hub',
      address: '200 Tech Dr',
    },
  });

  const musicBuilding = await prisma.building.upsert({
    where: { name: 'Music Building' },
    update: {},
    create: {
      name: 'Music Building',
      address: '300 Music Ave',
    },
  });

  const artsBuilding = await prisma.building.upsert({
    where: { name: 'Arts Building' },
    update: {},
    create: {
      name: 'Arts Building',
      address: '400 Arts St',
    },
  });

  console.log('✅ Buildings created');

  // Create Rooms
  const rooms = [
    {
      name: 'SCI 201',
      buildingId: scienceCenter.id,
      capacity: 30,
      cleanlinessScore: 9.2,
      sustainabilityScore: 8.8,
      energyEfficiency: 'A+',
      costScore: 7.5,
      features: ['Natural Light', 'Smart Thermostat', 'LED Lighting'],
    },
    {
      name: 'SCI 105',
      buildingId: scienceCenter.id,
      capacity: 35,
      cleanlinessScore: 8.7,
      sustainabilityScore: 8.5,
      energyEfficiency: 'A',
      costScore: 7.8,
      features: ['LED Lighting', 'Smart Thermostat', 'Low-Flow Fixtures'],
    },
    {
      name: 'LIB 104',
      buildingId: library.id,
      capacity: 50,
      cleanlinessScore: 8.9,
      sustainabilityScore: 9.5,
      energyEfficiency: 'A+',
      costScore: 8.2,
      features: ['Solar Panels', 'Motion Sensors', 'Recycled Materials'],
    },
    {
      name: 'TECH 150',
      buildingId: techHub.id,
      capacity: 40,
      cleanlinessScore: 9.5,
      sustainabilityScore: 9.8,
      energyEfficiency: 'A++',
      costScore: 9.1,
      features: ['Smart Thermostat', 'Air Quality Monitor', 'Energy Dashboard'],
    },
    {
      name: 'MUS 301',
      buildingId: musicBuilding.id,
      capacity: 20,
      cleanlinessScore: 7.8,
      sustainabilityScore: 6.5,
      energyEfficiency: 'B',
      costScore: 6.0,
      features: ['Soundproof', 'Standard HVAC'],
    },
    {
      name: 'ART 205',
      buildingId: artsBuilding.id,
      capacity: 25,
      cleanlinessScore: 8.0,
      sustainabilityScore: 7.2,
      energyEfficiency: 'B+',
      costScore: 5.8,
      features: ['Natural Light', 'High Ceilings'],
    },
  ];

  for (const room of rooms) {
    await prisma.room.upsert({
      where: {
        name_buildingId: {
          name: room.name,
          buildingId: room.buildingId,
        },
      },
      update: {},
      create: room,
    });
  }

  console.log('✅ Rooms created');
  console.log('🎉 Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });