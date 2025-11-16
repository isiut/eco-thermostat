// app/api/bookings/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { roomId, userName, userEmail, date, startTime, endTime, purpose } = body;

    // Validate required fields
    if (!roomId || !userName || !userEmail || !date || !startTime) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if slot is already booked
    const existingBooking = await prisma.booking.findFirst({
      where: {
        roomId,
        date: new Date(date),
        startTime,
        status: 'confirmed'
      }
    });

    if (existingBooking) {
      return NextResponse.json(
        { error: 'This time slot is already booked' },
        { status: 409 }
      );
    }

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        roomId,
        userName,
        userEmail,
        date: new Date(date),
        startTime,
        endTime: endTime || startTime, // If no end time, assume 1 hour
        purpose: purpose || '',
        status: 'confirmed'
      },
      include: {
        room: {
          include: {
            building: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      booking: {
        id: booking.id,
        roomName: booking.room.name,
        building: booking.room.building.name,
        date: booking.date,
        startTime: booking.startTime,
        endTime: booking.endTime,
        userName: booking.userName
      }
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    return NextResponse.json(
      { error: 'Failed to create booking' },
      { status: 500 }
    );
  }
}

// Get bookings
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const roomId = searchParams.get('roomId');
    const date = searchParams.get('date');

    const bookings = await prisma.booking.findMany({
      where: {
        ...(roomId && { roomId }),
        ...(date && { date: new Date(date) }),
        status: 'confirmed'
      },
      include: {
        room: {
          include: {
            building: true
          }
        }
      },
      orderBy: {
        date: 'asc'
      }
    });

    return NextResponse.json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    );
  }
}