export interface Holiday {
  name: string;
  message: string;
  theme: 'jamhuri' | 'christmas' | 'valentine' | 'cancer' | 'aids' | 'eid' | 'default' | 'women' | 'earth' | 'labour' | 'madaraka' | 'mashujaa' | 'newyear' | 'easter' | 'boxing';
  emoji?: string;
}

// Fixed date holidays (MM-DD format)
export const fixedHolidays: Record<string, Holiday> = {
  "01-01": {
    name: "New Year's Day",
    message: "🎉 Happy New Year 2026 from Justice Ultimate Automobiles! Wishing you a prosperous year filled with new beginnings, great journeys, and amazing car deals! Mega New Year Sale — Up to 90% Asset Financing!",
    theme: "newyear",
    emoji: "🎉"
  },
  "02-04": {
    name: "World Cancer Day",
    message: "World Cancer Day — Justice Ultimate Automobiles honors fighters, survivors, and families. Keep fighting. Keep hoping.",
    theme: "cancer",
    emoji: "🎗️"
  },
  "02-14": {
    name: "Valentine's Day",
    message: "Happy Valentine's Day! Love is in the air — and so are our exclusive Valentine car deals. Treat yourself or someone special to the perfect ride today.",
    theme: "valentine",
    emoji: "❤️"
  },
  "03-08": {
    name: "International Women's Day",
    message: "Happy International Women's Day! Justice Ultimate Automobiles celebrates the strength, courage, and achievements of women everywhere.",
    theme: "women",
    emoji: "👩"
  },
  "03-22": {
    name: "World Water Day",
    message: "World Water Day — Every drop counts. Justice Ultimate Automobiles supports sustainable practices for a better tomorrow.",
    theme: "earth",
    emoji: "💧"
  },
  "04-22": {
    name: "Earth Day",
    message: "Happy Earth Day! Justice Ultimate Automobiles is committed to environmental sustainability. Drive green, think clean.",
    theme: "earth",
    emoji: "🌍"
  },
  "05-01": {
    name: "Labour Day",
    message: "Happy Labour Day! Justice Ultimate Automobiles honors all hardworking Kenyans. Your dedication drives our nation forward.",
    theme: "labour",
    emoji: "⚒️"
  },
  "05-03": {
    name: "World Press Freedom Day",
    message: "World Press Freedom Day — Justice Ultimate Automobiles supports truth, transparency, and the power of free expression.",
    theme: "default",
    emoji: "📰"
  },
  "06-01": {
    name: "Madaraka Day",
    message: "Happy Madaraka Day! Celebrating Kenya's self-governance. Justice Ultimate Automobiles — Proudly Kenyan, Driving Excellence.",
    theme: "madaraka",
    emoji: "🇰🇪"
  },
  "06-05": {
    name: "World Environment Day",
    message: "World Environment Day — Justice Ultimate Automobiles cares for our planet. Together we can drive towards a greener future.",
    theme: "earth",
    emoji: "🌱"
  },
  "06-16": {
    name: "Day of the African Child",
    message: "International Day of the African Child — Justice Ultimate Automobiles celebrates Africa's future leaders.",
    theme: "default",
    emoji: "👶"
  },
  "06-20": {
    name: "World Refugee Day",
    message: "World Refugee Day — Justice Ultimate Automobiles stands in solidarity with refugees worldwide. Every journey matters.",
    theme: "default",
    emoji: "🕊️"
  },
  "07-18": {
    name: "Nelson Mandela Day",
    message: "Mandela Day — 'It always seems impossible until it's done.' Justice Ultimate Automobiles honors Madiba's legacy.",
    theme: "default",
    emoji: "✊"
  },
  "08-12": {
    name: "International Youth Day",
    message: "Happy International Youth Day! Justice Ultimate Automobiles believes in the power of young dreamers and achievers.",
    theme: "default",
    emoji: "🌟"
  },
  "09-21": {
    name: "International Day of Peace",
    message: "International Day of Peace — Justice Ultimate Automobiles promotes harmony, unity, and peaceful coexistence.",
    theme: "default",
    emoji: "☮️"
  },
  "10-01": {
    name: "International Day for Older Persons",
    message: "International Day for Older Persons — Justice Ultimate Automobiles honors the wisdom and experience of our elders.",
    theme: "default",
    emoji: "👴"
  },
  "10-10": {
    name: "Huduma Day",
    message: "Happy Huduma Day! Justice Ultimate Automobiles celebrates service to our great nation Kenya.",
    theme: "mashujaa",
    emoji: "🇰🇪"
  },
  "10-17": {
    name: "International Day for the Eradication of Poverty",
    message: "International Day for the Eradication of Poverty — Together we can drive change. Justice Ultimate Automobiles cares.",
    theme: "default",
    emoji: "🤝"
  },
  "10-20": {
    name: "Mashujaa Day",
    message: "Happy Mashujaa Day! Justice Ultimate Automobiles salutes Kenya's heroes — past, present, and future.",
    theme: "mashujaa",
    emoji: "🦁"
  },
  "11-14": {
    name: "World Diabetes Day",
    message: "World Diabetes Day — Justice Ultimate Automobiles supports health awareness. Take care of yourself and your loved ones.",
    theme: "default",
    emoji: "💙"
  },
  "12-01": {
    name: "World AIDS Day",
    message: "World AIDS Day — Justice Ultimate Automobiles stands in solidarity. Know your status. Stay informed. Stay strong.",
    theme: "aids",
    emoji: "🎗️"
  },
  "12-10": {
    name: "Human Rights Day",
    message: "Human Rights Day — Justice Ultimate Automobiles believes in dignity, equality, and justice for all.",
    theme: "default",
    emoji: "⚖️"
  },
  "12-12": {
    name: "Jamhuri Day",
    message: "Happy Jamhuri Day! Justice Ultimate Automobiles celebrates 62 years of Kenya's independence. Drive the Pride of Kenya! 🇰🇪",
    theme: "jamhuri",
    emoji: "🇰🇪"
  },
  "12-25": {
    name: "Christmas Day",
    message: "Merry Christmas from Justice Ultimate Automobiles! Celebrate the season with joy, love, and our special Christmas offers.",
    theme: "christmas",
    emoji: "🎄"
  },
  "12-26": {
    name: "Boxing Day",
    message: "Happy Boxing Day! Continue the festive celebration with our Boxing Day super deals at Justice Ultimate Automobiles.",
    theme: "boxing",
    emoji: "🎁"
  }
};

// Additional fixed-date awareness days (not in fixedHolidays above)
const additionalFixedHolidays: Record<string, Holiday> = {
  "01-24": {
    name: "International Day of Education",
    message: "International Day of Education — Justice Ultimate Automobiles believes in the power of learning to drive change.",
    theme: "default",
    emoji: "📚"
  },
  "04-07": {
    name: "World Health Day",
    message: "World Health Day — Justice Ultimate Automobiles wishes you good health and safe journeys always.",
    theme: "default",
    emoji: "🩺"
  },
  "11-19": {
    name: "International Men's Day",
    message: "Happy International Men's Day! Justice Ultimate Automobiles celebrates the strength and contribution of men everywhere.",
    theme: "default",
    emoji: "👨"
  },
};

// Movable holidays for 2026 (verified Kenyan calendar dates)
// - Good Friday: 3 April 2026
// - Easter Sunday: 5 April 2026
// - Easter Monday: 6 April 2026
// - Mother's Day: 10 May 2026 (2nd Sunday)
// - Eid al-Fitr: ~20-21 March 2026
// - Eid al-Adha: ~27-28 May 2026
// - Father's Day: 21 June 2026 (3rd Sunday)
export const movableHolidays2026: Record<string, Holiday> = {
  "03-20": {
    name: "Eid al-Fitr",
    message: "Eid Mubarak! Justice Ultimate Automobiles wishes you blessings, joy, and peace. Celebrate with our special Eid offers.",
    theme: "eid",
    emoji: "🌙"
  },
  "03-21": {
    name: "Eid al-Fitr",
    message: "Eid Mubarak! Justice Ultimate Automobiles wishes you blessings, joy, and peace. Celebrate with our special Eid offers.",
    theme: "eid",
    emoji: "🌙"
  },
  "04-03": {
    name: "Good Friday",
    message: "Good Friday — Justice Ultimate Automobiles reflects on sacrifice, love, and redemption. May your faith guide you.",
    theme: "easter",
    emoji: "✝️"
  },
  "04-05": {
    name: "Easter Sunday",
    message: "Happy Easter! Justice Ultimate Automobiles celebrates new life, hope, and resurrection. Enjoy our Easter offers!",
    theme: "easter",
    emoji: "🐣"
  },
  "04-06": {
    name: "Easter Monday",
    message: "Happy Easter Monday! Continue the celebration with Justice Ultimate Automobiles special Easter deals.",
    theme: "easter",
    emoji: "🐰"
  },
  "05-10": {
    name: "Mother's Day",
    message: "Happy Mother's Day! Justice Ultimate Automobiles celebrates the love, strength, and sacrifices of mothers everywhere.",
    theme: "valentine",
    emoji: "💐"
  },
  "05-27": {
    name: "Eid al-Adha",
    message: "Eid al-Adha Mubarak! May your sacrifices be accepted and your celebrations blessed. — Justice Ultimate Automobiles",
    theme: "eid",
    emoji: "🐑"
  },
  "05-28": {
    name: "Eid al-Adha",
    message: "Eid al-Adha Mubarak! May your sacrifices be accepted and your celebrations blessed. — Justice Ultimate Automobiles",
    theme: "eid",
    emoji: "🐑"
  },
  "06-21": {
    name: "Father's Day",
    message: "Happy Father's Day! Justice Ultimate Automobiles honors the dedication and love of fathers everywhere.",
    theme: "default",
    emoji: "👨‍👧"
  },
  "10-10": {
    name: "World Mental Health Day",
    message: "World Mental Health Day — Justice Ultimate Automobiles cares about your wellbeing. You matter.",
    theme: "default",
    emoji: "💚"
  },
};

export const getTodayHoliday = (): Holiday | null => {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  const key = `${month}-${day}`;
  
  // Check fixed holidays first
  if (fixedHolidays[key]) {
    return fixedHolidays[key];
  }
  
  // Check movable holidays for 2026
  if (movableHolidays2026[key]) {
    return movableHolidays2026[key];
  }
  
  return null;
};

export const getThemeColors = (theme: Holiday['theme']) => {
  switch (theme) {
    case 'jamhuri':
      return {
        primary: 'from-green-600/90 via-red-600/90 to-black/90',
        glow: 'shadow-green-500/30',
        accent: 'text-green-400'
      };
    case 'christmas':
      return {
        primary: 'from-red-600/90 via-green-700/90 to-red-800/90',
        glow: 'shadow-red-500/30',
        accent: 'text-red-400'
      };
    case 'valentine':
      return {
        primary: 'from-pink-600/90 via-red-500/90 to-rose-600/90',
        glow: 'shadow-pink-500/30',
        accent: 'text-pink-400'
      };
    case 'cancer':
      return {
        primary: 'from-orange-600/90 via-amber-500/90 to-orange-700/90',
        glow: 'shadow-orange-500/30',
        accent: 'text-orange-400'
      };
    case 'aids':
      return {
        primary: 'from-red-700/90 via-red-600/90 to-red-800/90',
        glow: 'shadow-red-600/30',
        accent: 'text-red-400'
      };
    case 'eid':
      return {
        primary: 'from-emerald-600/90 via-teal-600/90 to-emerald-700/90',
        glow: 'shadow-emerald-500/30',
        accent: 'text-emerald-400'
      };
    case 'women':
      return {
        primary: 'from-purple-600/90 via-pink-500/90 to-purple-700/90',
        glow: 'shadow-purple-500/30',
        accent: 'text-purple-400'
      };
    case 'earth':
      return {
        primary: 'from-green-600/90 via-emerald-500/90 to-green-700/90',
        glow: 'shadow-green-500/30',
        accent: 'text-green-400'
      };
    case 'labour':
      return {
        primary: 'from-blue-600/90 via-indigo-600/90 to-blue-700/90',
        glow: 'shadow-blue-500/30',
        accent: 'text-blue-400'
      };
    case 'madaraka':
      return {
        primary: 'from-black/90 via-red-600/90 to-green-600/90',
        glow: 'shadow-red-500/30',
        accent: 'text-red-400'
      };
    case 'mashujaa':
      return {
        primary: 'from-red-600/90 via-black/90 to-green-600/90',
        glow: 'shadow-red-500/30',
        accent: 'text-yellow-400'
      };
    case 'newyear':
      return {
        primary: 'from-yellow-500/90 via-amber-600/90 to-orange-600/90',
        glow: 'shadow-yellow-500/30',
        accent: 'text-yellow-400'
      };
    case 'easter':
      return {
        primary: 'from-purple-600/90 via-pink-400/90 to-yellow-400/90',
        glow: 'shadow-purple-500/30',
        accent: 'text-purple-400'
      };
    case 'boxing':
      return {
        primary: 'from-red-600/90 via-green-600/90 to-red-700/90',
        glow: 'shadow-red-500/30',
        accent: 'text-red-400'
      };
    default:
      return {
        primary: 'from-primary/90 via-primary/80 to-primary/90',
        glow: 'shadow-primary/30',
        accent: 'text-primary'
      };
  }
};

export const scripture = "Psalms 23:6 — Surely goodness and mercy shall follow me all the days of my life.";
