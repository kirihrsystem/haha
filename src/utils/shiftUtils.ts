import { differenceInMinutes, getDaysInMonth, format } from "date-fns";
import { Settings } from "../types";

export type ShiftOverride = { start: string, end: string, start2?: string, end2?: string, active: boolean, breakHours?: number };

export function calculateShiftHours(start?: string, end?: string): number {
  if (!start || !end) return 0;
  const [sH, sM] = start.split(":").map(Number);
  const [eH, eM] = end.split(":").map(Number);
  if (isNaN(sH) || isNaN(eH)) return 0;
  let diff = (eH * 60 + (eM || 0)) - (sH * 60 + (sM || 0));
  if (diff < 0) diff += 24 * 60;
  return diff / 60;
}

export function getCalculatedHourlyRate(
  employee: {
    monthlySalary?: number;
    hourlyRate?: number;
    shiftStart?: string;
    shiftEnd?: string;
    shift2Start?: string;
    shift2End?: string;
    breakHours?: number;
    shiftOverrides?: Record<number, any>;
  } | null | undefined,
  dateStr?: string
): number {
  if (!employee) return 0;
  if (!employee.monthlySalary) return employee.hourlyRate || 0;

  const date = dateStr ? new Date(dateStr) : new Date();
  const daysInMonth = getDaysInMonth(date);
  const dailySalaryStatic = employee.monthlySalary / daysInMonth;

  let expectedHours = 0;
  if (dateStr) {
    expectedHours = getExpectedShiftDuration(
      dateStr,
      employee.shiftStart,
      employee.shiftEnd,
      employee.shiftOverrides,
      employee.shift2Start,
      employee.shift2End,
      employee.breakHours
    );
  }

  if (!expectedHours || expectedHours === 0) {
    expectedHours = Math.max(
      0,
      calculateShiftHours(employee.shiftStart, employee.shiftEnd) +
        calculateShiftHours(employee.shift2Start, employee.shift2End) -
        (employee.breakHours || 0)
    );
  }

  if (expectedHours === 0) expectedHours = 8;

  return dailySalaryStatic / expectedHours;
}

export function calculateOvertimePay(overtimeHours: number, calculatedHourlyRate: number, settings?: Settings): number {
  if (!overtimeHours || overtimeHours <= 0) return 0;
  if (!settings) {
    return overtimeHours * calculatedHourlyRate * 1.5;
  }
  
  const type = settings.overtimeRateType || 'multiplier';
  const val = typeof settings.overtimeRateValue === 'number' && !isNaN(settings.overtimeRateValue) ? settings.overtimeRateValue : null;

  if (type === 'fixed') {
    const fixedRate = val !== null ? val : (settings.defaultOvertimeRate || 0);
    return overtimeHours * fixedRate;
  } else {
    const multiplier = val !== null && val > 0 ? val : (settings.defaultOvertimeRate && settings.defaultHourlyRate ? (settings.defaultOvertimeRate / settings.defaultHourlyRate) : 1.5);
    return overtimeHours * calculatedHourlyRate * multiplier;
  }
}

export function calculateShiftStatus(
  timeInDate: Date, 
  timeOutDate: Date, 
  defaultShiftStart: string | undefined, 
  defaultShiftEnd: string | undefined,
  shiftOverrides: Record<number, ShiftOverride> | undefined,
  timeIn2Date?: Date | null,
  timeOut2Date?: Date | null,
  defaultShift2Start?: string,
  defaultShift2End?: string,
  gracePeriodMinutes?: number,
  defaultBreakHours?: number
) {
  let expectedCheckOut = new Date(timeInDate);
  let expectedCheckIn = new Date(timeInDate);

  // Logical day detection: if clocked in before 6 AM, it likely belongs to previous day
  let targetDay = timeInDate.getDay();
  if (timeInDate.getHours() < 6) {
    let prevDayDate = new Date(timeInDate);
    prevDayDate.setDate(prevDayDate.getDate() - 1);
    targetDay = prevDayDate.getDay();
  }

  const { shiftStartHour, shiftStartMin, shiftEndHour, shiftEndMin, s2StartHour, s2StartMin, s2EndHour, s2EndMin, hasSecondShift, isOff, breakHours } = getConfiguredShiftTimes(targetDay, defaultShiftStart, defaultShiftEnd, shiftOverrides, defaultShift2Start, defaultShift2End, defaultBreakHours);

  if (isOff) {
    let totalWorkMins = 0;
    if (timeInDate && timeOutDate) {
      totalWorkMins = Math.max(0, differenceInMinutes(timeOutDate, timeInDate));
      if (timeIn2Date && timeOut2Date) {
        totalWorkMins += Math.max(0, differenceInMinutes(timeOut2Date, timeIn2Date));
      }
    }
    return { 
      isEarlyCheckOut: false, 
      isExtraTime: totalWorkMins > 0, 
      lateCheckIn: false, 
      earlyCheckIn: false, 
      shiftDurationHours: 0, 
      expectedCheckIn, 
      expectedCheckOut, 
      finalExpectedCheckOut: expectedCheckOut,
      lateMinutes: 0, 
      extraMinutes: totalWorkMins, 
      breakHours: 0 
    };
  }

  expectedCheckIn.setHours(shiftStartHour, shiftStartMin, 0, 0);
  expectedCheckOut.setHours(shiftEndHour, shiftEndMin, 0, 0);

  const isOvernight = shiftEndHour < shiftStartHour;

  if (isOvernight) {
    if (timeInDate.getHours() < shiftEndHour + 4) {
      expectedCheckIn.setDate(expectedCheckIn.getDate() - 1);
    } else {
      expectedCheckOut.setDate(expectedCheckOut.getDate() + 1);
    }
  }

  let isEarlyCheckOut = false;
  let isExtraTime = false;
  let extraMinutes = 0;
  
  const checkOutDiff = differenceInMinutes(timeOutDate, expectedCheckOut);
  if (checkOutDiff < 0) {
    isEarlyCheckOut = true;
  } else if (checkOutDiff > 0) {
    isExtraTime = true;
    extraMinutes = checkOutDiff;
  }

  let lateCheckIn = false;
  let earlyCheckIn = false;
  let lateMinutes = 0;
  const checkInDiff = differenceInMinutes(timeInDate, expectedCheckIn);
  if (checkInDiff > (gracePeriodMinutes || 0)) {
    lateCheckIn = true;
    lateMinutes = checkInDiff; // full lateness if past grace
  } else if (checkInDiff < 0) {
    earlyCheckIn = true;
  }

  let shiftDurationHours = Math.max(0, differenceInMinutes(expectedCheckOut, expectedCheckIn) / 60);

  let finalExpectedCheckOut = new Date(expectedCheckOut);

  if (hasSecondShift && timeIn2Date && timeOut2Date) {
      let expectedCheckIn2 = new Date(timeIn2Date);
      let expectedCheckOut2 = new Date(timeIn2Date);
      expectedCheckIn2.setHours(s2StartHour, s2StartMin, 0, 0);
      expectedCheckOut2.setHours(s2EndHour, s2EndMin, 0, 0);
      finalExpectedCheckOut = new Date(expectedCheckOut2);
      
      const s2Duration = Math.max(0, differenceInMinutes(expectedCheckOut2, expectedCheckIn2) / 60);
      shiftDurationHours += s2Duration;

      const checkIn2Diff = differenceInMinutes(timeIn2Date, expectedCheckIn2);
      if (checkIn2Diff > (gracePeriodMinutes || 0)) {
        lateCheckIn = true;
        lateMinutes += checkIn2Diff;
      }

      const checkOut2Diff = differenceInMinutes(timeOut2Date, expectedCheckOut2);
      if (checkOut2Diff < 0) isEarlyCheckOut = true;
      else if (checkOut2Diff > 0) {
          isExtraTime = true;
          extraMinutes += checkOut2Diff;
      }
  } else if (hasSecondShift) {
      // If they had a second shift but didn't clock out of it
      const expectedCheckIn2 = new Date(timeInDate);
      const expectedCheckOut2 = new Date(timeInDate);
      expectedCheckIn2.setHours(s2StartHour, s2StartMin, 0, 0);
      expectedCheckOut2.setHours(s2EndHour, s2EndMin, 0, 0);
      finalExpectedCheckOut = new Date(expectedCheckOut2);
      shiftDurationHours += Math.max(0, differenceInMinutes(expectedCheckOut2, expectedCheckIn2) / 60);
  }

  shiftDurationHours = Math.max(0, shiftDurationHours - (breakHours || 0));
  return { isEarlyCheckOut, isExtraTime, lateCheckIn, earlyCheckIn, shiftDurationHours, expectedCheckIn, expectedCheckOut, finalExpectedCheckOut, lateMinutes, extraMinutes, breakHours };
}

export function getConfiguredShiftTimes(
  targetDay: number,
  defaultShiftStart?: string,
  defaultShiftEnd?: string,
  shiftOverrides?: Record<number, ShiftOverride>,
  defaultShift2Start?: string,
  defaultShift2End?: string,
  defaultBreakHours?: number
) {
  let shiftStart = defaultShiftStart;
  let shiftEnd = defaultShiftEnd;
  let shift2Start = defaultShift2Start;
  let shift2End = defaultShift2End;
  let breakHours = defaultBreakHours || 0;

  if (shiftOverrides && shiftOverrides[targetDay] && shiftOverrides[targetDay].active) {
    shiftStart = shiftOverrides[targetDay].start;
    shiftEnd = shiftOverrides[targetDay].end;
    if (shiftOverrides[targetDay].start2 !== undefined) shift2Start = shiftOverrides[targetDay].start2;
    if (shiftOverrides[targetDay].end2 !== undefined) shift2End = shiftOverrides[targetDay].end2;
    if (shiftOverrides[targetDay].breakHours !== undefined) breakHours = Number(shiftOverrides[targetDay].breakHours) || 0;
  } else if (shiftOverrides && shiftOverrides[targetDay] && !shiftOverrides[targetDay].active) {
    return { shiftStartHour: 0, shiftStartMin: 0, shiftEndHour: 0, shiftEndMin: 0, s2StartHour: 0, s2StartMin: 0, s2EndHour: 0, s2EndMin: 0, hasSecondShift: false, isOff: true, breakHours: 0 };
  } else if (!shiftStart || shiftStart.trim() === "" || shiftStart === "none") {
    return { shiftStartHour: 0, shiftStartMin: 0, shiftEndHour: 0, shiftEndMin: 0, s2StartHour: 0, s2StartMin: 0, s2EndHour: 0, s2EndMin: 0, hasSecondShift: false, isOff: true, breakHours: 0 };
  }

  let shiftStartHour = 8, shiftStartMin = 0, shiftEndHour = 17, shiftEndMin = 0;
  let s2StartHour = 0, s2StartMin = 0, s2EndHour = 0, s2EndMin = 0;
  let hasSecondShift = false;

  if (shiftStart) {
    const parts = shiftStart.split(":");
    if (parts.length >= 1 && !isNaN(parseInt(parts[0], 10))) shiftStartHour = parseInt(parts[0], 10);
    if (parts.length >= 2 && !isNaN(parseInt(parts[1], 10))) shiftStartMin = parseInt(parts[1], 10);
  }
  if (shiftEnd) {
    const parts = shiftEnd.split(":");
    if (parts.length >= 1 && !isNaN(parseInt(parts[0], 10))) shiftEndHour = parseInt(parts[0], 10);
    if (parts.length >= 2 && !isNaN(parseInt(parts[1], 10))) shiftEndMin = parseInt(parts[1], 10);
  } else if (shiftStart) {
    shiftEndHour = (shiftStartHour + 9) % 24;
    shiftEndMin = shiftStartMin;
  }

  if (shift2Start && shift2End) {
    hasSecondShift = true;
    const partsIn = shift2Start.split(":");
    if (partsIn.length >= 1) s2StartHour = parseInt(partsIn[0], 10);
    if (partsIn.length >= 2) s2StartMin = parseInt(partsIn[1], 10);
    const partsOut = shift2End.split(":");
    if (partsOut.length >= 1) s2EndHour = parseInt(partsOut[0], 10);
    if (partsOut.length >= 2) s2EndMin = parseInt(partsOut[1], 10);
  }

  return { shiftStartHour, shiftStartMin, shiftEndHour, shiftEndMin, s2StartHour, s2StartMin, s2EndHour, s2EndMin, hasSecondShift, isOff: false, breakHours };
}

export function getExpectedShiftDuration(
  dateString: string,
  defaultShiftStart?: string,
  defaultShiftEnd?: string,
  shiftOverrides?: Record<number, ShiftOverride>,
  defaultShift2Start?: string,
  defaultShift2End?: string,
  defaultBreakHours?: number
): number {
  const date = new Date(dateString); 
  const targetDay = date.getDay();

  const { shiftStartHour, shiftStartMin, shiftEndHour, shiftEndMin, s2StartHour, s2StartMin, s2EndHour, s2EndMin, hasSecondShift, isOff, breakHours } = getConfiguredShiftTimes(targetDay, defaultShiftStart, defaultShiftEnd, shiftOverrides, defaultShift2Start, defaultShift2End, defaultBreakHours);

  if (isOff) return 0;

  const start = new Date(date);
  start.setHours(shiftStartHour, shiftStartMin, 0, 0);
  const end = new Date(date);
  end.setHours(shiftEndHour, shiftEndMin, 0, 0);

  if (shiftEndHour < shiftStartHour) {
    end.setDate(end.getDate() + 1);
  }

  let duration = Math.max(0, differenceInMinutes(end, start) / 60);

  if (hasSecondShift) {
    const s2Start = new Date(date);
    s2Start.setHours(s2StartHour, s2StartMin, 0, 0);
    const s2End = new Date(date);
    s2End.setHours(s2EndHour, s2EndMin, 0, 0);
    if (s2EndHour < s2StartHour) {
      s2End.setDate(s2End.getDate() + 1);
    }
    duration += Math.max(0, differenceInMinutes(s2End, s2Start) / 60);
  }

  return Math.max(0, duration - breakHours);
}





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
