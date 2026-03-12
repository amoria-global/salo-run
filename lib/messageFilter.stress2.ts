import { checkMessageContent } from './messageFilter.js';

const tests: [string, boolean, string][] = [
  // ========================================
  // ADVANCED EVASION — really tricky attempts
  // ========================================

  // Phone with mixed separators
  ['07.91.87.60.60', true, 'dotted phone'],
  ['(+250) 791-876-060', true, 'parens + dashes phone'],
  ['my tel: zero-seven-nine-one-eight-seven-six-zero-six-zero', true, 'hyphenated number words'],

  // Hiding phone in a sentence
  ['just dial 0791876060 when ready', true, 'phone buried in sentence'],
  ['here is my contact 0791876060 thanks', true, 'phone mid-sentence'],

  // Email with creative spacing
  ['john dot doe at gmail dot com', true, 'full word email'],

  // Social with creative phrasing
  ['search for me as @photokid on IG', true, 'search for me on IG'],
  ['look me up on instagram my handle is photokid', true, 'look me up on instagram'],
  ['hit me up on facebook', true, 'hit me up on facebook'],
  ['message me on signal', true, 'message me on signal'],

  // Direct social URLs without protocol
  ['whatsapp.com/send?phone=250791876060', true, 'whatsapp direct link'],
  ['t.me/myusername', true, 'telegram short link (.me domain)'],

  // Phone with "plus" word
  ['plus two five zero seven nine one eight seven six zero six zero', true, 'plus + number words'],

  // Domain with subdomains
  ['photos.mysite.com', true, 'subdomain link'],
  ['portfolio.photographer.io', true, 'portfolio .io link'],

  // Numbers disguised in sentences
  ['I am at building zero seven nine, room one eight seven, floor six zero six zero', false, 'address-like numbers (should pass — contextual)'],

  // ========================================
  // TRICKY FALSE POSITIVES — should PASS
  // ========================================
  ['I shot at f/1.8 and ISO 6400', false, 'camera settings with "at"'],
  ['The package costs one thousand five hundred', false, 'price in words'],
  ['We need five hundred chairs for the event', false, 'quantity in words (only 1 number word)'],
  ['Meet me at the venue at 5pm', false, '"at" in normal context'],
  ['At this point I think we should cancel', false, '"at" sentence start'],
  ['I ate at the restaurant nearby', false, '"at" + "ate" words'],
  ['The address is 25 KN 4 Ave', false, 'street address'],
  ['Shot on Canon 5D Mark IV at ISO 100', false, 'camera gear with numbers'],
  ['Delivered 250 edited photos today', false, '250 as count not code'],
  ['Row 7, Seat 14 at the venue', false, 'seating with "at"'],
  ['The competition has 3 stages', false, 'simple number in context'],
  ['I use Lightroom version 12.5', false, 'software version number'],
  ['Check the connekyt.com page', false, 'platform URL allowed'],
  ['Two more days until the event', false, 'number word but just one'],
  ['I have three cameras ready', false, 'number word singular'],
  ['Between four and six hours needed', false, 'number word range (only 2 words)'],
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
      `    Got:      blocked=${r.blocked} (${r.detectedType || 'none'} — ${r.reason || ''})`
    );
  }
}

console.log('='.repeat(55));
console.log('ADVANCED EVASION + FALSE POSITIVE STRESS TEST');
console.log('='.repeat(55));
if (failures.length > 0) {
  console.log(`\n${failures.join('\n\n')}\n`);
}
console.log(`${pass}/${tests.length} passed${fail > 0 ? ` — ${fail} FAILED` : ''}`);
console.log(`Strength: ${Math.round(pass / tests.length * 100)}%`);
console.log('='.repeat(55));
