// app/api/rooms/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');
    const building = searchParams.get('building');

    // Get all rooms with their buildings
    const rooms = await prisma.room.findMany({
      where: building ? {
        building: {
          name: building
        }
      } : undefined,
      include: {
        building: true,
        bookings: date ? {
          where: {
            date: new Date(date),
            status: 'confirmed'
          }
        } : false,
      },
    });

    // Calculate availability for each room
    const roomsWithAvailability = rooms.map(room => {
      const allSlots = [
        '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
        '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'
      ];

      const bookedSlots = room.bookings?.map(b => b.startTime) || [];
      const availableSlots = allSlots.filter(slot => !bookedSlots.includes(slot));

      return {
        id: room.id,
        name: room.name,
        building: room.building.name,
        capacity: room.capacity,
        cleanlinessScore: room.cleanlinessScore,
        sustainabilityScore: room.sustainabilityScore,
        energyEfficiency: room.energyEfficiency,
        costScore: room.costScore,
        features: room.features,
        availableSlots,
        available: availableSlots.length > 0,
        occupancy: `${Math.round((bookedSlots.length / allSlots.length) * 100)}%`
      };
    });

    return NextResponse.json(roomsWithAvailability);
  } catch (error) {
    console.error('Error fetching rooms:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rooms' },
      { status: 500 }
    );
  }
}