// Zaura Calculation Engine — 20 mystical modalities computed from birth data
// All calculations are deterministic. Astronomical positions use mean-longitude
// approximations (accurate enough for sign-level readings; labeled approximate).

// ---------- core date math ----------
export function jdn(y, m, d) {
  const a = Math.floor((14 - m) / 12);
  const y2 = y + 4800 - a;
  const m2 = m + 12 * a - 3;
  return d + Math.floor((153 * m2 + 2) / 5) + 365 * y2 + Math.floor(y2 / 4) - Math.floor(y2 / 100) + Math.floor(y2 / 400) - 32045;
}
const mod = (n, m) => ((n % m) + m) % m;
const digitSum = (n) => String(Math.abs(n)).split('').reduce((a, c) => a + Number(c), 0);
function reduceNum(n, keepMasters = true) {
  while (n > 9 && !(keepMasters && (n === 11 || n === 22 || n === 33))) n = digitSum(n);
  return n;
}
const toSingle = (n) => (n === 11 ? 2 : n === 22 ? 4 : n === 33 ? 6 : n);

function parseBirth(profile) {
  const [y, m, d] = profile.birthDate.split('-').map(Number);
  let hour = 12, minute = 0, hasTime = false;
  if (profile.birthTime) {
    const t = profile.birthTime.split(':').map(Number);
    hour = t[0]; minute = t[1] || 0; hasTime = true;
  }
  const J = jdn(y, m, d);
  const n = J - 2451545 + (hour + minute / 60 - 12) / 24; // days since J2000
  return { y, m, d, hour, minute, hasTime, J, n };
}
const sunLongitude = (n) => mod(280.46 + 0.9856474 * n, 360);
const moonLongitude = (n) => mod(218.316 + 13.176396 * n, 360);

// ---------- shared tables ----------
const SIGNS = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const SIGN_GLYPHS = ['\u2648','\u2649','\u264A','\u264B','\u264C','\u264D','\u264E','\u264F','\u2650','\u2651','\u2652','\u2653'];
const ELEMENTS = ['Fire','Earth','Air','Water','Fire','Earth','Air','Water','Fire','Earth','Air','Water'];
const MODALITIES = ['Cardinal','Fixed','Mutable','Cardinal','Fixed','Mutable','Cardinal','Fixed','Mutable','Cardinal','Fixed','Mutable'];
const RULERS = ['Mars','Venus','Mercury','Moon','Sun','Mercury','Venus','Pluto (Mars)','Jupiter','Saturn','Uranus (Saturn)','Neptune (Jupiter)'];
const SIGN_TRAITS = [
  'bold, pioneering, direct — you ignite what others only imagine',
  'grounded, sensual, steadfast — you build beauty that endures',
  'curious, quick, expressive — you weave ideas into connection',
  'intuitive, nurturing, protective — you feel the tides others miss',
  'radiant, generous, dramatic — you were born to shine',
  'precise, devoted, discerning — you perfect what you touch',
  'harmonizing, graceful, fair — you balance every scale',
  'intense, magnetic, transformative — you see beneath every surface',
  'adventurous, honest, expansive — you aim your arrow at truth',
  'ambitious, disciplined, wise — you climb every mountain',
  'visionary, original, humanitarian — you belong to the future',
  'dreamy, compassionate, mystical — you dissolve every boundary',
];
// Sun sign by calendar ranges (cusp-safe)
function sunSignIndex(m, d) {
  const edges = [[3,21],[4,20],[5,21],[6,21],[7,23],[8,23],[9,23],[10,23],[11,22],[12,22],[1,20],[2,19]];
  for (let i = 0; i < 12; i++) {
    const [sm, sd] = edges[i];
    const [em, ed] = edges[(i + 1) % 12];
    const afterStart = m > sm || (m === sm && d >= sd);
    const beforeEnd = m < em || (m === em && d < ed);
    if (sm < em ? afterStart && beforeEnd : afterStart || beforeEnd) return i;
  }
  return 9;
}
const inRange = (m, d, ranges) => ranges.some(([sm, sd, em, ed]) => {
  if (sm === em) return m === sm && d >= sd && d <= ed;
  if (sm < em) return (m === sm && d >= sd) || (m === em && d <= ed) || (m > sm && m < em);
  return (m === sm && d >= sd) || (m === em && d <= ed) || m > sm || m < em;
});

const HEXAGRAMS = ['The Creative|initiating power','The Receptive|devoted yielding','Difficulty at the Beginning|sprouting through struggle','Youthful Folly|learning through inexperience','Waiting|patient nourishment','Conflict|principled tension','The Army|disciplined purpose','Holding Together|union and alliance','Small Taming|gentle restraint','Treading|careful conduct','Peace|heaven and earth in harmony','Standstill|creative pause','Fellowship|community of kindred souls','Great Possession|abundant sovereignty','Modesty|power carried lightly','Enthusiasm|inspired momentum','Following|adaptive flow','Work on the Decayed|repairing what was spoiled','Approach|rising benevolence','Contemplation|watchful presence','Biting Through|decisive clarity','Grace|beauty of form','Splitting Apart|necessary release','Return|the turning point','Innocence|unexpected purity','Great Taming|contained strength','Nourishment|feeding body and soul','Great Excess|extraordinary pressure','The Abysmal|mastery of depths','The Clinging|radiant attachment','Influence|wooing attraction','Duration|enduring commitment','Retreat|strategic withdrawal','Great Power|thunder in heaven','Progress|dawning advance','Darkening of the Light|inner light concealed','The Family|sacred belonging','Opposition|polarity seeking union','Obstruction|the pause before the pass','Deliverance|release of tension','Decrease|sacrifice that enriches','Increase|generous expansion','Breakthrough|resolute declaration','Coming to Meet|magnetic encounter','Gathering|massing of energies','Pushing Upward|steady ascent','Oppression|exhaustion that refines','The Well|inexhaustible source','Revolution|molting into new form','The Cauldron|alchemical transformation','The Arousing|shock that awakens','Keeping Still|mountain stillness','Development|gradual unfolding','The Marrying Maiden|subordinate passion','Abundance|zenith of fullness','The Wanderer|sacred journey','The Gentle|penetrating wind','The Joyous|open-hearted delight','Dispersion|dissolving rigidity','Limitation|liberating boundaries','Inner Truth|resonant sincerity','Small Excess|humble transcendence','After Completion|order achieved','Before Completion|the eternal threshold'];
const MAJOR_ARCANA = ['The Fool','The Magician','The High Priestess','The Empress','The Emperor','The Hierophant','The Lovers','The Chariot','Strength','The Hermit','Wheel of Fortune','Justice','The Hanged Man','Death','Temperance','The Devil','The Tower','The Star','The Moon','The Sun','Judgement','The World'];
const ARCANA_THEMES = ['leap of faith and pure potential','willpower and manifestation','intuition and hidden knowledge','creation, nurture and abundance','structure, authority and order','tradition, teaching and wisdom','choice, union and values','victory through determination','courage and gentle mastery','solitude and inner guidance','cycles, destiny and turning luck','truth, fairness and cause-effect','surrender and new perspective','transformation and rebirth','alchemy, balance and patience','shadow work and liberation','sudden awakening and upheaval','hope, healing and renewal','dreams, illusion and the subconscious','vitality, joy and success','reckoning and rebirth of purpose','completion and cosmic wholeness'];

// ---------- geocoding (built-in city lookup) ----------
export const CITIES = [
  { name: 'New York, USA', lat: 40.71, lng: -74.01 }, { name: 'Los Angeles, USA', lat: 34.05, lng: -118.24 },
  { name: 'Chicago, USA', lat: 41.88, lng: -87.63 }, { name: 'Houston, USA', lat: 29.76, lng: -95.37 },
  { name: 'Miami, USA', lat: 25.76, lng: -80.19 }, { name: 'Toronto, Canada', lat: 43.65, lng: -79.38 },
  { name: 'Vancouver, Canada', lat: 49.28, lng: -123.12 }, { name: 'Mexico City, Mexico', lat: 19.43, lng: -99.13 },
  { name: 'S\u00e3o Paulo, Brazil', lat: -23.55, lng: -46.63 }, { name: 'Buenos Aires, Argentina', lat: -34.60, lng: -58.38 },
  { name: 'London, UK', lat: 51.51, lng: -0.13 }, { name: 'Paris, France', lat: 48.86, lng: 2.35 },
  { name: 'Berlin, Germany', lat: 52.52, lng: 13.40 }, { name: 'Madrid, Spain', lat: 40.42, lng: -3.70 },
  { name: 'Rome, Italy', lat: 41.90, lng: 12.50 }, { name: 'Amsterdam, Netherlands', lat: 52.37, lng: 4.90 },
  { name: 'Lisbon, Portugal', lat: 38.72, lng: -9.14 }, { name: 'Athens, Greece', lat: 37.98, lng: 23.73 },
  { name: 'Istanbul, Turkey', lat: 41.01, lng: 28.98 }, { name: 'Moscow, Russia', lat: 55.76, lng: 37.62 },
  { name: 'Dubai, UAE', lat: 25.20, lng: 55.27 }, { name: 'Mumbai, India', lat: 19.08, lng: 72.88 },
  { name: 'Delhi, India', lat: 28.61, lng: 77.21 }, { name: 'Bangalore, India', lat: 12.97, lng: 77.59 },
  { name: 'Singapore', lat: 1.35, lng: 103.82 }, { name: 'Hong Kong', lat: 22.32, lng: 114.17 },
  { name: 'Tokyo, Japan', lat: 35.68, lng: 139.69 }, { name: 'Seoul, South Korea', lat: 37.57, lng: 126.98 },
  { name: 'Beijing, China', lat: 39.90, lng: 116.41 }, { name: 'Shanghai, China', lat: 31.23, lng: 121.47 },
  { name: 'Bangkok, Thailand', lat: 13.76, lng: 100.50 }, { name: 'Jakarta, Indonesia', lat: -6.21, lng: 106.85 },
  { name: 'Manila, Philippines', lat: 14.60, lng: 120.98 }, { name: 'Sydney, Australia', lat: -33.87, lng: 151.21 },
  { name: 'Melbourne, Australia', lat: -37.81, lng: 144.96 }, { name: 'Auckland, New Zealand', lat: -36.85, lng: 174.76 },
  { name: 'Cairo, Egypt', lat: 30.04, lng: 31.24 }, { name: 'Lagos, Nigeria', lat: 6.52, lng: 3.38 },
  { name: 'Nairobi, Kenya', lat: -1.29, lng: 36.82 }, { name: 'Johannesburg, South Africa', lat: -26.20, lng: 28.05 },
  { name: 'Tel Aviv, Israel', lat: 32.09, lng: 34.78 }, { name: 'Karachi, Pakistan', lat: 24.86, lng: 67.01 },
  { name: 'Dhaka, Bangladesh', lat: 23.81, lng: 90.41 }, { name: 'Kyiv, Ukraine', lat: 50.45, lng: 30.52 },
  { name: 'Warsaw, Poland', lat: 52.23, lng: 21.01 }, { name: 'Stockholm, Sweden', lat: 59.33, lng: 18.07 },
  { name: 'Dublin, Ireland', lat: 53.35, lng: -6.26 }, { name: 'Zurich, Switzerland', lat: 47.38, lng: 8.54 },
];
export function geocodeCity(input) {
  if (!input) return null;
  const q = input.toLowerCase().trim();
  const hit = CITIES.find((c) => c.name.toLowerCase() === q) || CITIES.find((c) => c.name.toLowerCase().startsWith(q)) || CITIES.find((c) => c.name.toLowerCase().includes(q));
  return hit ? { lat: hit.lat, lng: hit.lng, matched: hit.name } : null;
}

// ---------- name numerology helpers ----------
const letterVal = (ch) => ((ch.toUpperCase().charCodeAt(0) - 65) % 9) + 1;
const onlyLetters = (s) => (s || '').replace(/[^a-zA-Z]/g, '');
const VOWELS = 'AEIOU';
function nameNumber(name, filter) {
  const letters = onlyLetters(name).toUpperCase().split('').filter(filter || (() => true));
  if (!letters.length) return 0;
  return reduceNum(letters.reduce((a, ch) => a + letterVal(ch), 0));
}

// =====================================================================
// MODALITY CALCULATORS — each returns { id, name, category, icon, headline, summary, sections }
// =====================================================================

function calcWestern(b) {
  const si = sunSignIndex(b.m, b.d);
  const moonIdx = Math.floor(moonLongitude(b.n) / 30);
  const rising = b.hasTime ? (si + Math.floor(mod(b.hour - 6, 24) / 2)) % 12 : null;
  return {
    id: 'western', name: 'Western Astrology', category: 'Astrology', icon: SIGN_GLYPHS[si],
    headline: `${SIGNS[si]} Sun` + (b.hasTime ? ` \u00b7 ${SIGNS[rising]} Rising` : ''),
    summary: `Sun in ${SIGNS[si]}, Moon in ${SIGNS[moonIdx]}${b.hasTime ? `, ${SIGNS[rising]} Rising` : ''} — ${SIGN_TRAITS[si]}.`,
    sections: [
      { label: 'Sun Sign', value: `${SIGNS[si]} ${SIGN_GLYPHS[si]}`, text: `Your core identity. ${SIGNS[si]} is ${ELEMENTS[si]} \u00b7 ${MODALITIES[si]}, ruled by ${RULERS[si]}. You are ${SIGN_TRAITS[si]}.` },
      { label: 'Moon Sign (approx.)', value: `${SIGNS[moonIdx]} ${SIGN_GLYPHS[moonIdx]}`, text: `Your emotional inner world. The ${SIGNS[moonIdx]} Moon feels in a ${ELEMENTS[moonIdx].toLowerCase()} way: ${SIGN_TRAITS[moonIdx]}.` },
      b.hasTime
        ? { label: 'Rising Sign (approx.)', value: `${SIGNS[rising]} ${SIGN_GLYPHS[rising]}`, text: `The mask you wear and first impressions you give. ${SIGNS[rising]} rising makes you appear ${SIGN_TRAITS[rising].split(' — ')[0]}.` }
        : { label: 'Rising Sign', value: 'Unknown', text: 'Add your birth time to reveal your ascendant — the lens through which the world first meets you.' },
      { label: 'Element & Modality', value: `${ELEMENTS[si]} \u00b7 ${MODALITIES[si]}`, text: `${ELEMENTS[si]} signs live through ${ELEMENTS[si] === 'Fire' ? 'passion and action' : ELEMENTS[si] === 'Earth' ? 'the senses and results' : ELEMENTS[si] === 'Air' ? 'ideas and connection' : 'feeling and intuition'}; ${MODALITIES[si]} energy ${MODALITIES[si] === 'Cardinal' ? 'initiates' : MODALITIES[si] === 'Fixed' ? 'sustains' : 'adapts'}.` },
    ],
  };
}

function calcVedic(b) {
  const AYANAMSA = 24.1;
  const sidMoon = mod(moonLongitude(b.n) - AYANAMSA, 360);
  const sidSun = mod(sunLongitude(b.n) - AYANAMSA, 360);
  const rashi = Math.floor(sidMoon / 30);
  const sunRashi = Math.floor(sidSun / 30);
  const NAK = ['Ashwini','Bharani','Krittika','Rohini','Mrigashira','Ardra','Punarvasu','Pushya','Ashlesha','Magha','Purva Phalguni','Uttara Phalguni','Hasta','Chitra','Swati','Vishakha','Anuradha','Jyeshtha','Mula','Purva Ashadha','Uttara Ashadha','Shravana','Dhanishta','Shatabhisha','Purva Bhadrapada','Uttara Bhadrapada','Revati'];
  const nak = Math.floor(sidMoon / (360 / 27));
  const pada = Math.floor(mod(sidMoon, 360 / 27) / (360 / 108)) + 1;
  return {
    id: 'vedic', name: 'Vedic Astrology', category: 'Astrology', icon: '\u0950',
    headline: `${SIGNS[rashi]} Moon (Rashi)`,
    summary: `Your Rashi (sidereal Moon sign) is ${SIGNS[rashi]}, born under ${NAK[nak]} nakshatra, pada ${pada}.`,
    sections: [
      { label: 'Rashi — Moon Sign', value: SIGNS[rashi], text: `In Jyotish, the Moon sign governs the mind (manas). A ${SIGNS[rashi]} Moon colors your inner life with ${ELEMENTS[rashi].toLowerCase()} qualities: ${SIGN_TRAITS[rashi].split(' — ')[0]}.` },
      { label: 'Nakshatra', value: `${NAK[nak]} (pada ${pada})`, text: `Your lunar mansion, one of 27 star-fields the Moon crosses. ${NAK[nak]} shapes your instinctive nature, karma and deepest motivations.` },
      { label: 'Sidereal Sun', value: SIGNS[sunRashi], text: `Measured against the fixed stars (Lahiri ayanamsa \u2248 24\u00b0), your soul-purpose Sun sits in ${SIGNS[sunRashi]}.` },
      { label: 'Note', value: 'Approximation', text: 'Positions use mean longitudes — precise to the sign level for most charts. A full Jyotish chart adds houses, dashas and divisional charts.' },
    ],
  };
}

function calcChinese(b) {
  const effYear = b.m < 2 || (b.m === 2 && b.d < 4) ? b.y - 1 : b.y;
  const ANIMALS = ['Rat','Ox','Tiger','Rabbit','Dragon','Snake','Horse','Goat','Monkey','Rooster','Dog','Pig'];
  const AEMOJI = ['\uD83D\uDC00','\uD83D\uDC02','\uD83D\uDC05','\uD83D\uDC07','\uD83D\uDC09','\uD83D\uDC0D','\uD83D\uDC0E','\uD83D\uDC10','\uD83D\uDC12','\uD83D\uDC13','\uD83D\uDC15','\uD83D\uDC16'];
  const ATRAITS = ['clever, resourceful, quick-witted','dependable, patient, strong','brave, competitive, charismatic','gentle, elegant, alert','confident, ambitious, magnetic','wise, enigmatic, intuitive','energetic, free-spirited, warm','calm, creative, kind','witty, curious, inventive','observant, hardworking, candid','loyal, honest, protective','generous, diligent, sincere'];
  const ELS = ['Wood','Fire','Earth','Metal','Water'];
  const ai = mod(effYear - 4, 12);
  const el = ELS[Math.floor(mod(effYear - 4, 10) / 2)];
  const yy = effYear % 2 === 0 ? 'Yang' : 'Yin';
  return {
    id: 'chinese', name: 'Chinese Zodiac', category: 'Astrology', icon: AEMOJI[ai],
    headline: `${el} ${ANIMALS[ai]}`,
    summary: `You are the ${yy} ${el} ${ANIMALS[ai]} — ${ATRAITS[ai]}.`,
    sections: [
      { label: 'Animal Sign', value: `${ANIMALS[ai]} ${AEMOJI[ai]}`, text: `Born in the year of the ${ANIMALS[ai]}: ${ATRAITS[ai]}. This animal shapes your social destiny and life rhythm.` },
      { label: 'Element', value: el, text: `The ${el} element refines your animal: ${el === 'Wood' ? 'growth, idealism and cooperation' : el === 'Fire' ? 'passion, dynamism and leadership' : el === 'Earth' ? 'stability, honesty and prudence' : el === 'Metal' ? 'determination, precision and ambition' : 'wisdom, flexibility and depth'}.` },
      { label: 'Polarity', value: yy, text: `${yy} energy: ${yy === 'Yang' ? 'active, outward, initiating' : 'receptive, inward, magnetic'}.` },
      { label: 'Allies', value: `${ANIMALS[mod(ai + 4, 12)]} & ${ANIMALS[mod(ai + 8, 12)]}`, text: `Your trine harmony: you flow naturally with ${ANIMALS[mod(ai + 4, 12)]} and ${ANIMALS[mod(ai + 8, 12)]}. Your challenge sign is ${ANIMALS[mod(ai + 6, 12)]}.` },
    ],
  };
}

function calcCeltic(b) {
  const TREES = [
    ['Birch', 12, 24, 1, 20, 'the Achiever — ambitious, resilient, a natural leader who lights the way in darkness', '\uD83C\uDF32'],
    ['Rowan', 1, 21, 2, 17, 'the Thinker — visionary, idealistic, quietly influential with a fiery inner spirit', '\uD83C\uDF43'],
    ['Ash', 2, 18, 3, 17, 'the Enchanter — imaginative, intuitive, moved by nature and art', '\uD83C\uDF33'],
    ['Alder', 3, 18, 4, 14, 'the Trailblazer — confident, charismatic, gathering allies wherever you pass', '\uD83C\uDF31'],
    ['Willow', 4, 15, 5, 12, 'the Observer — lunar, psychic, patient keeper of memory and mystery', '\uD83C\uDF3F'],
    ['Hawthorn', 5, 13, 6, 9, 'the Illusionist — you are never quite what you seem; creative fire behind a calm face', '\uD83C\uDF38'],
    ['Oak', 6, 10, 7, 7, 'the Stabilizer — protective, generous, an unshakable champion of the underdog', '\uD83C\uDF33'],
    ['Holly', 7, 8, 8, 4, 'the Ruler — noble, competitive, taking challenges as invitations', '\uD83C\uDF40'],
    ['Hazel', 8, 5, 9, 1, 'the Knower — brilliant, analytical, carrying the salmon\u2019s wisdom', '\uD83C\uDF30'],
    ['Vine', 9, 2, 9, 29, 'the Equalizer — refined, empathic, born on the balance of equinox', '\uD83C\uDF47'],
    ['Ivy', 9, 30, 10, 27, 'the Survivor — graceful through obstacles, loyal, quietly unstoppable', '\uD83C\uDF3F'],
    ['Reed', 10, 28, 11, 24, 'the Inquisitor — a seeker of hidden truths who reads souls like scrolls', '\uD83C\uDF3E'],
    ['Elder', 11, 25, 12, 23, 'the Seeker — wild, philosophical, regenerative; the wheel\u2019s last teacher', '\uD83C\uDF42'],
  ];
  const t = TREES.find(([, sm, sd, em, ed]) => inRange(b.m, b.d, [[sm, sd, em, ed]])) || TREES[0];
  return {
    id: 'celtic', name: 'Celtic Tree Astrology', category: 'Astrology', icon: t[6],
    headline: `${t[0]} — ${t[5].split(' — ')[0]}`,
    summary: `In the Druid lunar calendar you are the ${t[0]}, ${t[5]}.`,
    sections: [
      { label: 'Your Tree', value: t[0], text: `The ancient Ogham calendar assigns you the ${t[0]} tree: ${t[5]}.` },
      { label: 'Druidic Meaning', value: t[5].split(' — ')[0], text: 'Celtic tree astrology follows thirteen lunar months. Your tree describes the soul-medicine you carry for your community.' },
      { label: 'Season Spirit', value: `${b.m <= 2 || b.m === 12 ? 'Winter — the dreaming root' : b.m <= 5 ? 'Spring — the rising sap' : b.m <= 8 ? 'Summer — the full canopy' : 'Autumn — the wise harvest'}`, text: 'Druids read character through the season of birth: the forest you were born into lives inside you.' },
    ],
  };
}

function calcEgyptian(b) {
  const DEITIES = [
    ['The Nile', [[1,1,1,7],[6,19,6,28],[9,1,9,7],[11,18,11,26]], 'the Peacemaker — calm, observant, a bringer of life like the great river', '\uD83C\uDF0A'],
    ['Amun-Ra', [[1,8,1,21],[2,1,2,11]], 'the Hidden Sun — a born leader, confident, radiating quiet authority', '\u2600\uFE0F'],
    ['Mut', [[1,22,1,31],[9,8,9,22]], 'the Mother — nurturing, protective, fiercely devoted to your circle', '\uD83E\uDD85'],
    ['Geb', [[2,12,2,29],[8,20,8,31]], 'the Earth — sensitive, reliable, deeply attuned to the physical world', '\uD83C\uDF0D'],
    ['Osiris', [[3,1,3,10],[11,27,12,18]], 'the Reborn — independent, dynamic, forever rising from endings', '\uD83D\uDC51'],
    ['Isis', [[3,11,3,31],[10,18,10,29],[12,19,12,31]], 'the Magician Queen — direct, protective, devoted to truth and family', '\u2728'],
    ['Thoth', [[4,1,4,19],[11,8,11,17]], 'the Scribe — brilliant, original, a keeper of sacred knowledge', '\uD83D\uDCDC'],
    ['Horus', [[4,20,5,7],[8,12,8,19]], 'the Falcon — courageous, ambitious, sky-eyed and far-seeing', '\uD83E\uDD85'],
    ['Anubis', [[5,8,5,27],[6,29,7,13]], 'the Guardian — introspective, perceptive, a guide through thresholds', '\uD83D\uDC15'],
    ['Seth', [[5,28,6,18],[9,28,10,2]], 'the Storm — a perfectionist rebel who thrives on change and challenge', '\u26A1'],
    ['Bastet', [[7,14,7,28],[9,23,9,27],[10,3,10,17]], 'the Cat Goddess — charming, balanced, guardian of joy and pleasure', '\uD83D\uDC08'],
    ['Sekhmet', [[7,29,8,11],[10,30,11,7]], 'the Lioness — fierce, just, a healer with a warrior\u2019s heart', '\uD83E\uDD81'],
  ];
  const g = DEITIES.find(([, r]) => inRange(b.m, b.d, r)) || DEITIES[0];
  return {
    id: 'egyptian', name: 'Egyptian Astrology', category: 'Astrology', icon: g[3],
    headline: `Child of ${g[0]}`,
    summary: `Your patron deity is ${g[0]}, ${g[2]}.`,
    sections: [
      { label: 'Patron Deity', value: g[0], text: `Born under ${g[0]}: ${g[2]}.` },
      { label: 'Sacred Gift', value: g[2].split(' — ')[0], text: 'Egyptian priest-astrologers assigned each birth-decan a god whose ka (vital essence) flows through the native\u2019s destiny.' },
      { label: 'Temple Practice', value: 'Alignment', text: `To honor ${g[0]}, cultivate the deity\u2019s virtue in daily life — it is said the god\u2019s protection strengthens as you embody their essence.` },
    ],
  };
}

function calcMayan(b) {
  const daysSince = b.J - 584283;
  const SIGNS20 = [['Imix','Crocodile — primal nurturer, source of new beginnings','\uD83D\uDC0A'],['Ik','Wind — breath of spirit, communicator of unseen truths','\uD83C\uDF2C\uFE0F'],['Akbal','Night — dreamer who carries dawn inside darkness','\uD83C\uDF0C'],['Kan','Seed — ripening potential, magnetic abundance','\uD83C\uDF31'],['Chicchan','Serpent — kundalini life-force, instinctual power','\uD83D\uDC0D'],['Cimi','Transformer — bridge between worlds, gracious releaser','\uD83E\uDD8B'],['Manik','Deer — healer\u2019s hands, graceful accomplisher','\uD83E\uDD8C'],['Lamat','Star — harmonic beauty, multiplying joy','\u2B50'],['Muluc','Moon — universal water, emotional purifier','\uD83C\uDF19'],['Oc','Dog — loyal heart, unconditional love','\uD83D\uDC15'],['Chuen','Monkey — divine trickster, master artist','\uD83D\uDC12'],['Eb','Road — humble pathfinder walking destiny\u2019s road','\uD83D\uDEE4\uFE0F'],['Ben','Reed — pillar of heaven, family\u2019s courageous guide','\uD83C\uDF3E'],['Ix','Jaguar — shaman of the night, keeper of earth magic','\uD83D\uDC06'],['Men','Eagle — visionary flight, planetary mind','\uD83E\uDD85'],['Cib','Wisdom — ancient rememberer, forgiver of karma','\uD83D\uDD6F\uFE0F'],['Caban','Earth — synchronic navigator, evolution\u2019s ally','\uD83C\uDF0E'],['Etznab','Mirror — obsidian truth-teller, clarity\u2019s blade','\uD83E\uDE9E'],['Cauac','Storm — thunder-being of self-generation','\u26C8\uFE0F'],['Ahau','Sun — enlightened flowering, unconditional radiance','\u2600\uFE0F']];
  const di = mod(19 + daysSince, 20);
  const tone = mod(3 + daysSince, 13) + 1;
  const TONES = ['Magnetic — unify purpose','Lunar — polarize and stabilize','Electric — activate service','Self-Existing — define form','Overtone — empower radiance','Rhythmic — organize equality','Resonant — attune inspiration','Galactic — harmonize integrity','Solar — pulse intention','Planetary — perfect manifestation','Spectral — dissolve and liberate','Crystal — dedicate cooperation','Cosmic — endure transcendent presence'];
  const s = SIGNS20[di];
  return {
    id: 'mayan', name: "Mayan Tzolk'in", category: 'Astrology', icon: s[2],
    headline: `${tone} ${s[0]}`,
    summary: `Your galactic signature is Tone ${tone} ${s[0]} — ${s[1].split(' — ')[1]}.`,
    sections: [
      { label: 'Day Sign (Nawal)', value: s[0], text: `${s[1]}. Your nawal is your spirit companion in the 260-day sacred count.` },
      { label: 'Galactic Tone', value: `${tone} — ${TONES[tone - 1].split(' — ')[0]}`, text: `Tone ${tone}: ${TONES[tone - 1].split(' — ')[1]}. The tone gives the frequency at which your day sign vibrates.` },
      { label: 'Kin Number', value: `${mod(daysSince, 260) + 1} of 260`, text: 'Your position in the Tzolk\u2019in wheel, calculated with the GMT correlation used by Maya daykeepers.' },
    ],
  };
}

function calcHellenistic(b) {
  const si = sunSignIndex(b.m, b.d);
  const isDay = !b.hasTime || (b.hour >= 6 && b.hour < 18);
  const deg = mod(sunLongitude(b.n), 30);
  const decan = Math.floor(deg / 10) + 1;
  const CHALDEAN = ['Saturn','Jupiter','Mars','Sun','Venus','Mercury','Moon'];
  const decanRuler = CHALDEAN[mod(si * 3 + (decan - 1) + (si >= 0 ? 0 : 0) + 2, 7)];
  return {
    id: 'hellenistic', name: 'Hellenistic Astrology', category: 'Astrology', icon: '\uD83C\uDFDB\uFE0F',
    headline: `${isDay ? 'Day' : 'Night'} Chart \u00b7 ${SIGNS[si]} ${decan}\u1D49 decan`,
    summary: `A ${isDay ? 'diurnal' : 'nocturnal'} birth with the Sun in the ${decan}${decan === 1 ? 'st' : decan === 2 ? 'nd' : 'rd'} decan of ${SIGNS[si]}, under ${decanRuler}.`,
    sections: [
      { label: 'Sect', value: isDay ? 'Day (Diurnal)' : 'Night (Nocturnal)', text: `${isDay ? 'The Sun leads your chart: Jupiter and Saturn work in your favor; your path favors visible action and honor.' : 'The Moon leads your chart: Venus and Mars work in your favor; your path favors instinct, desire and the hidden world.'}` },
      { label: 'Decan', value: `${decan} of ${SIGNS[si]}, ruled by ${decanRuler}`, text: `Each sign holds three 10\u00b0 faces. Your decan ruler ${decanRuler} adds a distinct sub-flavor to your ${SIGNS[si]} Sun.` },
      { label: 'Traditional Ruler', value: RULERS[si].replace(/\s*\(.*\)/, (m2) => m2), text: `In the ancient system your life is stewarded by ${RULERS[si]} — study its condition and cycles to time your fortunes.` },
      { label: 'Element Temperament', value: ELEMENTS[si], text: `Hellenistic physicians linked ${ELEMENTS[si]} to the ${ELEMENTS[si] === 'Fire' ? 'choleric' : ELEMENTS[si] === 'Earth' ? 'melancholic' : ELEMENTS[si] === 'Air' ? 'sanguine' : 'phlegmatic'} temperament — your constitutional keynote.` },
    ],
  };
}

function calcMoonPhase(b) {
  const age = mod(b.J + (b.hour - 12) / 24 - 2451550.1, 29.530588853);
  const PH = [[1.84,'New Moon','\uD83C\uDF11','a seed-soul: you begin things, carrying pure instinct and fresh karma'],[5.53,'Waxing Crescent','\uD83C\uDF12','a striver: you push through resistance with youthful determination'],[9.22,'First Quarter','\uD83C\uDF13','a builder in crisis: decisive action under pressure is your gift'],[12.91,'Waxing Gibbous','\uD83C\uDF14','a perfecter: you refine, analyze and prepare revelations'],[16.61,'Full Moon','\uD83C\uDF15','an illuminator: born at maximum light, you live through relationship and revelation'],[20.30,'Waning Gibbous','\uD83C\uDF16','a disseminator: you digest experience into teaching for others'],[23.99,'Last Quarter','\uD83C\uDF17','a reorienter: you break from the past and pivot consciousness'],[27.68,'Waning Crescent','\uD83C\uDF18','an old soul of the cycle: mystical, releasing, preparing the next world'],[30,'New Moon','\uD83C\uDF11','a seed-soul: you begin things, carrying pure instinct and fresh karma']];
  const p = PH.find(([lim]) => age < lim);
  const illum = Math.round((1 - Math.cos((2 * Math.PI * age) / 29.530588853)) / 2 * 100);
  return {
    id: 'moonphase', name: 'Birth Moon Phase', category: 'Astrology', icon: p[2],
    headline: p[1],
    summary: `You were born under a ${p[1]} (${illum}% illuminated) — ${p[3]}.`,
    sections: [
      { label: 'Lunar Phase', value: `${p[1]} ${p[2]}`, text: `Moon age \u2248 ${age.toFixed(1)} days, ${illum}% illuminated. In lunar phase astrology you are ${p[3]}.` },
      { label: 'Soul Rhythm', value: age < 14.77 ? 'Waxing — Growth' : 'Waning — Wisdom', text: age < 14.77 ? 'Born on the growing tide: your life force builds, initiates and expands naturally.' : 'Born on the releasing tide: your life force distills, completes and transmits wisdom.' },
      { label: 'Practice', value: 'Lunar Return', text: 'Each month, when the Moon returns to your birth phase, your intuition peaks — an ideal window for intention-setting.' },
    ],
  };
}

function calcNumerology(b, profile) {
  const lp = reduceNum(reduceNum(b.m) + reduceNum(b.d) + reduceNum(digitSum(b.y)));
  const bd = reduceNum(b.d);
  const expression = nameNumber(profile.fullName);
  const soulUrge = nameNumber(profile.fullName, (ch) => VOWELS.includes(ch));
  const personality = nameNumber(profile.fullName, (ch) => !VOWELS.includes(ch));
  const nowY = new Date().getFullYear();
  const personalYear = reduceNum(reduceNum(b.m) + reduceNum(b.d) + reduceNum(digitSum(nowY)), false);
  const LP_MEAN = { 1:'the Leader — independent, original, a self-starter', 2:'the Diplomat — sensitive, cooperative, a natural peacemaker', 3:'the Creator — expressive, joyful, born to communicate', 4:'the Builder — practical, loyal, laying foundations that last', 5:'the Freedom-Seeker — adventurous, adaptable, alive through change', 6:'the Nurturer — responsible, loving, keeper of home and harmony', 7:'the Mystic — analytical, spiritual, a seeker of hidden truth', 8:'the Powerhouse — ambitious, executive, master of the material world', 9:'the Humanitarian — compassionate, wise, completing great cycles', 11:'the Illuminator (master) — intuitive visionary carrying spiritual voltage', 22:'the Master Builder — turning grand visions into concrete reality', 33:'the Master Teacher — healing through unconditional love' };
  return {
    id: 'numerology', name: 'Numerology', category: 'Numbers', icon: '\uD83D\uDD22',
    headline: `Life Path ${lp}`,
    summary: `Life Path ${lp}: ${LP_MEAN[lp]}. Expression ${expression}, Soul Urge ${soulUrge}.`,
    sections: [
      { label: 'Life Path', value: String(lp), text: `Your central lesson and journey: ${LP_MEAN[lp]}.` },
      { label: 'Expression / Destiny', value: String(expression), text: `Derived from your full name: the talents you are destined to develop. ${LP_MEAN[toSingle(expression)] || ''}` },
      { label: 'Soul Urge', value: String(soulUrge), text: `The vowels of your name reveal your heart\u2019s secret desire: the ${soulUrge} vibration of ${(LP_MEAN[toSingle(soulUrge)] || '').split(' — ')[0] || 'inner longing'}.` },
      { label: 'Personality', value: String(personality), text: `The consonants shape your outer mask — how strangers read you before they know you.` },
      { label: 'Birthday Number', value: String(bd), text: `A special gift you carry: the talent of the ${bd}.` },
      { label: `Personal Year ${nowY}`, value: String(personalYear), text: `This year vibrates at ${personalYear} for you — a season of ${['new beginnings','partnership & patience','creative expression','disciplined building','change & freedom','love & responsibility','reflection & study','harvest & power','completion & release'][personalYear - 1]}.` },
    ],
  };
}

function calcDestinyMatrix(b) {
  const arc = (n) => { while (n > 22) n = digitSum(n); return n; };
  const A = arc(b.d), Bv = arc(b.m), C = arc(digitSum(b.y)), D = arc(A + Bv + C);
  const center = arc(A + Bv + C + D);
  const nameOf = (n) => MAJOR_ARCANA[n === 22 ? 0 : n];
  const themeOf = (n) => ARCANA_THEMES[n === 22 ? 0 : n];
  return {
    id: 'destinyMatrix', name: 'Destiny Matrix', category: 'Numbers', icon: '\uD83D\uDD2E',
    headline: `Core Energy ${center} — ${nameOf(center)}`,
    summary: `Your matrix center is ${center} (${nameOf(center)}): ${themeOf(center)}.`,
    sections: [
      { label: 'Comfort Zone (Day)', value: `${A} — ${nameOf(A)}`, text: `Your personal energy and self-image: ${themeOf(A)}.` },
      { label: 'Talent Portal (Month)', value: `${Bv} — ${nameOf(Bv)}`, text: `The gift channel you were born to open: ${themeOf(Bv)}.` },
      { label: 'Karmic Tail (Year)', value: `${C} — ${nameOf(C)}`, text: `Ancestral inheritance and past-life material: ${themeOf(C)}.` },
      { label: 'Destiny Point', value: `${D} — ${nameOf(D)}`, text: `Where the three streams converge — your mission: ${themeOf(D)}.` },
      { label: 'Matrix Center', value: `${center} — ${nameOf(center)}`, text: `The heart of your chart, your core vibration: ${themeOf(center)}.` },
    ],
  };
}

function calcNameAnalysis(profile) {
  const name = onlyLetters(profile.fullName).toUpperCase();
  if (!name) return null;
  const corner = name[0];
  const cap = name[name.length - 1];
  const firstVowel = name.split('').find((c) => VOWELS.includes(c)) || 'A';
  const counts = {};
  name.split('').forEach((ch) => { const v = letterVal(ch); counts[v] = (counts[v] || 0) + 1; });
  const hidden = Object.entries(counts).sort((a, bb) => bb[1] - a[1])[0][0];
  const L = { A:'ambition and independent will', B:'sensitivity and the need for peace', C:'creative self-expression', D:'discipline and determination', E:'freedom and love of experience', F:'nurturing responsibility', G:'introspective mental power', H:'self-made success through vision', I:'intense feeling and artistry', J:'honest leadership', K:'high-voltage intuition', L:'magnetic charm and reason', M:'industrious groundedness', N:'imaginative flexibility', O:'deep emotion held in strong will', P:'intellectual authority', Q:'unusual magnetic genius', R:'tireless humanitarian work', S:'charisma and emotional waves', T:'dynamic self-sacrifice', U:'receptive luck and giving', V:'the master manifestor', W:'expressive versatility', X:'sensual creative crossroads', Y:'the mystic fork in the road', Z:'optimistic realism' };
  const LP_KEY = ['pioneering drive','diplomacy','expression','order','freedom','care','analysis','power','compassion'];
  return {
    id: 'nameAnalysis', name: 'Name Analysis', category: 'Numbers', icon: '\uD83D\uDCDC',
    headline: `Cornerstone ${corner} \u00b7 Capstone ${cap}`,
    summary: `Your name opens with ${corner} (${L[corner]}) and closes with ${cap} (${L[cap]}).`,
    sections: [
      { label: 'Cornerstone', value: corner, text: `The first letter shows how you meet life: ${L[corner]}.` },
      { label: 'Capstone', value: cap, text: `The last letter shows how you finish: ${L[cap]}.` },
      { label: 'First Vowel', value: firstVowel, text: `Your instinctive inner response runs on ${L[firstVowel]}.` },
      { label: 'Hidden Passion', value: hidden, text: `The number ${hidden} repeats most in your name — a talent of ${LP_KEY[hidden - 1]} that demands expression.` },
    ],
  };
}

function calcHumanDesign(b) {
  const h = mod(b.J, 100);
  const type = h < 37 ? 'Generator' : h < 70 ? 'Manifesting Generator' : h < 91 ? 'Projector' : h < 99 ? 'Manifestor' : 'Reflector';
  const STRAT = { Generator: 'To respond — wait for life to come to you, then follow your gut', 'Manifesting Generator': 'To respond, then inform — move fast once your sacral says yes', Projector: 'Wait for the invitation — your gift is guiding others\u2019 energy', Manifestor: 'To inform before acting — you are here to initiate', Reflector: 'Wait a lunar cycle — you mirror the health of your community' };
  const AUTH = { Generator: mod(b.J, 2) ? 'Sacral' : 'Emotional (Solar Plexus)', 'Manifesting Generator': mod(b.J, 2) ? 'Sacral' : 'Emotional (Solar Plexus)', Projector: mod(b.J, 2) ? 'Splenic' : 'Emotional (Solar Plexus)', Manifestor: mod(b.J, 2) ? 'Emotional (Solar Plexus)' : 'Ego', Reflector: 'Lunar (28-day cycle)' };
  const SIG = { Generator: 'Satisfaction', 'Manifesting Generator': 'Satisfaction & Peace', Projector: 'Success', Manifestor: 'Peace', Reflector: 'Surprise' };
  const NOTSELF = { Generator: 'Frustration', 'Manifesting Generator': 'Frustration & Anger', Projector: 'Bitterness', Manifestor: 'Anger', Reflector: 'Disappointment' };
  const l1 = mod(b.d, 6) + 1, l2 = mod(b.m + b.d, 6) + 1;
  const LINES = ['Investigator','Hermit','Martyr','Opportunist','Heretic','Role Model'];
  const gate = Math.floor(sunLongitude(b.n) / 5.625) + 1;
  return {
    id: 'humanDesign', name: 'Human Design', category: 'Esoteric', icon: '\u2699\uFE0F',
    headline: `${type} ${l1}/${l2}`,
    summary: `You are a ${type} with ${AUTH[type]} authority, profile ${l1}/${l2} (${LINES[l1 - 1]}/${LINES[l2 - 1]}).`,
    sections: [
      { label: 'Type', value: type, text: `${type}s make up ${type === 'Generator' ? '~37%' : type === 'Manifesting Generator' ? '~33%' : type === 'Projector' ? '~21%' : type === 'Manifestor' ? '~8%' : '~1%'} of humanity. Your aura is ${type === 'Projector' ? 'focused and absorbing' : type === 'Manifestor' ? 'closed and repelling' : type === 'Reflector' ? 'sampling and resistant' : 'open and enveloping'}.` },
      { label: 'Strategy', value: STRAT[type].split(' — ')[0], text: STRAT[type] + '.' },
      { label: 'Authority', value: AUTH[type], text: `Your inner compass for decisions. Trust your ${AUTH[type].toLowerCase()} response over mental reasoning.` },
      { label: 'Profile', value: `${l1}/${l2} — ${LINES[l1 - 1]} / ${LINES[l2 - 1]}`, text: `Your costume in this life: the ${LINES[l1 - 1].toLowerCase()}\u2019s conscious style with the ${LINES[l2 - 1].toLowerCase()}\u2019s unconscious undercurrent.` },
      { label: 'Signature vs Not-Self', value: `${SIG[type]} / ${NOTSELF[type]}`, text: `When aligned you feel ${SIG[type].toLowerCase()}; when off-track, ${NOTSELF[type].toLowerCase()} is your signal to return to strategy.` },
      { label: 'Sun Gate (simplified)', value: `Gate ${gate}`, text: `Approximate conscious Sun gate ${gate} — ${HEXAGRAMS[gate - 1].split('|')[1]}. (Full charts require exact ephemeris + design date.)` },
    ],
  };
}

function calcGeneKeys(b) {
  const lw = Math.floor(sunLongitude(b.n) / 5.625) + 1;
  const evo = (mod(lw + 31, 64)) + 1;
  const rad = Math.floor(moonLongitude(b.n) / 5.625) + 1;
  const pur = (mod(rad + 31, 64)) + 1;
  const gk = (n) => `Gene Key ${n} — ${HEXAGRAMS[n - 1].split('|')[1]}`;
  return {
    id: 'geneKeys', name: 'Gene Keys', category: 'Esoteric', icon: '\uD83E\uDDEC',
    headline: `Life\u2019s Work: Key ${lw}`,
    summary: `Your Activation Sequence: Life\u2019s Work ${lw}, Evolution ${evo}, Radiance ${rad}, Purpose ${pur}.`,
    sections: [
      { label: 'Life\u2019s Work', value: gk(lw), text: `Your outer genius — the gift the world sees when you move from shadow into flow: ${HEXAGRAMS[lw - 1].split('|')[1]}.` },
      { label: 'Evolution', value: gk(evo), text: `Your growth edge — the challenge that keeps refining you: ${HEXAGRAMS[evo - 1].split('|')[1]}.` },
      { label: 'Radiance', value: gk(rad), text: `What keeps you healthy and glowing: ${HEXAGRAMS[rad - 1].split('|')[1]}.` },
      { label: 'Purpose', value: gk(pur), text: `The deepest layer — what your life is ultimately in service of: ${HEXAGRAMS[pur - 1].split('|')[1]}.` },
      { label: 'Contemplation', value: 'Shadow \u2192 Gift \u2192 Siddhi', text: 'Gene Keys practice is slow contemplation: notice the shadow pattern, breathe into its gift, and let the highest essence unfold naturally.' },
    ],
  };
}

function calcIChing(b) {
  const hexNum = Math.floor(sunLongitude(b.n) / 5.625) + 1;
  const [hname, htheme] = HEXAGRAMS[hexNum - 1].split('|');
  const line = mod(b.d, 6) + 1;
  const shadowHex = (mod(hexNum + 31, 64)) + 1;
  return {
    id: 'iching', name: 'I Ching', category: 'Esoteric', icon: '\u262F\uFE0F',
    headline: `Hexagram ${hexNum} — ${hname}`,
    summary: `Your birth hexagram is ${hexNum}, ${hname}: ${htheme}.`,
    sections: [
      { label: 'Birth Hexagram', value: `${hexNum} \u00b7 ${hname}`, text: `The oracle-image of your life pattern: ${htheme}. Meditate on this hexagram when at a crossroads.` },
      { label: 'Changing Line', value: `Line ${line}`, text: `Your emphasis falls on line ${line}: ${['the hidden beginning — act without being seen','the inner minister — serve the vision quietly','the threshold — danger and opportunity meet','the transition — leave the lower world behind','the sovereign line — your place of mastery','the sage above — wisdom beyond the game'][line - 1]}.` },
      { label: 'Complementary Hexagram', value: `${shadowHex} \u00b7 ${HEXAGRAMS[shadowHex - 1].split('|')[0]}`, text: `Your hidden balance: ${HEXAGRAMS[shadowHex - 1].split('|')[1]}. Life will keep introducing you to this energy through others.` },
    ],
  };
}

function calcKabbalah(b, profile) {
  const lp = reduceNum(reduceNum(b.m) + reduceNum(b.d) + reduceNum(digitSum(b.y)));
  const SEPH = { 1:['Keter','the Crown — pure will and divine spark; you channel beginnings'], 2:['Chokhmah','Wisdom — the lightning flash of insight lives in you'], 3:['Binah','Understanding — the great sea of comprehension and form'], 4:['Chesed','Mercy — boundless loving-kindness and generous expansion'], 5:['Gevurah','Severity — holy discipline, boundaries and just strength'], 6:['Tiferet','Beauty — the heart center where all opposites are reconciled'], 7:['Netzach','Victory — endurance, passion and the artist\u2019s eternity'], 8:['Hod','Splendor — the mind\u2019s glory, language and sacred logic'], 9:['Yesod','Foundation — the dreaming moon-gate between worlds'], 11:['Da\u2019at','Knowledge — the hidden sephira; you carry gnosis across the abyss'], 22:['Malkuth','the Kingdom mastered — spirit fully embodied in matter'], 33:['Tiferet elevated','the Christed heart — sacrificial love as a life path'] };
  const s = SEPH[lp] || SEPH[toSingle(lp)];
  const HEB = ['Aleph \u2014 the breath of the infinite','Bet \u2014 the house of creation','Gimel \u2014 the camel crossing the abyss','Dalet \u2014 the door of humility','Heh \u2014 the window of revelation','Vav \u2014 the nail that joins heaven and earth','Zayin \u2014 the sword of discernment','Chet \u2014 the fence of sacred life-force','Tet \u2014 the serpent of hidden good','Yod \u2014 the seed-point of spirit','Kaf \u2014 the open palm of potential','Lamed \u2014 the ox-goad of learning','Mem \u2014 the mother of waters','Nun \u2014 the fish of perpetual motion','Samekh \u2014 the pillar of support','Ayin \u2014 the eye of perception','Peh \u2014 the mouth of expression','Tzadi \u2014 the hook of righteousness','Qof \u2014 the back of the head, holiness in darkness','Resh \u2014 the head of new consciousness','Shin \u2014 the tooth of holy fire','Tav \u2014 the seal of completion'];
  const expressionRaw = onlyLetters(profile.fullName).toUpperCase().split('').reduce((a, ch) => a + letterVal(ch), 0) || 1;
  const letter = HEB[mod(expressionRaw, 22)];
  return {
    id: 'kabbalah', name: 'Kabbalah', category: 'Esoteric', icon: '\uD83D\uDD4E',
    headline: `${s[0]} on the Tree of Life`,
    summary: `Your birth vibration resonates with ${s[0]}: ${s[1]}.`,
    sections: [
      { label: 'Sephira', value: s[0], text: `On the Tree of Life your life-path number resonates with ${s[0]}: ${s[1]}.` },
      { label: 'Hebrew Letter Path', value: letter.split(' \u2014 ')[0], text: `Your name\u2019s full vibration walks the path of ${letter}.` },
      { label: 'Tikkun (Soul Correction)', value: 'Integration', text: `The work of ${s[0]} is to balance its light with its shadow — ${lp === 5 ? 'strength without cruelty' : lp === 4 ? 'giving without dissolving boundaries' : lp === 8 ? 'brilliance without pride' : 'embodying the quality consciously rather than being driven by it'}.` },
    ],
  };
}

function calcTarot(b) {
  const total = digitSum(Number(`${b.m}${String(b.d).padStart(2, '0')}${b.y}`));
  let first = total;
  while (first > 22) first = digitSum(first);
  const second = first > 9 ? digitSum(first === 22 ? 4 : first) : null; // 22->Fool pairs w/ 4? standard: 22=Fool & 4 Emperor via 2+2
  const idx = (n) => (n === 22 ? 0 : n);
  const cards = [first, second].filter((x) => x !== null && idx(x) !== idx(first) || x === first).filter((x, i, a) => a.indexOf(x) === i);
  const cardList = second && idx(second) !== idx(first) ? [first, second] : [first];
  return {
    id: 'tarot', name: 'Tarot Birth Cards', category: 'Esoteric', icon: '\uD83C\uDCCF',
    headline: cardList.map((n) => MAJOR_ARCANA[idx(n)]).join(' & '),
    summary: `Your birth card${cardList.length > 1 ? 's are' : ' is'} ${cardList.map((n) => MAJOR_ARCANA[idx(n)]).join(' and ')} — ${ARCANA_THEMES[idx(first)]}.`,
    sections: [
      { label: 'Primary Birth Card', value: `${MAJOR_ARCANA[idx(first)]} (${first === 22 ? 0 : first})`, text: `The archetype of your soul\u2019s outer journey: ${ARCANA_THEMES[idx(first)]}.` },
      ...(cardList.length > 1 ? [{ label: 'Shadow / Root Card', value: `${MAJOR_ARCANA[idx(second)]} (${second})`, text: `The deeper current under your primary card: ${ARCANA_THEMES[idx(second)]}. Together they form your personality-soul pair.` }] : []),
      { label: 'Working With Your Card', value: 'Meditation', text: 'Place your birth card where you can see it. Its imagery is a mirror: what you notice in the card is what is awakening in you.' },
    ],
  };
}

function calcEnneagram(b) {
  const lp = toSingle(reduceNum(reduceNum(b.m) + reduceNum(b.d) + reduceNum(digitSum(b.y))));
  const type = ((lp - 1) % 9) + 1;
  const wing = mod(b.d, 2) === 0 ? (type === 1 ? 9 : type - 1) : (type === 9 ? 1 : type + 1);
  const T = [
    ['The Reformer','principled, purposeful, self-controlled — you improve everything you touch','integrity vs. inner critic','Seven (spontaneity)','Four (moody withdrawal)'],
    ['The Helper','generous, demonstrative, people-pleasing — love is your language','giving vs. needing to be needed','Four (self-nurture)','Eight (control)'],
    ['The Achiever','adaptable, driven, image-conscious — you turn goals into gold','authenticity vs. performance','Six (loyalty)','Nine (disengagement)'],
    ['The Individualist','expressive, romantic, temperamental — you make feeling into art','identity vs. envy','One (discipline)','Two (clinging)'],
    ['The Investigator','perceptive, innovative, private — you master whatever you study','engagement vs. hoarding energy','Eight (confidence)','Seven (scattering)'],
    ['The Loyalist','committed, responsible, vigilant — you hold the world together','courage vs. anxiety','Nine (calm)','Three (image-drive)'],
    ['The Enthusiast','spontaneous, versatile, acquisitive — joy is your compass','presence vs. escape','Five (depth)','One (criticality)'],
    ['The Challenger','powerful, decisive, protective — you take charge naturally','vulnerability vs. domination','Two (openheartedness)','Five (withdrawal)'],
    ['The Peacemaker','receptive, reassuring, complacent — you merge and mediate','self-assertion vs. inertia','Three (action)','Six (worry)'],
  ];
  const t = T[type - 1];
  return {
    id: 'enneagram', name: 'Enneagram', category: 'Personality', icon: '\u2724\uFE0F',
    headline: `Type ${type}w${wing} — ${t[0]}`,
    summary: `Type ${type}, ${t[0]}: ${t[1]}.`,
    sections: [
      { label: 'Core Type', value: `${type} — ${t[0]}`, text: `${t[1]}. Your central tension: ${t[2]}.` },
      { label: 'Wing', value: `${type}w${wing}`, text: `Your ${wing}-wing flavors the core type, adding ${T[wing - 1][0].replace('The ', '').toLowerCase()} qualities to your style.` },
      { label: 'Growth Direction', value: t[3].split(' (')[0], text: `In growth you move toward ${t[3]} — practice this consciously.` },
      { label: 'Stress Direction', value: t[4].split(' (')[0], text: `Under stress you slide toward ${t[4]} — an early-warning signal to pause and breathe.` },
      { label: 'Note', value: 'Birth-derived estimate', text: 'The Enneagram is ultimately self-discovered; this reading uses your birth vibration as a mirror to explore, not a verdict.' },
    ],
  };
}

function calcSoulAge(b) {
  const s = reduceNum(digitSum(b.d) + digitSum(b.m) + digitSum(b.y), false);
  const STAGES = [
    ['Infant Soul','raw, instinctual, learning physical survival and wonder'],
    ['Baby Soul','learning structure, belonging, tradition and rules'],
    ['Young Soul','learning ambition, achievement and worldly power'],
    ['Mature Soul','learning emotional depth, relationship and empathy'],
    ['Old Soul','learning detachment, teaching and the long view of spirit'],
  ];
  const stage = STAGES[mod(s, 5)];
  const level = mod(s + b.d, 7) + 1;
  return {
    id: 'soulAge', name: 'Soul Age', category: 'Spiritual', icon: '\uD83D\uDD6F\uFE0F',
    headline: `${stage[0]}, Level ${level}`,
    summary: `Your birth vibration suggests a ${stage[0]} at level ${level} of 7 — ${stage[1]}.`,
    sections: [
      { label: 'Soul Stage', value: stage[0], text: `${stage[0]}s are ${stage[1]}. Each stage spans many lifetimes of a single grand lesson.` },
      { label: 'Level', value: `${level} of 7`, text: `${level <= 2 ? 'Early levels: entering the lesson freshly, with enthusiasm and rawness.' : level <= 5 ? 'Middle levels: living the lesson fully in daily life, refining it through repetition.' : 'Late levels: mastering and beginning to teach the lesson to others.'}` },
      { label: 'Life Flavor', value: stage[0] === 'Old Soul' ? 'The quiet knowing' : stage[0] === 'Mature Soul' ? 'The feeling intensity' : 'The vivid engagement', text: `${stage[0] === 'Old Soul' ? 'You have likely felt \u201Colder than your years\u201D since childhood — drawn to essence over appearance.' : stage[0] === 'Mature Soul' ? 'Life keeps handing you relationship as curriculum — every bond is a classroom.' : 'The world itself is your school; embrace the play of experience.'}` },
    ],
  };
}

function calcSpiritAnimal(b) {
  const ANIMALS = [
    ['Otter', 1, 20, 2, 18, 'unconventional, playful, brilliantly independent — you solve what others cannot', '\uD83E\uDDA6'],
    ['Wolf', 2, 19, 3, 20, 'deeply feeling, artistic, fiercely devoted to your pack yet needing wild freedom', '\uD83D\uDC3A'],
    ['Falcon', 3, 21, 4, 19, 'a swift initiator with hunter\u2019s focus — you strike while others deliberate', '\uD83E\uDD85'],
    ['Beaver', 4, 20, 5, 20, 'strategic, resourceful, the master builder of lasting security', '\uD83E\uDDAB'],
    ['Deer', 5, 21, 6, 20, 'quick, witty, magnetic — you carry messages between worlds', '\uD83E\uDD8C'],
    ['Woodpecker', 6, 21, 7, 21, 'empathic, devoted, the heartbeat-keeper of home', '\uD83D\uDC26'],
    ['Salmon', 7, 22, 8, 21, 'proud, electric, swimming upstream toward your destiny', '\uD83D\uDC1F'],
    ['Bear', 8, 22, 9, 21, 'pragmatic, modest, healing — great strength held gently', '\uD83D\uDC3B'],
    ['Raven', 9, 22, 10, 22, 'charming, diplomatic, a keeper of magic and balance', '\uD83D\uDC26\u200D\u2B1B'],
    ['Snake', 10, 23, 11, 22, 'transformative, hypnotic, at home in the mysteries', '\uD83D\uDC0D'],
    ['Owl', 11, 23, 12, 21, 'adventurous, truth-seeing, wise in darkness', '\uD83E\uDD89'],
    ['Goose', 12, 22, 1, 19, 'persevering, ambitious, loyal to the long migration of your dreams', '\uD83E\uDEBF'],
  ];
  const a = ANIMALS.find(([, sm, sd, em, ed]) => inRange(b.m, b.d, [[sm, sd, em, ed]])) || ANIMALS[0];
  return {
    id: 'spiritAnimal', name: 'Spirit Animal', category: 'Spiritual', icon: a[6],
    headline: `The ${a[0]}`,
    summary: `Your birth totem is the ${a[0]} — ${a[5]}.`,
    sections: [
      { label: 'Birth Totem', value: `${a[0]} ${a[6]}`, text: `In the Native American medicine wheel your season is guarded by the ${a[0]}: ${a[5]}.` },
      { label: 'Medicine', value: a[5].split(' — ')[0], text: `Call on ${a[0]} medicine when you need exactly what it embodies. Your totem is strongest when you honor its nature in yourself.` },
      { label: 'Shadow Teaching', value: 'Integration', text: `Every totem has a shadow: the ${a[0]}\u2019s gifts, over-used, become its trap. Balance is the medicine path.` },
    ],
  };
}

function calcChakra(b, profile) {
  const lp = toSingle(reduceNum(reduceNum(b.m) + reduceNum(b.d) + reduceNum(digitSum(b.y))));
  const CH = [
    ['Root','Muladhara','red','survival, grounding, belonging','I am safe. I belong to the earth.'],
    ['Sacral','Svadhisthana','orange','creativity, pleasure, emotion','I feel. I create. I flow.'],
    ['Solar Plexus','Manipura','yellow','will, power, confidence','I act. My fire is mine to direct.'],
    ['Heart','Anahata','green','love, compassion, connection','I love. I am the bridge.'],
    ['Throat','Vishuddha','blue','truth, expression, voice','I speak. My truth ripples outward.'],
    ['Third Eye','Ajna','indigo','intuition, vision, insight','I see. The unseen is my home.'],
    ['Crown','Sahasrara','violet','unity, spirit, transcendence','I know. I am one with all.'],
  ];
  const di = mod(lp - 1, 7);
  const c = CH[di];
  const secondary = CH[mod(b.d - 1, 7)];
  return {
    id: 'chakra', name: 'Chakra Profile', category: 'Spiritual', icon: '\uD83E\uDDD8',
    headline: `Dominant: ${c[0]} Chakra`,
    summary: `Your life-path vibration centers in the ${c[0]} chakra (${c[1]}) — the seat of ${c[3]}.`,
    sections: [
      { label: 'Dominant Chakra', value: `${c[0]} \u00b7 ${c[1]}`, text: `Your energy naturally pools in the ${c[0]} center, governing ${c[3]}. Its color is ${c[2]}.` },
      { label: 'Affirmation', value: `\u201C${c[4]}\u201D`, text: 'Speak this daily; the dominant chakra strengthens when consciously affirmed.' },
      { label: 'Secondary Center', value: `${secondary[0]} \u00b7 ${secondary[1]}`, text: `Your birth-day number activates the ${secondary[0]} chakra as a supporting current: ${secondary[3]}.` },
      { label: 'Balancing Practice', value: c[0] === 'Root' ? 'Earthing & rhythm' : c[0] === 'Sacral' ? 'Dance & water' : c[0] === 'Solar Plexus' ? 'Breath of fire & boundaries' : c[0] === 'Heart' ? 'Gratitude & forgiveness' : c[0] === 'Throat' ? 'Chanting & honest speech' : c[0] === 'Third Eye' ? 'Meditation & dream journaling' : 'Silence & surrender', text: 'A dominant chakra can overwork; this practice keeps the whole column of light flowing evenly.' },
    ],
  };
}

// ---------- master list ----------
export function computeAllModalities(profile) {
  const b = parseBirth(profile);
  const list = [
    calcWestern(b), calcVedic(b), calcChinese(b), calcCeltic(b), calcEgyptian(b),
    calcMayan(b), calcHellenistic(b), calcMoonPhase(b),
    calcNumerology(b, profile), calcDestinyMatrix(b), calcNameAnalysis(profile),
    calcHumanDesign(b), calcGeneKeys(b), calcIChing(b), calcKabbalah(b, profile), calcTarot(b),
    calcEnneagram(b), calcSoulAge(b), calcSpiritAnimal(b), calcChakra(b, profile),
  ].filter(Boolean);
  return list;
}

export function cosmicProfileSummary(profile) {
  const all = computeAllModalities(profile);
  const get = (id) => all.find((m) => m.id === id);
  const b = parseBirth(profile);
  const si = sunSignIndex(b.m, b.d);
  return {
    sunSign: SIGNS[si],
    sunGlyph: SIGN_GLYPHS[si],
    headlines: {
      western: get('western')?.headline,
      chinese: get('chinese')?.headline,
      lifePath: get('numerology')?.headline,
      spiritAnimal: get('spiritAnimal')?.headline,
      tarot: get('tarot')?.headline,
      humanDesign: get('humanDesign')?.headline,
      moonPhase: get('moonphase')?.headline,
      soulAge: get('soulAge')?.headline,
    },
    element: ELEMENTS[si],
    trait: SIGN_TRAITS[si],
  };
}

export const CATEGORIES = ['All', 'Astrology', 'Numbers', 'Esoteric', 'Personality', 'Spiritual'];

// =====================================================================
// COMPATIBILITY READING — deterministic cross-system synastry
// =====================================================================
export function computeCompatibility(pA, pB) {
  const a = parseBirth(pA);
  const b = parseBirth(pB);
  const nameA = pA.fullName.split(' ')[0];
  const nameB = pB.fullName.split(' ')[0];
  const aspects = [];

  // --- Western: sign aspect + element pairing ---
  const sa = sunSignIndex(a.m, a.d), sb = sunSignIndex(b.m, b.d);
  const dist = Math.min(mod(sb - sa, 12), mod(sa - sb, 12));
  const aspectScore = [85, 55, 78, 52, 92, 60, 68][dist];
  const aspectName = ['Conjunction', 'Semi-sextile', 'Sextile', 'Square', 'Trine', 'Quincunx', 'Opposition'][dist];
  const eA = ELEMENTS[sa], eB = ELEMENTS[sb];
  const elPair = eA === eB ? 88 : ((eA === 'Fire' && eB === 'Air') || (eA === 'Air' && eB === 'Fire') || (eA === 'Earth' && eB === 'Water') || (eA === 'Water' && eB === 'Earth')) ? 82 : 50;
  const westScore = Math.round(aspectScore * 0.5 + elPair * 0.5);
  aspects.push({
    id: 'western', name: 'Sun Sign Synastry', icon: '\u2600\uFE0F', score: westScore, weight: 0.25,
    headline: `${SIGNS[sa]} ${aspectName.toLowerCase()} ${SIGNS[sb]}`,
    text: `${nameA}\u2019s ${SIGNS[sa]} Sun (${eA}) meets ${nameB}\u2019s ${SIGNS[sb]} Sun (${eB}) in a ${aspectName.toLowerCase()}. ${dist === 4 ? 'The trine is astrology\u2019s sweetest flow \u2014 effortless understanding and shared rhythm.' : dist === 0 ? 'Two of the same sign: deep mirroring, instant familiarity, and the challenge of too much sameness.' : dist === 6 ? 'The opposition is magnetic \u2014 you complete each other\u2019s missing half, with sparks along the axis.' : dist === 2 ? 'The sextile brings friendly, easy chemistry that grows with attention.' : dist === 3 ? 'The square generates friction \u2014 and friction, handled with love, becomes fuel for growth.' : 'An acquired-taste angle: your rhythms differ, and appreciating that difference is the work.'} ${eA === eB ? `Sharing the ${eA} element, you speak the same emotional dialect.` : elPair === 82 ? `${eA} and ${eB} feed each other naturally.` : `${eA} and ${eB} must translate for one another \u2014 patience becomes intimacy.`}`,
  });

  // --- Chinese: trine / clash / secret friends ---
  const effY = (p) => (p.m < 2 || (p.m === 2 && p.d < 4)) ? p.y - 1 : p.y;
  const ANIMALS = ['Rat','Ox','Tiger','Rabbit','Dragon','Snake','Horse','Goat','Monkey','Rooster','Dog','Pig'];
  const ai = mod(effY(a) - 4, 12), bi = mod(effY(b) - 4, 12);
  const d12 = Math.min(mod(bi - ai, 12), mod(ai - bi, 12));
  const secretFriends = mod(ai + bi, 12) === 1;
  let chScore = d12 === 0 ? 78 : d12 === 4 ? 92 : d12 === 6 ? 42 : d12 === 3 ? 55 : d12 === 2 ? 68 : 65;
  if (secretFriends) chScore = 90;
  aspects.push({
    id: 'chinese', name: 'Chinese Zodiac Harmony', icon: '\uD83C\uDFEE', score: chScore, weight: 0.15,
    headline: `${ANIMALS[ai]} & ${ANIMALS[bi]}${secretFriends ? ' \u2014 secret friends' : d12 === 4 ? ' \u2014 same trine' : d12 === 6 ? ' \u2014 clash pair' : ''}`,
    text: `${nameA} the ${ANIMALS[ai]} and ${nameB} the ${ANIMALS[bi]}: ${secretFriends ? 'a legendary \u201Csecret friend\u201D pairing \u2014 quiet, loyal, protective devotion that outsiders rarely see.' : d12 === 4 ? 'you belong to the same harmony trine, sharing instincts, pace and values \u2014 one of the luckiest pairings.' : d12 === 6 ? 'a classic clash pair \u2014 opposite poles of the wheel. Intense attraction, but you must consciously honor each other\u2019s opposite natures.' : d12 === 0 ? 'the same animal \u2014 you understand each other completely, though you also share the same blind spots.' : 'a workable pairing \u2014 neither destined nor doomed, shaped by the effort you bring.'}`,
  });

  // --- Numerology: life path resonance ---
  const lpOf = (p) => toSingle(reduceNum(reduceNum(p.m) + reduceNum(p.d) + reduceNum(digitSum(p.y))));
  const la = lpOf(a), lb = lpOf(b);
  const group = (n) => ([1,5,7].includes(n) ? 'mind' : [2,4,8].includes(n) ? 'practical' : 'creative');
  const numScore = la === lb ? 85 : group(la) === group(lb) ? 82 : (la + lb === 10) ? 76 : 62;
  aspects.push({
    id: 'numerology', name: 'Life Path Resonance', icon: '\uD83D\uDD22', score: numScore, weight: 0.20,
    headline: `Path ${la} & Path ${lb}`,
    text: `${nameA} walks Life Path ${la} (${group(la)} axis) and ${nameB} walks Path ${lb} (${group(lb)} axis). ${la === lb ? 'Identical paths: you are climbing the same mountain and can share every map \u2014 just avoid amplifying each other\u2019s weaknesses.' : group(la) === group(lb) ? `Both paths belong to the ${group(la)} triad (${group(la) === 'mind' ? '1-5-7: independence and depth' : group(la) === 'practical' ? '2-4-8: building and loyalty' : '3-6-9: art, care and vision'}) \u2014 a natural resonance of values.` : la + lb === 10 ? 'Your numbers complete each other to ten \u2014 a complementary polarity where each supplies what the other lacks.' : 'Your triads differ \u2014 mind, matter and heart pulling in different directions. Difference here means constant learning.'}`,
  });

  // --- Spirit animal clans ---
  const clanOf = (m2, d2) => {
    const idx = [['Otter',1,20,2,18],['Wolf',2,19,3,20],['Falcon',3,21,4,19],['Beaver',4,20,5,20],['Deer',5,21,6,20],['Woodpecker',6,21,7,21],['Salmon',7,22,8,21],['Bear',8,22,9,21],['Raven',9,22,10,22],['Snake',10,23,11,22],['Owl',11,23,12,21],['Goose',12,22,1,19]];
    const an = (idx.find(([, sm, sd, em, ed]) => inRange(m2, d2, [[sm, sd, em, ed]])) || idx[0])[0];
    const clans = { Falcon: 'Thunderbird (Fire)', Salmon: 'Thunderbird (Fire)', Owl: 'Thunderbird (Fire)', Beaver: 'Turtle (Earth)', Bear: 'Turtle (Earth)', Goose: 'Turtle (Earth)', Deer: 'Butterfly (Air)', Raven: 'Butterfly (Air)', Otter: 'Butterfly (Air)', Woodpecker: 'Frog (Water)', Snake: 'Frog (Water)', Wolf: 'Frog (Water)' };
    return [an, clans[an]];
  };
  const [anA, clA] = clanOf(a.m, a.d);
  const [anB, clB] = clanOf(b.m, b.d);
  const elOf = (c) => c.includes('Fire') ? 'Fire' : c.includes('Earth') ? 'Earth' : c.includes('Air') ? 'Air' : 'Water';
  const ca = elOf(clA), cb = elOf(clB);
  const spScore = anA === anB ? 84 : clA === clB ? 88 : ((ca === 'Fire' && cb === 'Air') || (ca === 'Air' && cb === 'Fire') || (ca === 'Earth' && cb === 'Water') || (ca === 'Water' && cb === 'Earth')) ? 78 : 55;
  aspects.push({
    id: 'spirit', name: 'Totem Clan Medicine', icon: '\uD83E\uDD85', score: spScore, weight: 0.15,
    headline: `${anA} & ${anB}`,
    text: `${nameA}\u2019s totem is the ${anA} of the ${clA} clan; ${nameB}\u2019s is the ${anB} of the ${clB} clan. ${clA === clB ? 'Same medicine clan \u2014 your instincts run on the same current, an old-souls-around-one-fire bond.' : spScore === 78 ? 'Allied clans \u2014 your elemental medicines feed one another, wind to flame, rain to river.' : 'Cross-current clans \u2014 your instinctive medicines differ, which brings both fascination and the need for translation.'}`,
  });

  // --- Moon phase harmony ---
  const ageOf = (p) => mod(p.J + (p.hour - 12) / 24 - 2451550.1, 29.530588853);
  const agA = ageOf(a), agB = ageOf(b);
  const waxA = agA < 14.77, waxB = agB < 14.77;
  const phaseDiff = Math.abs(agA - agB);
  const mScore = phaseDiff < 3.7 ? 88 : waxA === waxB ? 78 : 62;
  aspects.push({
    id: 'moon', name: 'Lunar Phase Bond', icon: '\uD83C\uDF19', score: mScore, weight: 0.10,
    headline: `${waxA ? 'Waxing' : 'Waning'} & ${waxB ? 'Waxing' : 'Waning'} souls`,
    text: `${phaseDiff < 3.7 ? 'You were born under nearly the same moon \u2014 your emotional tides rise and fall together, an uncanny felt-sense of each other.' : waxA === waxB ? `Both born on the ${waxA ? 'growing' : 'releasing'} tide: your life forces move in the same direction, building or distilling side by side.` : 'One of you builds while the other releases \u2014 a giver-and-alchemist rhythm that balances when honored, and confuses when not.'}`,
  });

  // --- Vedic moon sign distance ---
  const rOf = (p) => Math.floor(mod(moonLongitude(p.n) - 24.1, 360) / 30);
  const ra = rOf(a), rb = rOf(b);
  const vd = Math.min(mod(rb - ra, 12), mod(ra - rb, 12));
  const vScore = vd === 0 ? 82 : vd === 4 ? 85 : vd === 6 ? 70 : vd === 2 ? 74 : 63;
  aspects.push({
    id: 'vedic', name: 'Rashi (Moon Mind) Match', icon: '\u0950', score: vScore, weight: 0.15,
    headline: `${SIGNS[ra]} & ${SIGNS[rb]} Moons`,
    text: `In Jyotish, marriage matching begins with the Moon. ${nameA}\u2019s ${SIGNS[ra]} mind and ${nameB}\u2019s ${SIGNS[rb]} mind sit ${vd === 0 ? 'in the same rashi \u2014 emotional twins who feel weather identically.' : vd === 4 ? 'in trine \u2014 the minds flow in natural sympathy, a classic auspicious placement.' : vd === 6 ? 'opposite each other \u2014 intense mutual fascination; the axis asks for conscious balance.' : 'at a neutral angle \u2014 emotional understanding here is earned rather than given, and all the more precious for it.'}`,
  });

  const overall = Math.round(aspects.reduce((s, x) => s + x.score * x.weight, 0));
  const verdict = overall >= 85 ? 'Written in the Stars' : overall >= 75 ? 'A Karmic Match' : overall >= 65 ? 'A Growth Alliance' : overall >= 55 ? 'Opposites in Orbit' : 'A Teaching Bond';
  const verdictText = overall >= 85
    ? 'The systems agree with rare unanimity: your energies interlock like constellations in the same sky. Guard against complacency \u2014 even destined bonds are gardens, not monuments.'
    : overall >= 75
    ? 'Multiple traditions see strong resonance here \u2014 a connection with old-soul familiarity and real staying power, asking only honest tending.'
    : overall >= 65
    ? 'This bond is a curriculum: substantial harmony threaded with productive friction. What you build together, you build consciously \u2014 and it lasts.'
    : overall >= 55
    ? 'You orbit from different poles. The attraction of opposites is real, and so is the translation work. Curiosity is your love language.'
    : 'The charts diverge widely \u2014 which the mystics never called bad. Some of the most transformative bonds are teachers, not mirrors. Enter with open eyes.';

  return { overall, verdict, verdictText, aspects, nameA, nameB, sunA: SIGNS[sa], sunB: SIGNS[sb], glyphA: SIGN_GLYPHS[sa], glyphB: SIGN_GLYPHS[sb] };
}
