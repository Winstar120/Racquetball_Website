import nodemailer from 'nodemailer';
import type { User, Match, League, Division } from '@prisma/client';
import { prisma } from '@/lib/prisma';

type EmailTypeEnum = 'MATCH_REMINDER' | 'MAKEUP_NOTICE' | 'PASSWORD_RESET';
type EmailStatusEnum = 'SENT' | 'SKIPPED' | 'FAILED';

const EMAIL_TYPE = {
  MATCH_REMINDER: 'MATCH_REMINDER',
  MAKEUP_NOTICE: 'MAKEUP_NOTICE',
  PASSWORD_RESET: 'PASSWORD_RESET',
} as const satisfies Record<string, EmailTypeEnum>;

const EMAIL_STATUS = {
  SENT: 'SENT',
  SKIPPED: 'SKIPPED',
  FAILED: 'FAILED',
} as const satisfies Record<string, EmailStatusEnum>;

const transporter = process.env.SMTP_USER && process.env.SMTP_PASSWORD
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    })
  : null;

export interface MatchWithPlayers extends Match {
  player1: User;
  player2: User;
  player3?: User | null;
  player4?: User | null;
  court?: { name: string; location?: string | null } | null;
  league?: League | null;
}

export type EmailSendResult = { success: boolean; error?: unknown; skipped?: boolean };

async function recordEmailLog(params: {
  matchId?: string | null;
  recipientId: string;
  type: EmailTypeEnum;
  status: EmailStatusEnum;
  error?: unknown;
}) {
  const emailLogClient = prisma.emailLog;
  if (!emailLogClient) {
    console.warn('Email log client unavailable; skipping log write.');
    return;
  }

  try {
    await emailLogClient.create({
      data: {
        matchId: params.matchId ?? null,
        recipientId: params.recipientId,
        type: params.type,
        status: params.status,
        error: params.error ? (params.error instanceof Error ? params.error.message : String(params.error)) : null,
      },
    });
  } catch (logError) {
    console.error('Failed to record email log', logError);
  }
}

export async function sendPasswordResetEmail(
  user: User,
  resetUrl: string
): Promise<EmailSendResult> {
  const logBase = {
    matchId: null,
    recipientId: user.id,
    type: EMAIL_TYPE.PASSWORD_RESET,
  };

  if (!transporter) {
    console.warn('Email transporter not configured - skipping password reset email');
    await recordEmailLog({
      ...logBase,
      status: EMAIL_STATUS.SKIPPED,
      error: 'Transporter not configured',
    });
    return { success: false, skipped: true, error: 'Transporter not configured' };
  }

  const subject = 'Reset Your Racquetball League Password';
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #111827; background-color: #f9fafb; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 24px; background-color: #ffffff; }
        .header { text-align: center; padding-bottom: 16px; border-bottom: 1px solid #e5e7eb; }
        .header h1 { margin: 0; font-size: 24px; color: #111827; }
        .content { padding: 24px 0; }
        .button { display: inline-block; padding: 12px 24px; margin: 16px 0; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; }
        .footer { font-size: 12px; color: #6b7280; margin-top: 24px; border-top: 1px solid #e5e7eb; padding-top: 16px; }
        .reset-link { word-break: break-all; color: #2563eb; text-decoration: none; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Password Reset Requested</h1>
        </div>
        <div class="content">
          <p>Hi ${user.name || 'there'},</p>
          <p>We received a request to reset the password for your Racquetball League account. If you made this request, click the button below to choose a new password:</p>
          <p style="text-align: center;">
            <a class="button" href="${resetUrl}">Reset Password</a>
          </p>
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p><a class="reset-link" href="${resetUrl}">${resetUrl}</a></p>
          <p>This link will expire in 1 hour. If you did not request a password reset, you can safely ignore this email.</p>
        </div>
        <div class="footer">
          <p>You are receiving this email because a password reset was requested for your account.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
Password Reset Requested

Hi ${user.name || 'there'},

We received a request to reset the password for your Racquetball League account. If you made this request, use the link below to choose a new password:
${resetUrl}

This link will expire in 1 hour. If you did not request a password reset, you can safely ignore this email.
  `;

  try {
    await transporter.sendMail({
      from: `"Durango Racquetball Association" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: user.email,
      subject,
      text: textContent,
      html: htmlContent,
    });

    await recordEmailLog({
      ...logBase,
      status: EMAIL_STATUS.SENT,
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    await recordEmailLog({
      ...logBase,
      status: EMAIL_STATUS.FAILED,
      error,
    });
    return { success: false, error };
  }
}

export async function sendMatchReminder(
  match: MatchWithPlayers,
  recipientId: string
): Promise<EmailSendResult> {
  const logBase = {
    matchId: match.id,
    recipientId,
    type: EMAIL_TYPE.MATCH_REMINDER,
  };

  if (!transporter) {
    console.warn('Email transporter not configured - skipping email');
    await recordEmailLog({
      ...logBase,
      status: EMAIL_STATUS.SKIPPED,
      error: 'Transporter not configured',
    });
    return { success: false, skipped: true, error: 'Transporter not configured' };
  }
  const recipient = match.player1Id === recipientId ? match.player1 : match.player2;
  const opponent = match.player1Id === recipientId ? match.player2 : match.player1;

  const matchDate = new Date(match.scheduledTime);
  const formattedDate = matchDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const formattedTime = matchDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const courtInfo = match.court
    ? `${match.court.name}${match.court.location ? ` (${match.court.location})` : ''}`
    : 'TBD';

  const subject = `Match Reminder: You vs ${opponent.name} - ${formattedDate}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #2563eb; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px; }
        .match-details { background-color: white; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .detail-row { margin: 10px 0; padding: 10px; border-bottom: 1px solid #e5e7eb; }
        .detail-row:last-child { border-bottom: none; }
        .label { font-weight: bold; color: #6b7280; }
        .value { color: #111827; font-size: 16px; }
        .opponent-info { background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #fbbf24; }
        .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280; }
        .button { display: inline-block; padding: 10px 20px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px; margin-top: 10px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">Match Reminder</h1>
          <p style="margin: 5px 0; opacity: 0.9;">Your upcoming racquetball match</p>
        </div>

        <div class="content">
          <p>Hi ${recipient.name},</p>

          <p>This is a reminder about your upcoming racquetball match:</p>

          <div class="match-details">
            <div class="detail-row">
              <span class="label">Date:</span><br>
              <span class="value">${formattedDate}</span>
            </div>
            <div class="detail-row">
              <span class="label">Time:</span><br>
              <span class="value">${formattedTime}</span>
            </div>
            <div class="detail-row">
              <span class="label">Court:</span><br>
              <span class="value">${courtInfo}</span>
            </div>
          </div>

          <div class="opponent-info">
            <h3 style="margin-top: 0;">Your Opponent</h3>
            <p><strong>Name:</strong> ${opponent.name}</p>
            <p><strong>Phone:</strong> ${opponent.phone || 'Not provided'}</p>
            <p><strong>Email:</strong> ${opponent.email}</p>
            <p style="margin-bottom: 0; font-size: 14px; color: #6b7280;">
              Feel free to contact your opponent to confirm or if you need to reschedule.
            </p>
          </div>

          <p>Good luck with your match!</p>

          <div class="footer">
            <p>If you need to cancel or reschedule, please contact your opponent directly and notify the league administrator.</p>
            <p style="font-size: 12px;">You're receiving this email because you're registered for a racquetball league.
            To update your notification preferences, please log into your account.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
Match Reminder

Hi ${recipient.name},

This is a reminder about your upcoming racquetball match:

Date: ${formattedDate}
Time: ${formattedTime}
Court: ${courtInfo}

YOUR OPPONENT:
Name: ${opponent.name}
Phone: ${opponent.phone || 'Not provided'}
Email: ${opponent.email}

Feel free to contact your opponent to confirm or if you need to reschedule.

Good luck with your match!

---
If you need to cancel or reschedule, please contact your opponent directly and notify the league administrator.
  `;

  try {
    await transporter.sendMail({
      from: `"Durango Racquetball Association" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: recipient.email,
      subject,
      text: textContent,
      html: htmlContent,
    });

    console.log(`Match reminder sent to ${recipient.email}`);
    await recordEmailLog({
      ...logBase,
      status: EMAIL_STATUS.SENT,
    });
    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    await recordEmailLog({
      ...logBase,
      status: EMAIL_STATUS.FAILED,
      error,
    });
    return { success: false, error };
  }
}

export async function sendMakeupMatchNotification(
  match: MatchWithPlayers
): Promise<EmailSendResult[]> {
  const participants: User[] = [
    match.player1,
    match.player2,
    match.player3 ?? undefined,
    match.player4 ?? undefined,
  ].filter(Boolean) as User[];

  const recipients = participants.filter((player) => player.emailNotifications);

  if (recipients.length === 0) {
    return [];
  }

  if (!transporter) {
    await Promise.all(
      recipients.map((recipient) =>
        recordEmailLog({
          matchId: match.id,
          recipientId: recipient.id,
          type: EMAIL_TYPE.MAKEUP_NOTICE,
          status: EMAIL_STATUS.SKIPPED,
          error: 'Transporter not configured',
        })
      )
    );
    return recipients.map(() => ({
      success: false,
      skipped: true,
      error: 'Transporter not configured',
    }));
  }

  const results: EmailSendResult[] = [];

  for (const recipient of recipients) {
    const opponents = participants.filter((player) => player.id !== recipient.id);
    const opponentNames = opponents.map((player) => player.name).join(', ');

    const subject = `Action Needed: Schedule your match vs ${opponentNames}`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f59e0b; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px; }
          .match-details { background-color: white; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #fbbf24; }
          .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280; }
          .button { display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px; margin-top: 15px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">Court Availability Update</h1>
          </div>
          <div class="content">
            <p>Hi ${recipient.name},</p>
            <p>We couldn’t automatically reserve a court for your upcoming match in the ${match.league?.name ?? 'league'}.</p>
            <div class="match-details">
              <p><strong>Your Opponent(s):</strong> ${opponentNames}</p>
              <p><strong>Next Steps:</strong></p>
              <ul>
                <li>Coordinate directly with your opponent(s) to pick a day and time.</li>
                <li>Reserve an available court through the front desk.</li>
                <li>Update the league administrator once you’ve agreed on a time.</li>
              </ul>
            </div>
            <p>If you need assistance or a suggested time slot, reply to this email or contact the league administrator.</p>
            <div class="footer">
              <p>Thank you for being flexible—we appreciate your help in keeping the league running smoothly.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
Court Availability Update

Hi ${recipient.name},

We couldn’t automatically reserve a court for your upcoming match in the ${match.league?.name ?? 'league'}.

Opponent(s): ${opponentNames}

Next Steps:
- Coordinate directly with your opponent(s) to pick a day and time.
- Reserve an available court through the front desk.
- Let the league administrator know once the match is scheduled.

If you need assistance, reply to this email or contact the league administrator.
`;

    const logBase = {
      matchId: match.id,
      recipientId: recipient.id,
      type: EMAIL_TYPE.MAKEUP_NOTICE,
    };

    try {
      await transporter.sendMail({
        from: `"Durango Racquetball Association" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
        to: recipient.email,
        subject,
        text: textContent,
        html: htmlContent,
      });

      console.log(`Makeup match notification sent to ${recipient.email}`);
      await recordEmailLog({
        ...logBase,
        status: EMAIL_STATUS.SENT,
      });
      results.push({ success: true });
    } catch (error) {
      console.error('Error sending makeup match notification:', error);
      await recordEmailLog({
        ...logBase,
        status: EMAIL_STATUS.FAILED,
        error,
      });
      results.push({ success: false, error });
    }
  }

  return results;
}

export async function sendWelcomeEmail(user: User) {
  if (!transporter) {
    console.warn('Email transporter not configured - skipping email');
    return;
  }
  const subject = 'Welcome to the Durango Racquetball League!';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #2563eb; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px; margin-top: 15px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">Welcome to the Durango Racquetball League!</h1>
        </div>

        <div class="content">
          <p>Hi ${user.name},</p>

          <p>Thank you for joining our racquetball league community! We're excited to have you as a member.</p>

          <h3>What's Next?</h3>
          <ul>
            <li>Browse available leagues and register for upcoming sessions</li>
            <li>Update your profile with your skill level</li>
            <li>Check out the match schedule once you're registered</li>
          </ul>

          <p>Your account details:</p>
          <ul>
            <li><strong>Email:</strong> ${user.email}</li>
            <li><strong>Phone:</strong> ${user.phone || 'Not provided'}</li>
          </ul>

          <p>We'll use your phone number to send match reminders with your opponent's contact information before each game.</p>

          <a href="${process.env.NEXTAUTH_URL}/dashboard" class="button">Go to Dashboard</a>

          <p style="margin-top: 30px;">If you have any questions, feel free to reach out to us.</p>

          <p>See you on the court!</p>
          <p>- Durango Racquetball Association</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: `"Durango Racquetball Association" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: user.email,
      subject,
      html: htmlContent,
    });

    console.log(`Welcome email sent to ${user.email}`);
    return { success: true };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return { success: false, error };
  }
}

export async function sendBulkMatchReminders(matches: MatchWithPlayers[]) {
  if (!transporter) {
    console.warn('Email transporter not configured - skipping match reminders');
    return [];
  }

  const results: EmailSendResult[] = [];

  for (const match of matches) {
    // Send to both players
    if (match.player1.emailNotifications) {
      results.push(await sendMatchReminder(match, match.player1Id));
    }
    if (match.player2.emailNotifications) {
      results.push(await sendMatchReminder(match, match.player2Id));
    }
    if (match.player3 && match.player3Id && match.player3.emailNotifications) {
      results.push(await sendMatchReminder(match, match.player3Id));
    }
    if (match.player4 && match.player4Id && match.player4.emailNotifications) {
      results.push(await sendMatchReminder(match, match.player4Id));
    }
  }

  return results;
}

export async function sendScoreConfirmationRequest(
  match: MatchWithPlayers,
  reporterId: string,
  scores: { gameNumber: number; player1Score: number; player2Score: number; player3Score?: number; player4Score?: number }[]
) {
  if (!transporter) {
    console.warn('Email transporter not configured - skipping score confirmation email');
    return;
  }
  const reporter = match.player1Id === reporterId ? match.player1 : match.player2;
  const otherPlayer = match.player1Id === reporterId ? match.player2 : match.player1;

  const matchDate = new Date(match.scheduledTime);
  const confirmUrl = `${process.env.NEXTAUTH_URL}/matches/${match.id}/confirm?token=${Buffer.from(match.id + ':' + otherPlayer.id).toString('base64')}`;

  const subject = 'Please Confirm Match Score';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f59e0b; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px; }
        .score-table { width: 100%; border-collapse: collapse; margin: 20px 0; background-color: white; }
        .score-table th, .score-table td { padding: 10px; text-align: center; border: 1px solid #e5e7eb; }
        .score-table th { background-color: #f3f4f6; font-weight: bold; }
        .button { display: inline-block; padding: 12px 24px; background-color: #10b981; color: white; text-decoration: none; border-radius: 5px; margin: 15px 5px; }
        .button.dispute { background-color: #ef4444; }
        .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">Score Confirmation Required</h1>
        </div>

        <div class="content">
          <p>Hi ${otherPlayer.name},</p>

          <p>${reporter.name} has reported the following scores for your match on ${matchDate.toLocaleDateString()}:</p>

          <table class="score-table">
            <thead>
              <tr>
                <th>Game</th>
                <th>${match.player1.name}</th>
                <th>${match.player2.name}</th>
                ${match.player3 ? `<th>${match.player3.name}</th>` : ''}
                ${match.player4 ? `<th>${match.player4.name}</th>` : ''}
              </tr>
            </thead>
            <tbody>
              ${scores.map(game => `
                <tr>
                  <td>Game ${game.gameNumber}</td>
                  <td>${game.player1Score}</td>
                  <td>${game.player2Score}</td>
                  ${game.player3Score !== undefined ? `<td>${game.player3Score}</td>` : ''}
                  ${game.player4Score !== undefined ? `<td>${game.player4Score}</td>` : ''}
                </tr>
              `).join('')}
            </tbody>
          </table>

          <p>Please confirm these scores are correct:</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${confirmUrl}" class="button">Confirm Scores</a>
            <a href="${process.env.NEXTAUTH_URL}/matches/${match.id}" class="button dispute">Dispute Scores</a>
          </div>

          <div class="footer">
            <p>If you have any disputes about the scores, please contact the league administrator.</p>
            <p style="font-size: 12px;">This confirmation link will expire in 48 hours.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: `"Durango Racquetball Association" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: otherPlayer.email,
      subject,
      html: htmlContent,
    });

    console.log(`Score confirmation request sent to ${otherPlayer.email}`);
    return { success: true };
  } catch (error) {
    console.error('Error sending score confirmation email:', error);
    return { success: false, error };
  }
}

export async function sendLeagueRegistrationConfirmation(
  user: User,
  league: League & { divisions: Division[]; _count?: { registrations: number; matches: number }; scheduleGenerated?: boolean },
  divisionId: string
) {
  if (!transporter) {
    console.warn('Email transporter not configured - skipping league registration confirmation email');
    return;
  }
  const division = league.divisions.find(d => d.id === divisionId);
  const divisionLabel = division
    ? division.level === 'N/A'
      ? 'All skill levels'
      : division.name
    : 'TBD';
  const subject = `Registration Confirmed - ${league.name}`;
  const formatLeagueDate = (value: Date | string | null | undefined) => {
    if (!value) return 'Pending';
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? 'Pending' : parsed.toLocaleDateString();
  };
  const sanitizeHtml = (value: string | null | undefined) =>
    value
      ? value
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;')
      : '';
  const descriptionHtml = sanitizeHtml(league.description ?? '');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #10b981; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px; }
        .details { background-color: white; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #10b981; }
        .button { display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px; margin-top: 15px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">Registration Confirmed!</h1>
        </div>

        <div class="content">
          <p>Hi ${user.name},</p>

          <p>Your registration for the following league has been confirmed:</p>

          <div class="details">
            <h3 style="margin-top: 0; color: #10b981;">League Details</h3>
            <p><strong>League:</strong> ${league.name}</p>
            <p><strong>Division:</strong> ${divisionLabel}</p>
            <p><strong>Start Date:</strong> ${formatLeagueDate(league.startDate)}</p>
            <p><strong>End Date:</strong> ${formatLeagueDate(league.endDate)}</p>
            <p><strong>Game Type:</strong> ${league.gameType}</p>
            <p><strong>League Fee:</strong> ${league.isFree ? 'FREE' : `$${league.leagueFee?.toFixed(2) || '0.00'}`}</p>
          </div>

          <div class="details">
            <h3 style="margin-top: 0; color: #10b981;">Overview</h3>
            <p><strong>Ranking Method:</strong> ${league.rankingMethod === 'BY_POINTS' ? 'By Points' : 'By Wins'}</p>
            <p><strong>Players per Match:</strong> ${league.playersPerMatch}</p>
            <p><strong>Registrations:</strong> ${league._count?.registrations ?? 'TBD'}</p>
            <p><strong>Matches Scheduled:</strong> ${league._count?.matches ?? 'TBD'}</p>
            <p><strong>Schedule Generated:</strong> ${league.scheduleGenerated ? 'Yes' : 'Not yet'}</p>
          </div>

          ${
            descriptionHtml
              ? `
          <div class="details">
            <h3 style="margin-top: 0; color: #10b981;">League Overview</h3>
            <p style="white-space: pre-line;">${descriptionHtml}</p>
          </div>
          `
              : ''
          }

          <p>Your match schedule will be available soon. You'll receive an email notification when it's ready.</p>

          <div style="text-align: center;">
            <a href="${process.env.NEXTAUTH_URL}/dashboard" class="button">View Dashboard</a>
          </div>

          <p style="margin-top: 30px;">Good luck in the league!</p>
          <p>- Durango Racquetball Association</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: `"Durango Racquetball Association" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: user.email,
      subject,
      html: htmlContent,
    });

    console.log(`League registration confirmation sent to ${user.email}`);
    return { success: true };
  } catch (error) {
    console.error('Error sending registration confirmation:', error);
    return { success: false, error };
  }
}

export async function sendLeagueAnnouncement(
  recipients: User[],
  league: League,
  announcementSubject: string,
  message: string
) {
  if (!transporter) {
    console.warn('Email transporter not configured - skipping league announcement emails');
    return [];
  }
  const subject = `${league.name} - ${announcementSubject}`;

  const results = [];

  for (const recipient of recipients) {
    if (!recipient.emailNotifications) continue;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #6366f1; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px; }
          .announcement { background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #fbbf24; }
          .button { display: inline-block; padding: 10px 20px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px; margin-top: 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">${league.name} Announcement</h1>
          </div>

          <div class="content">
            <p>Hi ${recipient.name},</p>

            <div class="announcement">
              <h3 style="margin-top: 0; color: #92400e;">${announcementSubject}</h3>
              <div style="white-space: pre-wrap;">${message}</div>
            </div>

            <div style="text-align: center; margin-top: 30px;">
              <a href="${process.env.NEXTAUTH_URL}/dashboard" class="button">View Dashboard</a>
            </div>

            <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
              If you have any questions, please contact the league administrator.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      await transporter.sendMail({
        from: `"Durango Racquetball Association" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
        to: recipient.email,
        subject,
        html: htmlContent,
      });
      results.push({ email: recipient.email, success: true });
    } catch (error) {
      console.error(`Error sending announcement to ${recipient.email}:`, error);
      results.push({ email: recipient.email, success: false, error });
    }
  }

  return results;
}
