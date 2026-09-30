const fs = require('fs');

const code = `
import { format } from "date-fns";

export function hasShiftEnded(
  dateString: string,
  defaultShiftStart?: string,
  defaultShiftEnd?: string,
  shiftOverrides?: Record<number, ShiftOverride>,
  defaultShift2Start?: string,
  defaultShift2End?: string
): boolean {
  const now = new Date();
  const todayStr = format(now, "yyyy-MM-dd");
  
  if (dateString > todayStr) return false;
  if (dateString < todayStr) return true;
  
  // For today, check if current time is past the shift end
  const targetDay = now.getDay();
  const conf = getConfiguredShiftTimes(targetDay, defaultShiftStart, defaultShiftEnd, shiftOverrides, defaultShift2Start, defaultShift2End);
  
  if (conf.isOff) return true;
  
  const endHour = conf.hasSecondShift ? conf.s2EndHour : conf.shiftEndHour;
  const endMin = conf.hasSecondShift ? conf.s2EndMin : conf.shiftEndMin;
  
  const endTime = new Date(now);
  endTime.setHours(endHour, endMin, 0, 0);
  
  if (endHour < conf.shiftStartHour) {
    endTime.setDate(endTime.getDate() + 1);
  }
  
  return now > endTime;
}
`;

let content = fs.readFileSync('src/utils/shiftUtils.ts', 'utf8');
content = content + code;
fs.writeFileSync('src/utils/shiftUtils.ts', content);
