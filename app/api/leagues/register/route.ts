import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendLeagueRegistrationConfirmation } from "@/lib/email";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const { leagueId, divisionLevel } = await request.json();

    // Check if league exists and registration is open
    const league = await prisma.league.findUnique({
      where: { id: leagueId },
      include: { divisions: true }
    });

    if (!league) {
      return NextResponse.json(
        { error: "League not found" },
        { status: 404 }
      );
    }

    const now = new Date();
    if (now < new Date(league.registrationOpens) || now > new Date(league.registrationCloses)) {
      return NextResponse.json(
        { error: "Registration is not open for this league" },
        { status: 400 }
      );
    }

    // Check if user is already registered
    const existingRegistration = await prisma.leagueRegistration.findUnique({
      where: {
        userId_leagueId: {
          userId: session.user.id,
          leagueId: leagueId
        }
      }
    });

    if (existingRegistration) {
      return NextResponse.json(
        { error: "You are already registered for this league" },
        { status: 400 }
      );
    }

    // Find the division
    const division = league.divisions.find(d => d.level === divisionLevel);
    if (!division) {
      return NextResponse.json(
        { error: "Invalid division selected" },
        { status: 400 }
      );
    }

    // Update user's skill level
    await prisma.user.update({
      where: { id: session.user.id },
      data: { skillLevel: divisionLevel }
    });

    // Create registration - if league is free, automatically mark as paid
    const registration = await prisma.leagueRegistration.create({
      data: {
        userId: session.user.id,
        leagueId: leagueId,
        divisionId: division.id,
        status: 'CONFIRMED',
        paymentStatus: league.isFree ? 'PAID' : 'UNPAID'
      }
    });

    // Get user details for email
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    // Send registration confirmation email
    if (user && user.emailNotifications) {
      try {
        await sendLeagueRegistrationConfirmation(
          user,
          league,
          division.id
        );
      } catch (emailError) {
        console.error("Failed to send registration email:", emailError);
        // Don't fail the registration if email fails
      }
    }

    return NextResponse.json({ registration });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Failed to register for league" },
      { status: 500 }
    );
  }
}