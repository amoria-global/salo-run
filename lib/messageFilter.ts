/**
 * Message content filter — detects emails, phone numbers, and external links
 * to prevent off-platform contact sharing between photographers and clients.
 *
 * Two-pass approach:
 *   1. Check the raw message against patterns
 *   2. Normalize the message (strip tricks) and check again
 */

export interface FilterResult {
  blocked: boolean;
  reason: string | null;
  detectedType: 'email' | 'phone' | 'link' | null;
}

// ============================================
// NORMALIZATION — defeat common evasion tricks
// ============================================

/** Map of leetspeak / unicode substitutions → latin letters */
const CHAR_MAP: Record<string, string> = {
  '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't', '8': 'b',
  '@': 'a', '$': 's', '!': 'i',
  // Common unicode lookalikes
  '\u0430': 'a', '\u0435': 'e', '\u043E': 'o', '\u0440': 'p', '\u0441': 'c',
  '\u0443': 'y', '\u0445': 'x',
};

/** Number words → digits */
const NUMBER_WORDS: Record<string, string> = {
  zero: '0', one: '1', two: '2', three: '3', four: '4',
  five: '5', six: '6', seven: '7', eight: '8', nine: '9',
  oh: '0',
};

/** Compound number words → digit strings (tens, teens, hundred combos) */
const COMPOUND_NUMBER_WORDS: Record<string, string> = {
  ten: '10', eleven: '11', twelve: '12', thirteen: '13', fourteen: '14',
  fifteen: '15', sixteen: '16', seventeen: '17', eighteen: '18', nineteen: '19',
  twenty: '20', thirty: '30', forty: '40', fifty: '50',
  sixty: '60', seventy: '70', eighty: '80', ninety: '90', hundred: '00',
};

/** All number words (single + compound) for detection */
const ALL_NUMBER_WORDS: Record<string, string> = { ...NUMBER_WORDS, ...COMPOUND_NUMBER_WORDS };

/**
 * Normalize a message to defeat evasion:
 *   - Strip zero-width chars, invisible separators
 *   - Collapse whitespace
 *   - Convert number words to digits
 *   - Apply leetspeak map (only for text-pattern checks, not digit checks)
 */
function normalizeForTextCheck(msg: string): string {
  let s = msg
    // Remove zero-width characters and invisible separators
    .replace(/[\u200B-\u200F\u2028-\u202F\uFEFF]/g, '')
    // Remove dots/dashes/underscores between single letters: g.m.a.i.l → gmail
    .replace(/\b([a-zA-Z])[.\-_](?=[a-zA-Z]\b)/g, '$1')
    // Normalize newlines and multiple whitespace to single spaces
    .replace(/[\r\n]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .toLowerCase();

  // Replace compound number words first (longer matches), then single
  for (const [word, digits] of Object.entries(COMPOUND_NUMBER_WORDS)) {
    s = s.replace(new RegExp(`\\b${word}\\b`, 'gi'), digits);
  }
  for (const [word, digit] of Object.entries(NUMBER_WORDS)) {
    s = s.replace(new RegExp(`\\b${word}\\b`, 'gi'), digit);
  }

  return s;
}

/**
 * Normalize specifically for digit extraction:
 *   - Convert number words to digits
 *   - Strip all non-digit chars
 *   - Return the digit string
 */
function extractDigits(msg: string): string {
  let s = msg.toLowerCase().replace(/[\r\n]+/g, ' ');
  // Replace compound number words first, then single
  for (const [word, digits] of Object.entries(COMPOUND_NUMBER_WORDS)) {
    s = s.replace(new RegExp(`\\b${word}\\b`, 'gi'), digits);
  }
  for (const [word, digit] of Object.entries(NUMBER_WORDS)) {
    s = s.replace(new RegExp(`\\b${word}\\b`, 'gi'), digit);
  }
  return s.replace(/\D/g, '');
}

/**
 * Remove spaces between single characters: "g m a i l" → "gmail"
 */
function collapseSpacedChars(msg: string): string {
  // Match sequences like "a b c d e" (single chars separated by spaces)
  return msg.replace(/\b([a-zA-Z0-9])\s+(?=[a-zA-Z0-9]\b)/g, '$1');
}

// ============================================
// EMAIL DETECTION
// ============================================

const EMAIL_PATTERNS = [
  // Standard email: user@domain.com
  /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/i,
  // Obfuscated: user [at] domain [dot] com
  /[a-zA-Z0-9._%+\-]+\s*[\[\(]\s*at\s*[\]\)]\s*[a-zA-Z0-9.\-]+\s*[\[\(]\s*dot\s*[\]\)]\s*[a-zA-Z]{2,}/i,
  // Spaced: user (at) domain (dot) com
  /[a-zA-Z0-9._%+\-]+\s*\(\s*at\s*\)\s*[a-zA-Z0-9.\-]+\s*\(\s*dot\s*\)\s*[a-zA-Z]{2,}/i,
  // Simple obfuscation: user at domain dot com
  /[a-zA-Z0-9._%+\-]+\s+at\s+[a-zA-Z0-9.\-]+\s+dot\s+[a-zA-Z]{2,}/i,
];

/** Email provider names — "my gmail is...", "send me on gmail", "email me at yahoo" */
const EMAIL_PROVIDER_PATTERNS = [
  /\b(?:my|send|email|mail)\s*(?:me\s+)?(?:on|at|to|is|:)?\s*[a-zA-Z0-9._]+\s*(?:at|@)\s*(?:gmail|yahoo|hotmail|outlook|icloud|proton|aol)/i,
  // "my gmail/yahoo is <username>" — provider before username
  /\b(?:my\s+)?(?:gmail|yahoo|hotmail|outlook|icloud|proton|aol)\s+(?:is|:|-|=)\s*[a-zA-Z0-9._]+/i,
  // "email me at/on gmail/yahoo"
  /\b(?:email|mail|send)\s+(?:me\s+)?(?:at|on|to|via)\s+(?:gmail|yahoo|hotmail|outlook|icloud|proton|aol)/i,
];

// ============================================
// PHONE NUMBER DETECTION
// ============================================

const PHONE_PATTERNS = [
  // International format: +250791876060, +1-555-123-4567
  /\+\d[\d\s\-().]{7,}/,
  // Local format starting with 0: 0791876060, 07-918-76060
  /\b0\d[\d\s\-().]{7,}/,
  // Digits with separators: 250 791 876 060, 250-791-876-060
  /\b\d{3}[\s\-.]?\d{3}[\s\-.]?\d{3,4}\b/,
  // Spaced out digits to evade: 0 7 9 1 8 7 6 0 6 0
  /\b\d\s\d\s\d\s\d\s\d\s\d\s\d[\s\d]{3,}/,
  // WhatsApp/call me patterns with digits
  /(?:whatsapp|call|text|sms|viber|telegram)\s*(?:me\s*)?(?:on|at|:)?\s*[\+\d][\d\s\-().]{6,}/i,
  // "My number is" / "reach me at" + digits
  /(?:my\s+(?:number|phone|cell|mobile|tel)\s+(?:is|:))\s*[\+\d][\d\s\-().]{6,}/i,
  // "Call me" / "text me" without explicit platform
  /(?:call|text|ring|dial)\s+me\s+(?:on\s+)?[\+\d][\d\s\-().]{6,}/i,
];

/** All number word names for regex building */
const ALL_NUM_WORD_NAMES = 'zero|one|two|three|four|five|six|seven|eight|nine|oh|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred';

/** Detect number-word phone numbers across spaces, newlines, hyphens, commas */
const NUMBER_WORD_PATTERN = new RegExp(
  `\\b(?:${ALL_NUM_WORD_NAMES})(?:[\\s,;:\\-\\n\\r]+(?:${ALL_NUM_WORD_NAMES})){6,}\\b`,
  'i'
);

// ============================================
// EXTERNAL LINK DETECTION
// ============================================

const LINK_PATTERNS = [
  // URLs: http://, https://, www.
  /https?:\/\/[^\s]+/i,
  /www\.[^\s]+/i,
  // Domain patterns: something.com, something.rw, etc.
  /\b[a-zA-Z0-9\-]+\.(com|net|org|io|co|rw|ke|ug|tz|me|info|biz|app|dev|xyz|site|online|shop|store)\b/i,
  // Social media handles/links
  /(?:instagram|facebook|twitter|tiktok|snapchat|linkedin|youtube|whatsapp)\.com\/[^\s]*/i,
  // Social media handle patterns
  /(?:(?:ig|insta|fb|twitter|tiktok|snap|linkedin)\s*[:;]\s*@?)[a-zA-Z0-9._]+/i,
  // "Find me on" / "DM me on" / "hit me up on" / "look me up on" / "search for me on"
  /(?:find|reach|contact|dm|message|hit|add|text)\s+me\s+(?:up\s+)?(?:on|at|via)\s+(?:instagram|facebook|twitter|tiktok|snapchat|whatsapp|telegram|viber|signal)/i,
  // "search for me on" / "look me up on"
  /(?:search|look)\s+(?:for\s+)?me\s+(?:up\s+)?(?:on|at)\s+(?:instagram|ig|facebook|fb|twitter|tiktok|snapchat|whatsapp|telegram|viber|signal)/i,
  // "My insta/ig/fb is..." patterns
  /(?:my\s+)?(?:insta|ig|fb|twitter|tiktok|snap|snapchat|whatsapp)\s+(?:is|:|-|=)\s*@?[a-zA-Z0-9._]+/i,
  // "my handle/username is X on Y" patterns
  /(?:my\s+)?(?:handle|username|account|profile)\s+(?:is|:)\s*@?[a-zA-Z0-9._]+\s+on\s+(?:instagram|ig|facebook|fb|twitter|tiktok|snapchat|whatsapp|telegram)/i,
  // "on IG/insta/FB" with handle nearby
  /@[a-zA-Z0-9._]+\s+on\s+(?:ig|insta|instagram|fb|facebook|twitter|tiktok|snap|snapchat)/i,
];

/** Social media platform names alone (used with collapsed-space check) */
const SOCIAL_DOMAIN_COLLAPSED = /(?:gmail|yahoo|hotmail|outlook|instagram|facebook|whatsapp|telegram|tiktok|snapchat|twitter|linkedin|youtube)\s*\.\s*(?:com|org|net)/i;

// ============================================
// WHITELIST — allow these through
// ============================================

function isWhitelisted(text: string): boolean {
  // Connekt platform URLs
  if (/connekyt\.com/i.test(text) || /connekt\./i.test(text)) return true;
  return false;
}

/** Check if a matched string is safe (date, time, price, etc.) */
function isSafeNumberContext(message: string, matchStr: string): boolean {
  const idx = message.indexOf(matchStr);
  if (idx < 0) return false;
  // Check surrounding context for price/date/time indicators
  const before = message.slice(Math.max(0, idx - 15), idx).toLowerCase();
  const after = message.slice(idx + matchStr.length, idx + matchStr.length + 10).toLowerCase();
  // Price context
  if (/(?:rwf|usd|kes|eur|ugx|tzs|price|cost|fee|pay|amount|\$|€|£)\s*$/i.test(before)) return true;
  if (/^\s*(?:rwf|usd|kes|eur|ugx|tzs|frw|\/=)/i.test(after)) return true;
  // Date context
  if (/\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/.test(matchStr)) return true;
  // Time context
  if (/^\d{1,2}:\d{2}$/.test(matchStr.trim())) return true;
  return false;
}

// ============================================
// MAIN FILTER FUNCTION
// ============================================

export function checkMessageContent(message: string): FilterResult {
  const trimmed = message.trim();
  if (!trimmed) return { blocked: false, reason: null, detectedType: null };

  // Prepare normalized variants
  const normalized = normalizeForTextCheck(trimmed);
  const collapsed = collapseSpacedChars(normalized);
  const allDigits = extractDigits(trimmed);

  // --- EMAIL CHECKS ---

  // Check standard patterns on raw + normalized + collapsed
  for (const variant of [trimmed, normalized, collapsed]) {
    for (const pattern of EMAIL_PATTERNS) {
      const match = variant.match(pattern);
      if (match && !isWhitelisted(match[0])) {
        return {
          blocked: true,
          reason: 'Sharing email addresses is not allowed. Please keep all communication within the platform.',
          detectedType: 'email',
        };
      }
    }
  }

  // "My gmail is..." / "email me at yahoo" patterns
  for (const variant of [trimmed, normalized]) {
    if (EMAIL_PROVIDER_PATTERNS.some(p => p.test(variant))) {
      return {
        blocked: true,
        reason: 'Sharing email addresses is not allowed. Please keep all communication within the platform.',
        detectedType: 'email',
      };
    }
  }

  // --- PHONE NUMBER CHECKS ---

  // Check standard patterns on raw + normalized
  for (const variant of [trimmed, normalized]) {
    for (const pattern of PHONE_PATTERNS) {
      const match = variant.match(pattern);
      if (match) {
        const digits = match[0].replace(/\D/g, '');
        if (digits.length >= 7 && !isSafeNumberContext(variant, match[0])) {
          return {
            blocked: true,
            reason: 'Sharing phone numbers is not allowed. Please keep all communication within the platform.',
            detectedType: 'phone',
          };
        }
      }
    }
  }

  // Number-word phone: "zero seven nine one eight seven six zero six zero"
  if (NUMBER_WORD_PATTERN.test(trimmed) || NUMBER_WORD_PATTERN.test(normalized)) {
    return {
      blocked: true,
      reason: 'Sharing phone numbers is not allowed. Please keep all communication within the platform.',
      detectedType: 'phone',
    };
  }

  // Long contiguous sequence of number words (single or compound): "two fifty seven eight one..."
  // Split on whitespace, newlines, hyphens, commas — check for runs of 7+ number words
  // Compound words like "fifty" count as number words too
  {
    const allNumWordRe = new RegExp(`^(?:${ALL_NUM_WORD_NAMES})$`, 'i');
    // Normalize: collapse newlines to spaces, split on separators
    const flatMessage = trimmed.replace(/[\r\n]+/g, ' ').toLowerCase();
    const words = flatMessage.split(/[\s\-,;:]+/).filter(w => w.length > 0);
    let maxRun = 0, currentRun = 0, runDigits = '';
    for (const w of words) {
      if (allNumWordRe.test(w)) {
        currentRun++;
        runDigits += ALL_NUMBER_WORDS[w] || '';
        if (currentRun > maxRun) maxRun = currentRun;
      } else {
        // Check accumulated digits from the run
        if (runDigits.replace(/\D/g, '').length >= 7) {
          return {
            blocked: true,
            reason: 'Sharing phone numbers is not allowed. Please keep all communication within the platform.',
            detectedType: 'phone',
          };
        }
        currentRun = 0;
        runDigits = '';
      }
    }
    // Check final run
    if (maxRun >= 4 && runDigits.replace(/\D/g, '').length >= 7) {
      return {
        blocked: true,
        reason: 'Sharing phone numbers is not allowed. Please keep all communication within the platform.',
        detectedType: 'phone',
      };
    }
    if (maxRun >= 7) {
      return {
        blocked: true,
        reason: 'Sharing phone numbers is not allowed. Please keep all communication within the platform.',
        detectedType: 'phone',
      };
    }
  }

  // Collapsed-space digit check: "0 7 9 1 8 7 6 0 6 0" collapsed → "0791876060"
  const collapsedDigits = collapsed.replace(/\D/g, '');
  if (collapsedDigits.length >= 10 && collapsedDigits.length > allDigits.length) {
    // Spaces were separating individual digits — likely a phone number
    return {
      blocked: true,
      reason: 'Sharing phone numbers is not allowed. Please keep all communication within the platform.',
      detectedType: 'phone',
    };
  }

  // --- LINK CHECKS ---

  for (const variant of [trimmed, normalized, collapsed]) {
    for (const pattern of LINK_PATTERNS) {
      const match = variant.match(pattern);
      if (match && !isWhitelisted(match[0])) {
        return {
          blocked: true,
          reason: 'Sharing external links is not allowed. Please keep all communication within the platform.',
          detectedType: 'link',
        };
      }
    }
  }

  // Spaced-out social domains: "g m a i l . c o m" or "i n s t a g r a m . c o m"
  if (SOCIAL_DOMAIN_COLLAPSED.test(collapsed) && !SOCIAL_DOMAIN_COLLAPSED.test(trimmed)) {
    return {
      blocked: true,
      reason: 'Sharing external links is not allowed. Please keep all communication within the platform.',
      detectedType: 'link',
    };
  }

  return { blocked: false, reason: null, detectedType: null };
}
