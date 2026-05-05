
// utils/vendorTime.js
export function getVendorOpenStatus(openingHours) {
  if (!openingHours) return "Opening hours not available.";

  const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const now = new Date();
  const currentDayIndex = now.getDay();
  const currentDay = days[currentDayIndex];
  const yesterdayDay = days[(currentDayIndex + 6) % 7];

  // Helper: Case-insensitive lookup for opening hours
  const getDayHours = (dayName) => {
    if (!openingHours) return null;
    const key = Object.keys(openingHours).find(k => k.toLowerCase() === dayName.toLowerCase());
    return key ? openingHours[key] : null;
  };

  // Get current time in minutes from midnight
  const currentTime = now.getHours() * 60 + now.getMinutes();

  // Helper: Parse time string (14:30 or 2:30 PM) to minutes
  /**
   * @param {string} timeStr - Time string to parse
   * @param {boolean} isClosing - If true, enforces PM logic for 1-11 numbers (e.g. "4:00" -> 16:00)
   */
  const parseTime = (timeStr, isClosing = false) => {
    if (!timeStr) return 0;

    let str = String(timeStr).toLowerCase().trim();
    const isPM = str.includes("pm");
    const isAM = str.includes("am");

    // Remove non-digit chars but keep colon
    str = str.replace(/[^0-9:]/g, "");

    if (!str.includes(":")) str += ":00";

    let [h, m] = str.split(":").map(val => parseInt(val || "0", 10));

    // Logic: 
    // If explicit AM/PM: Handle standard 12h
    // If no suffix:
    //   - Open (isClosing=false): 1-11 assumed AM. 12 assumed Noon.
    //   - Close (isClosing=true): 1-11 assumed PM. 12 assumed Noon.
    //   - 0 is always Midnight.

    if (isPM) {
      if (h < 12) h += 12;
    } else if (isAM) {
      if (h === 12) h = 0;
    } else {
      // No suffix - User Rule: "Opening is AM, Closing is PM"
      if (isClosing) {
        // Closing time: Treat 1-11 as PM (13-23)
        if (h > 0 && h < 12) {
          h += 12;
        }
      } else {
        // Opening time: Treat as AM (Default for 0-11)
        // If h=12 (Noon), it remains 12.
        if (h === 12) {
          // 12:00 Open defaults to Noon in 24h. 
          // If the user meant Midnight Open, they should send 00:00 or 12:00 AM.
        }
      }
    }

    return h * 60 + m;
  };

  // Helper: Format minutes or time string back to 12-hour format for display
  const formatDisplayTime = (timeInput, isClosing = false) => {
    const mins = typeof timeInput === "string" ? parseTime(timeInput, isClosing) : timeInput;
    let h = Math.floor(mins / 60);
    let m = mins % 60;

    h = h % 24;
    const ampm = h >= 12 ? "PM" : "AM";

    h = h % 12;
    h = h ? h : 12; // convert 0 to 12

    return `${h}:${m.toString().padStart(2, "0")} ${ampm}`;
  };

  const getNextOpeningDay = (startIndex) => {
    for (let i = 0; i <= 6; i++) {
      const nextIndex = (startIndex + i) % 7;
      const nextDay = days[nextIndex];
      const nextDayHours = getDayHours(nextDay);

      if (nextDayHours && !nextDayHours.closed) {
        const openMins = parseTime(nextDayHours.open, false); // Open time

        if (i === 0 && currentTime >= openMins) continue;

        return {
          dayName: nextDay,
          hours: nextDayHours,
          isToday: i === 0,
          isTomorrow: i === 1
        };
      }
    }
    return null;
  };

  // 1. Check "Yesterday's" overnight period
  const yesterday = getDayHours(yesterdayDay);
  if (yesterday && !yesterday.closed) {
    const openMins = parseTime(yesterday.open, false);
    const closeMins = parseTime(yesterday.close, true); // Closing time

    if (closeMins < openMins) {
      if (currentTime < closeMins) {
        return `Open now until ${formatDisplayTime(yesterday.close, true)}`;

      }
    }
  }

  // 2. Check "Today's" hours
  const today = getDayHours(currentDay);
  if (today && !today.closed) {
    const openMins = parseTime(today.open, false);
    const closeMins = parseTime(today.close, true); // Closing time

    if (closeMins > openMins) {
      // Normal hours (e.g. 09:00 - 16:00 (4PM))
      if (currentTime >= openMins && currentTime < closeMins) {
        return `Open now until ${formatDisplayTime(today.close, true)}`;

      }
    } else {
      // Overnight hours
      if (currentTime >= openMins) {
        return `Open now until ${formatDisplayTime(today.close, true)}`;

      }
    }
  }

  // 3. Not open now -> Find when it next opens
  const next = getNextOpeningDay(currentDayIndex);
  if (next) {
    const dayLabel = next.isToday ? "today" : next.isTomorrow ? "tomorrow" : `on ${next.dayName.charAt(0).toUpperCase() + next.dayName.slice(1)}`;
    const openTimeDisplay = formatDisplayTime(next.hours.open, false);

    // Explicitly handle the "The restaurant has closed" message
    if (today && !today.closed) {
      const todayCloseMins = parseTime(today.close, true);
      const todayOpenMins = parseTime(today.open, false);

      if (todayCloseMins > todayOpenMins && currentTime >= todayCloseMins) {
        return `We are closed now. We will open at ${openTimeDisplay} ${dayLabel}.`;
      }
    }

    if (today && today.closed) {
      return `Closed today. We will open at ${openTimeDisplay} ${dayLabel}.`;
    }

    return `Closed now. We will open at ${openTimeDisplay} ${dayLabel}.`;

  }

  return "Closed until further notice.";
}
