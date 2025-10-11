import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';
    const role = searchParams.get('role') || 'all';

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (role !== 'all') {
      where.isAdmin = role === 'admin';
    }

    const users = await prisma.user.findMany({
      where,
      include: {
        registrations: {
          include: {
            league: true,
            division: true
          }
        },
        _count: {
          select: {
            matchesAsPlayer1: true,
            matchesAsPlayer2: true,
            matchesAsPlayer3: true,
            matchesAsPlayer4: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Format users data
    const formattedUsers = users.map(user => {
      const totalMatches =
        user._count.matchesAsPlayer1 +
        user._count.matchesAsPlayer2 +
        (user._count.matchesAsPlayer3 || 0) +
        (user._count.matchesAsPlayer4 || 0);

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        skillLevel: user.skillLevel,
        phoneNumber: user.phoneNumber,
        createdAt: user.createdAt,
        leagues: user.registrations.map(reg => ({
          id: reg.league.id,
          name: reg.league.name,
          division: reg.division?.name || 'N/A',
          status: reg.status
        })),
        totalMatches,
        activeLeagues: user.registrations.filter(r => r.status === 'CONFIRMED').length
      };
    });

    return NextResponse.json({ users: formattedUsers });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { userId, updates } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updates
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Don't allow deleting yourself
    if (userId === session.user.id) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
    }

    await prisma.user.delete({
      where: { id: userId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}