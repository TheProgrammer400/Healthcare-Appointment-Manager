import { google } from 'googleapis';
import { getGoogleOAuthClient } from './googleOAuthClient';
import { prisma } from '@/lib/db/prisma';

export class CalendarService {
  private static async getAuthenticatedClient(userId: string) {
    const tokenRecord = await prisma.googleOAuthToken.findUnique({
      where: { userId },
    });

    if (!tokenRecord) {
      return null;
    }

    const oauth2Client = getGoogleOAuthClient();
    oauth2Client.setCredentials({
      access_token: tokenRecord.accessToken,
      refresh_token: tokenRecord.refreshToken,
      expiry_date: tokenRecord.expiresAt.getTime(),
    });

    // Handle token refresh if expired
    if (tokenRecord.expiresAt.getTime() <= Date.now()) {
      try {
        const { credentials } = await oauth2Client.refreshAccessToken();
        if (credentials.access_token && credentials.expiry_date) {
          await prisma.googleOAuthToken.update({
            where: { userId },
            data: {
              accessToken: credentials.access_token,
              expiresAt: new Date(credentials.expiry_date),
            },
          });
        }
      } catch (err) {
        console.warn(`[CalendarService]: Token refresh failed for user ${userId}:`, err);
        return null;
      }
    }

    return oauth2Client;
  }

  static async createEvent(
    userId: string,
    eventDetails: {
      summary: string;
      description?: string;
      startAt: Date;
      endAt: Date;
    }
  ): Promise<string | null> {
    try {
      const auth = await this.getAuthenticatedClient(userId);
      if (!auth) {
        return null;
      }

      const calendar = google.calendar({ version: 'v3', auth });
      const res = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: {
          summary: eventDetails.summary,
          description: eventDetails.description,
          start: { dateTime: eventDetails.startAt.toISOString() },
          end: { dateTime: eventDetails.endAt.toISOString() },
        },
      });

      return res.data.id || null;
    } catch (err) {
      console.warn(`[CalendarService]: Failed to create calendar event for user ${userId}:`, err);
      return null;
    }
  }

  static async deleteEvent(userId: string, googleEventId: string): Promise<boolean> {
    try {
      const auth = await this.getAuthenticatedClient(userId);
      if (!auth) {
        return false;
      }

      const calendar = google.calendar({ version: 'v3', auth });
      await calendar.events.delete({
        calendarId: 'primary',
        eventId: googleEventId,
      });

      return true;
    } catch (err) {
      console.warn(`[CalendarService]: Failed to delete calendar event ${googleEventId}:`, err);
      return false;
    }
  }
}
