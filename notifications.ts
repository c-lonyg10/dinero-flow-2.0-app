import { LocalNotifications, LocalNotificationSchema } from '@capacitor/local-notifications';
import { Bill } from './types';

export const getNotificationSettings = (): boolean => {
  try {
    return localStorage.getItem('dinero_notifications_enabled') === 'true';
  } catch {
    return false;
  }
};

export const setNotificationSettings = (enabled: boolean): void => {
  try {
    localStorage.setItem('dinero_notifications_enabled', String(enabled));
  } catch (err) {
    console.warn('Failed to save notification settings:', err);
  }
};

export const requestNotificationPermission = async (): Promise<boolean> => {
  try {
    if (!LocalNotifications) return false;
    const status = await LocalNotifications.requestPermissions();
    return status.display === 'granted';
  } catch (e) {
    console.error('Error requesting notification permissions:', e);
    return false;
  }
};

const getTargetDate = (dayOfMonth: number, daysBefore: number = 0): Date => {
  const now = new Date();
  let targetYear = now.getFullYear();
  let targetMonth = now.getMonth();

  let targetDate = new Date(targetYear, targetMonth, dayOfMonth - daysBefore, 9, 0, 0, 0);

  if (targetDate.getTime() <= now.getTime()) {
    targetMonth += 1;
    if (targetMonth > 11) {
      targetMonth = 0;
      targetYear += 1;
    }
    targetDate = new Date(targetYear, targetMonth, dayOfMonth - daysBefore, 9, 0, 0, 0);
  }

  return targetDate;
};

export const syncBillNotifications = async (bills: Bill[]): Promise<void> => {
  try {
    if (!LocalNotifications) return;

    const enabled = getNotificationSettings();
    if (!enabled) {
      const pending = await LocalNotifications.getPending();
      if (pending && pending.notifications && pending.notifications.length > 0) {
        await LocalNotifications.cancel({ notifications: pending.notifications });
      }
      return;
    }

    const pending = await LocalNotifications.getPending();
    if (pending && pending.notifications && pending.notifications.length > 0) {
      await LocalNotifications.cancel({ notifications: pending.notifications });
    }

    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${now.getMonth()}`;
    const nextMonth = now.getMonth() === 11 ? 0 : now.getMonth() + 1;
    const nextYear = now.getMonth() === 11 ? now.getFullYear() + 1 : now.getFullYear();
    const nextMonthKey = `${nextYear}-${nextMonth}`;

    const notificationsToSchedule: LocalNotificationSchema[] = [];

    bills.forEach((bill) => {
      if (!bill || !bill.id || !bill.day) return;

      const isPaidCurrentMonth = bill.manualPaid?.includes(currentMonthKey);
      const isPaidNextMonth = bill.manualPaid?.includes(nextMonthKey);

      // Reminder 1: 24h prior (Day before at 9:00 AM)
      const dayBeforeDate = getTargetDate(bill.day, 1);
      const isDayBeforeThisMonth = dayBeforeDate.getMonth() === now.getMonth();
      const skipDayBefore = isDayBeforeThisMonth ? isPaidCurrentMonth : isPaidNextMonth;

      if (!skipDayBefore && dayBeforeDate.getTime() > now.getTime()) {
        notificationsToSchedule.push({
          id: Math.abs((bill.id * 10 + 1) % 2147483647), // Safe 32-bit Android integer
          title: `Upcoming Bill: ${bill.name}`,
          body: `$${Number(bill.amount || 0).toFixed(2)} is due tomorrow!`,
          schedule: { at: dayBeforeDate, allowWhileIdle: true },
          extra: { route: 'calendar', billId: bill.id }
        });
      }

      // Reminder 2: Day of Payment (9:00 AM)
      const dayOfDate = getTargetDate(bill.day, 0);
      const isDayOfThisMonth = dayOfDate.getMonth() === now.getMonth();
      const skipDayOf = isDayOfThisMonth ? isPaidCurrentMonth : isPaidNextMonth;

      if (!skipDayOf && dayOfDate.getTime() > now.getTime()) {
        notificationsToSchedule.push({
          id: Math.abs((bill.id * 10 + 2) % 2147483647), // Safe 32-bit Android integer
          title: `Bill Due Today: ${bill.name}`,
          body: `$${Number(bill.amount || 0).toFixed(2)} is due today.`,
          schedule: { at: dayOfDate, allowWhileIdle: true },
          extra: { route: 'calendar', billId: bill.id }
        });
      }
    });

    if (notificationsToSchedule.length > 0) {
      await LocalNotifications.schedule({ notifications: notificationsToSchedule });
    }
  } catch (err) {
    console.warn('Safe catch: notifications skipped:', err);
  }
};