import { checkMessageContent } from './messageFilter.js';

const tests: [string, boolean, string][] = [
  // ========================================
  // BASIC — should all be caught
  // ========================================
  ['test@gmail.com', true, 'basic email'],
  ['0791876060', true, 'basic phone'],
  ['https://instagram.com/me', true, 'basic link'],

  // ========================================
  // EMAIL EVASION ATTEMPTS
  // ========================================
  ['user [at] gmail [dot] com', true, 'email bracket obfuscation'],
  ['user (at) gmail (dot) com', true, 'email paren obfuscation'],
  ['user at gmail dot com', true, 'email word obfuscation'],
  ['my gmail is photog_john', true, 'provider-first email'],
  ['my yahoo is coolshooter99', true, 'yahoo provider-first'],
  ['email me at gmail', true, 'email me at provider'],
  ['send me on hotmail', true, 'send me on provider'],
  ['my outlook is john.smith', true, 'outlook provider'],
  ['u s e r @ g m a i l . c o m', true, 'fully spaced email'],
  ['test@yahoo.com is my mail', true, 'email in sentence'],

  // ========================================
  // PHONE EVASION ATTEMPTS
  // ========================================
  ['+250 791 876 060', true, 'spaced international'],
  ['0 7 9 1 8 7 6 0 6 0', true, 'fully spaced phone'],
  ['zero seven nine one eight seven six zero six zero', true, 'number words'],
  ['oh seven nine one eight seven six oh six oh', true, 'oh for zero'],
  ['call me on +250791876060', true, 'call me pattern'],
  ['whatsapp: 0791876060', true, 'whatsapp with colon'],
  ['text me 0791876060', true, 'text me pattern'],
  ['my number is +250791876060', true, 'my number is'],
  ['my cell is 0791876060', true, 'my cell is'],
  ['tel: 0791876060', true, 'tel prefix'],
  ['(079) 187-6060', true, 'US-style formatting'],
  ['250-791-876-060', true, 'dashed international'],
  ['sms me at 0791876060', true, 'sms me pattern'],
  ['viber 0791876060', true, 'viber + number'],
  ['telegram me 0791876060', true, 'telegram + number'],

  // ========================================
  // LINK EVASION ATTEMPTS
  // ========================================
  ['instagram.com/myphotos', true, 'bare instagram link'],
  ['facebook.com/profile', true, 'bare facebook link'],
  ['www.myphotography.com', true, 'www link'],
  ['check out mysite.io', true, 'short domain .io'],
  ['myportfolio.app', true, 'domain .app'],
  ['ig: @coolphotographer', true, 'ig handle pattern'],
  ['insta: @my_photos', true, 'insta handle pattern'],
  ['fb: @john.doe', true, 'fb handle pattern'],
  ['tiktok: @dancephoto', true, 'tiktok handle pattern'],
  ['find me on instagram', true, 'find me on social'],
  ['reach me on whatsapp', true, 'reach me on whatsapp'],
  ['dm me on twitter', true, 'dm me on twitter'],
  ['add me on snapchat', true, 'add me on snapchat'],
  ['contact me via telegram', true, 'contact via telegram'],
  ['my insta is @photo_king', true, 'my insta is'],
  ['my tiktok is @danceking', true, 'my tiktok is'],
  ['my whatsapp is active', true, 'my whatsapp is'],
  ['g m a i l . c o m', true, 'spaced gmail.com'],
  ['i n s t a g r a m . c o m', true, 'spaced instagram.com'],
  ['youtube.com/channel/mine', true, 'youtube link'],
  ['linkedin.com/in/myprofile', true, 'linkedin link'],
  ['mysite.online', true, 'domain .online'],
  ['booking.site', true, 'domain .site'],
  ['photo.store', true, 'domain .store'],

  // ========================================
  // SHOULD PASS — legitimate messages
  // ========================================
  ['Hello, how are you?', false, 'greeting'],
  ['The event is on 12/03/2026', false, 'date'],
  ['Meeting at 14:00', false, 'time'],
  ['Price is RWF 5000', false, 'price RWF'],
  ['It costs USD 200', false, 'price USD'],
  ['connekyt.com/event/123', false, 'platform URL'],
  ['I have 50 photos ready', false, 'number in sentence'],
  ['Room 203 building A', false, 'room number'],
  ['Great photos! Love the lighting', false, 'compliment'],
  ['Can we reschedule to next week?', false, 'scheduling'],
  ['The venue fits 500 guests', false, 'guest count'],
  ['I need 3 albums printed', false, 'quantity'],
  ['Let me know by tomorrow', false, 'follow-up'],
  ['What camera do you use?', false, 'question'],
  ['The 2nd batch of 45 photos is ready', false, 'batch numbers'],
  ['Event #12345 confirmed', false, 'event reference'],
  ['ISO 800, f/2.8, 1/200s', false, 'camera settings'],
  ['Table 5 seat 12', false, 'seating info'],
  ['Flight RW 204 arrives at 3pm', false, 'flight info'],
  ['Invoice total: 15000', false, 'invoice amount'],
];

let pass = 0;
let fail = 0;
const failures: string[] = [];

for (const [msg, shouldBlock, label] of tests) {
  const r = checkMessageContent(msg);
  if (r.blocked === shouldBlock) {
    pass++;
  } else {
    fail++;
    failures.push(
      `  FAIL [${label}]: "${msg}"\n` +
      `    Expected: blocked=${shouldBlock}\n` +
      `    Got:      blocked=${r.blocked} (${r.detectedType || 'none'})`
    );
  }
}

console.log('='.repeat(50));
console.log('MESSAGE FILTER STRESS TEST');
console.log('='.repeat(50));
if (failures.length > 0) {
  console.log(`\n${failures.join('\n\n')}\n`);
}
console.log(`${pass}/${tests.length} passed${fail > 0 ? ` — ${fail} FAILED` : ''}`);
console.log(`Strength: ${Math.round(pass / tests.length * 100)}%`);
console.log('='.repeat(50));
