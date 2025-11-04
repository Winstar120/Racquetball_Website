import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all leagues with their registrations
    const leagues = await prisma.league.findMany({
      include: {
        divisions: true,
        registrations: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                skillLevel: true,
              }
            },
            division: true,
          },
          orderBy: {
            registrationDate: 'desc'
          }
        }
      },
      orderBy: {
        startDate: 'desc'
      }
    });

    return NextResponse.json({ leagues });
  } catch (error) {
    console.error('Error fetching league members:', error);
    return NextResponse.json(
      { error: 'Failed to fetch league members' },
      { status: 500 }
    );
  }
}
