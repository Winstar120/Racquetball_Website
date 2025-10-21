import nodemailer from 'nodemailer';
import { User, Match, League, Division } from '@prisma/client';

// Create reusable transporter
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
}

export type EmailSendResult = { success: boolean; error?: unknown; skipped?: boolean };

export async function sendMatchReminder(
  match: MatchWithPlayers,
  recipientId: string
): Promise<EmailSendResult> {
  if (!transporter) {
    console.warn('Email transporter not configured - skipping email');
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
      from: `"Racquetball League" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: recipient.email,
      subject,
      text: textContent,
      html: htmlContent,
    });

    console.log(`Match reminder sent to ${recipient.email}`);
    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
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
          <p>- The Durango Racquetball League Team</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: `"Racquetball League" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
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
      from: `"Racquetball League" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
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
  league: League & { divisions: Division[] },
  divisionId: string
) {
  if (!transporter) {
    console.warn('Email transporter not configured - skipping league registration confirmation email');
    return;
  }
  const division = league.divisions.find(d => d.id === divisionId);
  const subject = `Registration Confirmed - ${league.name}`;

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
            <p><strong>Division:</strong> ${division?.name || 'TBD'}</p>
            <p><strong>Start Date:</strong> ${new Date(league.startDate).toLocaleDateString()}</p>
            <p><strong>End Date:</strong> ${new Date(league.endDate).toLocaleDateString()}</p>
            <p><strong>Game Type:</strong> ${league.gameType}</p>
            <p><strong>League Fee:</strong> ${league.isFree ? 'FREE' : `$${league.leagueFee?.toFixed(2) || '0.00'}`}</p>
          </div>

          <p>Your match schedule will be available soon. You'll receive an email notification when it's ready.</p>

          <div style="text-align: center;">
            <a href="${process.env.NEXTAUTH_URL}/dashboard" class="button">View Dashboard</a>
          </div>

          <p style="margin-top: 30px;">Good luck in the league!</p>
          <p>- The Racquetball League Team</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: `"Racquetball League" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
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
        from: `"Racquetball League" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
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
