// Hardcoded placeholder data for Phase 1/2 (visual skeleton).
// Shapes match src/types.ts, which mirrors the Supabase schema —
// Phase 3 replaces this module with real queries.
// Trip content below is the group's actual real route planning (as of
// 2026-07-06), not fictional demo data.

import type { Trip, Profile, Approval, Idea } from '../types'

export const members: Profile[] = [
  { id: 'u-fabian', email: 'fabian.joebstl@gmail.com', displayName: 'Fabian', color: '#f97316', emoji: '🦊', isAdmin: true },
  { id: 'u-alex', email: 'alex@example.com', displayName: 'Alex', color: '#8b5cf6', emoji: '🐙', isAdmin: false },
  { id: 'u-mara', email: 'mara@example.com', displayName: 'Mara', color: '#22d3ee', emoji: '🦋', isAdmin: false },
  { id: 'u-jonas', email: 'jonas@example.com', displayName: 'Jonas', color: '#a3e635', emoji: '🦅', isAdmin: false },
  { id: 'u-elli', email: 'elli@example.com', displayName: 'Elli', color: '#f43f5e', emoji: '🐝', isAdmin: false },
]

export const trips: Trip[] = [
  {
    id: 't-poland',
    title: 'Western Poland',
    year: 2026,
    status: 'planned',
    dateStart: null,
    dateEnd: null,
    datesConfirmed: false,
    color: '#fbbf24',
    description: 'Graz through Vienna up to Wrocław, Poznań and Łódź.',
    stops: [
      { id: 's-pl-1', tripId: 't-poland', name: 'Graz', lat: 47.0707, lng: 15.4395, orderIndex: 0 },
      { id: 's-pl-2', tripId: 't-poland', name: 'Vienna', lat: 48.2082, lng: 16.3738, orderIndex: 1 },
      { id: 's-pl-3', tripId: 't-poland', name: 'Wrocław', lat: 51.1079, lng: 17.0385, orderIndex: 2 },
      { id: 's-pl-4', tripId: 't-poland', name: 'Poznań', lat: 52.4064, lng: 16.9252, orderIndex: 3 },
      { id: 's-pl-5', tripId: 't-poland', name: 'Łódź', lat: 51.7592, lng: 19.456, orderIndex: 4 },
    ],
  },
  {
    id: 't-caucasus',
    title: 'Turkey & the Caucasus',
    year: 2027,
    status: 'planned',
    dateStart: null,
    dateEnd: null,
    datesConfirmed: false,
    color: '#f472b6',
    description:
      'Fly to Istanbul, train via Ankara, the Doğu Express east to Kars, on through Batumi and Tbilisi to Yerevan, flying home to Vienna.',
    stops: [
      { id: 's-cau-0', tripId: 't-caucasus', name: 'Vienna', lat: 48.2082, lng: 16.3738, orderIndex: 0, notes: 'Home base.' },
      { id: 's-cau-1', tripId: 't-caucasus', name: 'Istanbul', lat: 41.0082, lng: 28.9784, orderIndex: 1, notes: 'Fly in from Vienna.', travelMode: 'flight' },
      { id: 's-cau-2', tripId: 't-caucasus', name: 'Ankara', lat: 39.9334, lng: 32.8597, orderIndex: 2, notes: 'Train from Istanbul.' },
      { id: 's-cau-3', tripId: 't-caucasus', name: 'Kars', lat: 40.6013, lng: 43.0975, orderIndex: 3, notes: 'Doğu Express.', wikiUrl: 'https://en.wikipedia.org/wiki/Do%C4%9Fu_Express' },
      { id: 's-cau-4', tripId: 't-caucasus', name: 'Batumi', lat: 41.6168, lng: 41.6367, orderIndex: 4 },
      { id: 's-cau-5', tripId: 't-caucasus', name: 'Tbilisi', lat: 41.7151, lng: 44.8271, orderIndex: 5 },
      { id: 's-cau-6', tripId: 't-caucasus', name: 'Yerevan', lat: 40.1792, lng: 44.4991, orderIndex: 6 },
      { id: 's-cau-7', tripId: 't-caucasus', name: 'Vienna', lat: 48.2082, lng: 16.3738, orderIndex: 7, notes: 'Fly home from Yerevan.', travelMode: 'flight' },
    ],
  },
  {
    id: 't-stans',
    title: 'Caspian Crossing to Uzbekistan',
    year: 2028,
    status: 'idea',
    dateStart: null,
    dateEnd: null,
    datesConfirmed: false,
    color: '#2dd4bf',
    description: 'Fly to Tbilisi, night train to Baku, ferry across the Caspian to Aktau, then down into Uzbekistan.',
    stops: [
      { id: 's-stn-0', tripId: 't-stans', name: 'Vienna', lat: 48.2082, lng: 16.3738, orderIndex: 0, notes: 'Home base.' },
      { id: 's-stn-1', tripId: 't-stans', name: 'Tbilisi', lat: 41.7151, lng: 44.8271, orderIndex: 1, notes: 'Fly in from Vienna.', travelMode: 'flight' },
      { id: 's-stn-2', tripId: 't-stans', name: 'Baku', lat: 40.4093, lng: 49.8671, orderIndex: 2, notes: 'Night train from Tbilisi.' },
      { id: 's-stn-3', tripId: 't-stans', name: 'Aktau', lat: 43.65, lng: 51.1972, orderIndex: 3, notes: 'Caspian Sea ferry.' },
      { id: 's-stn-4', tripId: 't-stans', name: 'Khiva', lat: 41.3775, lng: 60.3639, orderIndex: 4 },
      { id: 's-stn-5', tripId: 't-stans', name: 'Bukhara', lat: 39.7747, lng: 64.4286, orderIndex: 5 },
      { id: 's-stn-6', tripId: 't-stans', name: 'Samarkand', lat: 39.6542, lng: 66.9597, orderIndex: 6 },
      { id: 's-stn-7', tripId: 't-stans', name: 'Tashkent', lat: 41.2995, lng: 69.2401, orderIndex: 7 },
    ],
  },
  {
    id: 't-ukraine',
    title: 'Lviv, Kyiv & Kharkiv',
    year: 2029,
    status: 'idea',
    dateStart: null,
    dateEnd: null,
    datesConfirmed: false,
    color: '#a78bfa',
    description: 'Train from Vienna via Lviv (Lemberg) to Kyiv and Kharkiv.',
    stops: [
      { id: 's-ukr-1', tripId: 't-ukraine', name: 'Vienna', lat: 48.2082, lng: 16.3738, orderIndex: 0 },
      { id: 's-ukr-2', tripId: 't-ukraine', name: 'Lviv', lat: 49.8397, lng: 24.0297, orderIndex: 1 },
      { id: 's-ukr-3', tripId: 't-ukraine', name: 'Kyiv', lat: 50.4501, lng: 30.5234, orderIndex: 2 },
      { id: 's-ukr-4', tripId: 't-ukraine', name: 'Kharkiv', lat: 49.9935, lng: 36.2304, orderIndex: 3 },
    ],
  },
  {
    id: 't-balkans2',
    title: 'Balkans Road Trip II',
    year: 2030,
    status: 'idea',
    dateStart: null,
    dateEnd: null,
    datesConfirmed: false,
    color: '#fb7185',
    description: 'Graz down to Niš, Pristina, Skopje, maybe Albania, back along the coast.',
    stops: [
      { id: 's-bal2-1', tripId: 't-balkans2', name: 'Graz', lat: 47.0707, lng: 15.4395, orderIndex: 0 },
      { id: 's-bal2-2', tripId: 't-balkans2', name: 'Niš', lat: 43.3209, lng: 21.8958, orderIndex: 1 },
      { id: 's-bal2-3', tripId: 't-balkans2', name: 'Pristina', lat: 42.6629, lng: 21.1655, orderIndex: 2 },
      { id: 's-bal2-4', tripId: 't-balkans2', name: 'Skopje', lat: 41.9981, lng: 21.4254, orderIndex: 3 },
      { id: 's-bal2-5', tripId: 't-balkans2', name: 'Tirana', lat: 41.3275, lng: 19.8187, orderIndex: 4, notes: 'Maybe — if we make it to Albania.' },
      { id: 's-bal2-6', tripId: 't-balkans2', name: 'Budva', lat: 42.2911, lng: 18.84, orderIndex: 5, notes: 'Coast road back north.' },
    ],
  },
  {
    id: 't-transsib',
    title: 'Trans-Siberian to China',
    year: 2030,
    yearGroup: '2030+',
    status: 'idea',
    dateStart: null,
    dateEnd: null,
    datesConfirmed: false,
    color: '#38bdf8',
    description:
      'Vienna to Moscow, then the real Trans-Siberian/Trans-Mongolian corridor through Yekaterinburg, Novosibirsk, Irkutsk and Ulaanbaatar into China. One of a few 2030+ ideas.',
    stops: [
      { id: 's-sib-0', tripId: 't-transsib', name: 'Vienna', lat: 48.2082, lng: 16.3738, orderIndex: 0, notes: 'Home base.' },
      { id: 's-sib-1', tripId: 't-transsib', name: 'Moscow', lat: 55.7558, lng: 37.6173, orderIndex: 1 },
      { id: 's-sib-2', tripId: 't-transsib', name: 'Yekaterinburg', lat: 56.8389, lng: 60.6057, orderIndex: 2 },
      { id: 's-sib-3', tripId: 't-transsib', name: 'Novosibirsk', lat: 55.0084, lng: 82.9357, orderIndex: 3 },
      { id: 's-sib-4', tripId: 't-transsib', name: 'Irkutsk', lat: 52.2978, lng: 104.2964, orderIndex: 4, notes: 'Lake Baikal.' },
      { id: 's-sib-5', tripId: 't-transsib', name: 'Ulan-Ude', lat: 51.8335, lng: 107.5843, orderIndex: 5 },
      { id: 's-sib-6', tripId: 't-transsib', name: 'Ulaanbaatar', lat: 47.8864, lng: 106.9057, orderIndex: 6 },
      { id: 's-sib-7', tripId: 't-transsib', name: 'Beijing', lat: 39.9042, lng: 116.4074, orderIndex: 7 },
    ],
  },
  {
    id: 't-oman',
    title: 'Oman',
    year: 2030,
    yearGroup: '2030+',
    status: 'idea',
    dateStart: null,
    dateEnd: null,
    datesConfirmed: false,
    color: '#34d399',
    description: 'Flight to Oman — one of a few 2030+ ideas, alternative to the Baku & Tehran idea.',
    stops: [
      { id: 's-om-0', tripId: 't-oman', name: 'Vienna', lat: 48.2082, lng: 16.3738, orderIndex: 0, notes: 'Home base.' },
      { id: 's-om-1', tripId: 't-oman', name: 'Muscat', lat: 23.5859, lng: 58.4059, orderIndex: 1, notes: 'Fly in from Vienna.', travelMode: 'flight' },
      { id: 's-om-2', tripId: 't-oman', name: 'Salalah', lat: 17.0151, lng: 54.0924, orderIndex: 2 },
    ],
  },
  {
    id: 't-iran',
    title: 'Baku & Tehran',
    year: 2030,
    yearGroup: '2030+',
    status: 'idea',
    dateStart: null,
    dateEnd: null,
    datesConfirmed: false,
    color: '#c084fc',
    description:
      'Fly to Tbilisi, night train to Baku, then roadtrip or train down to Tehran — one of a few 2030+ ideas, alternative to the Oman idea.',
    stops: [
      { id: 's-ir-0', tripId: 't-iran', name: 'Vienna', lat: 48.2082, lng: 16.3738, orderIndex: 0, notes: 'Home base.' },
      { id: 's-ir-1', tripId: 't-iran', name: 'Tbilisi', lat: 41.7151, lng: 44.8271, orderIndex: 1, notes: 'Fly in from Vienna.', travelMode: 'flight' },
      { id: 's-ir-2', tripId: 't-iran', name: 'Baku', lat: 40.4093, lng: 49.8671, orderIndex: 2, notes: 'Night train from Tbilisi.' },
      { id: 's-ir-3', tripId: 't-iran', name: 'Tehran', lat: 35.6892, lng: 51.389, orderIndex: 3, notes: 'Roadtrip or train — not decided yet.' },
    ],
  },
  {
    id: 't-bodensee',
    title: 'Bodensee Loop',
    year: 2030,
    yearGroup: '2030+',
    status: 'idea',
    dateStart: null,
    dateEnd: null,
    datesConfirmed: false,
    color: '#67e8f9',
    description: 'Vienna to Bregenz, then a loop around the Bodensee — Konstanz, St. Gallen, Zürich — back to Vienna by train. One of a few 2030+ ideas.',
    stops: [
      { id: 's-bod-1', tripId: 't-bodensee', name: 'Vienna', lat: 48.2082, lng: 16.3738, orderIndex: 0 },
      { id: 's-bod-2', tripId: 't-bodensee', name: 'Bregenz', lat: 47.5031, lng: 9.7471, orderIndex: 1 },
      { id: 's-bod-3', tripId: 't-bodensee', name: 'Konstanz', lat: 47.6603, lng: 9.1758, orderIndex: 2 },
      { id: 's-bod-4', tripId: 't-bodensee', name: 'St. Gallen', lat: 47.4245, lng: 9.3767, orderIndex: 3 },
      { id: 's-bod-5', tripId: 't-bodensee', name: 'Zürich', lat: 47.3769, lng: 8.5417, orderIndex: 4 },
      { id: 's-bod-6', tripId: 't-bodensee', name: 'Vienna', lat: 48.2082, lng: 16.3738, orderIndex: 5, notes: 'Back home by train.' },
    ],
  },
]

// Dummy approval state for the static Phase 1/2 sidebar — UI demo only,
// not a reflection of real approvals yet.
export const approvals: Approval[] = [
  // Poland: everyone in on the trip, dates still open.
  ...members.map((m, i) => ({ id: `a-pl-t-${i}`, tripId: 't-poland', userId: m.id, kind: 'trip' as const })),
  // Caucasus: three on board.
  { id: 'a-cau-1', tripId: 't-caucasus', userId: 'u-fabian', kind: 'trip' },
  { id: 'a-cau-2', tripId: 't-caucasus', userId: 'u-jonas', kind: 'trip' },
  { id: 'a-cau-3', tripId: 't-caucasus', userId: 'u-elli', kind: 'trip' },
]

// Dummy idea pins for the static Phase 1/2 sidebar — UI demo only.
export const ideas: Idea[] = [
  {
    id: 'i-iceland',
    title: 'Iceland ring road',
    lat: 64.9631,
    lng: -19.0208,
    yearSuggestion: 2031,
    note: 'Waterfalls, glaciers, midnight sun — maybe a summer trip?',
    createdBy: 'u-mara',
  },
  {
    id: 'i-morocco',
    title: 'Morocco',
    lat: 31.7917,
    lng: -7.0926,
    yearSuggestion: null,
    note: 'Marrakech, the Atlas mountains, maybe the desert too.',
    createdBy: 'u-jonas',
  },
]
