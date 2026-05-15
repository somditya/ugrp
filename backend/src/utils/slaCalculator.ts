import { prisma } from '@database/prisma/client';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

interface Holiday {
  date: Date;
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export async function getHolidays(): Promise<Date[]> {
  const cached = await redis.get('holidays:calendar');
  if (cached) {
    return JSON.parse(cached).map((d: string) => new Date(d));
  }

  const holidays = await prisma.holidayCalendar.findMany({
    select: { date: true },
  });

  const holidayDates = holidays.map((h) => h.date);
  await redis.setex('holidays:calendar', 86400, JSON.stringify(holidayDates.map(d => d.toISOString())));
  return holidayDates;
}

export async function addBusinessDays(
  startDate: Date,
  days: number,
  holidays?: Date[]
): Promise<Date> {
  let count = 0;
  let current = new Date(startDate);
  const holidayList = holidays ?? (await getHolidays());

  while (count < days) {
    current.setDate(current.getDate() + 1);
    const isWeekend = current.getDay() === 0 || current.getDay() === 6;
    const isHoliday = holidayList.some((h) => isSameDay(h, current));
    if (!isWeekend && !isHoliday) {
      count++;
    }
  }
  return current;
}

export async function calculateSlaDeadline(
  startDate: Date,
  slaWorkingDays: number
): Promise<Date> {
  return addBusinessDays(startDate, slaWorkingDays);
}