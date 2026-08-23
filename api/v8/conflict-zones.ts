export const config = { runtime: 'edge' };

import { makeEtag, serveStatic } from '../../server/_shared/v8-static';

// Source: https://github.com/koala73/worldmonitor/blob/main/shared/geo-data.ts (CONFLICT_ZONES)
// Already synced with upstream (10/10) — nothing to pull in for now.
// polygon coordinates are [lat, lon] pairs (matches the iOS CLLocationCoordinate2D source order).


export interface ConflictZone {
  id: string;
  name: string;
  intensity: "high" | "medium" | "low";
  centerLat: number;
  centerLon: number;
  parties: string[];
  casualties: string | null;
  displaced: string | null;
  description: string;
  startDateISO: string;
  location: string | null;
  keyDevelopments: string[];
  polygon: [number, number][]; // [lat, lon]
}

const DATA: ConflictZone[] = [
  {
    id: "iran",
    name: "Iran War Theater",
    intensity: "high",
    centerLat: 32,
    centerLon: 53,
    parties: ["United States", "Israel", "Iran", "IRGC"],
    casualties: "200+ killed (first 72hrs)",
    displaced: "Millions fleeing major cities",
    description:
      "Joint US-Israeli military operation (US: Operation Epic Fury / Israel: Operation Roaring Lion). 1000+ targets struck including military, nuclear, and leadership sites. Supreme Leader Khamenei killed in Tehran strikes. Iran retaliating with missiles and drones across the region.",
    startDateISO: "2026-02-28",
    location: "Iran (nationwide)",
    keyDevelopments: [
      "Khamenei killed in Tehran strikes",
      "1000+ Iranian targets struck",
      "3 US service members KIA",
      "Iranian missile/drone retaliation on Gulf states",
    ],
    polygon: [
      [39.5, 44.5], [38.4, 48.5], [37.5, 50.0], [37.0, 54.0],
      [38.0, 57.0], [37.5, 59.5], [35.5, 61.0], [31.5, 62.0],
      [29.5, 61.0], [25.5, 61.5], [25.1, 59.5], [25.0, 57.5],
      [26.5, 56.5], [27.5, 54.5], [28.0, 53.0], [29.5, 49.5],
      [30.5, 49.0], [32.0, 48.0], [33.5, 46.5], [37.0, 45.5],
      [39.5, 44.5],
    ],
  },
  {
    id: "strait_hormuz",
    name: "Strait of Hormuz Crisis",
    intensity: "high",
    centerLat: 26.2,
    centerLon: 56.5,
    parties: ["Iran (IRGC Navy)", "US Navy (5th Fleet)", "Coalition forces"],
    casualties: "Maritime casualties reported",
    displaced: "Global shipping halted",
    description:
      "Iran attempting to close Strait of Hormuz. IRGC naval/air operations active. Three tankers damaged. US sank 9 Iranian warships. GPS spoofing/jamming reported. 20-30% of global oil/gas transits through this chokepoint. Brent crude spiking to $80+.",
    startDateISO: "2026-02-28",
    location: "Strait of Hormuz & Persian Gulf Approaches",
    keyDevelopments: [
      "Iran attempts Hormuz closure",
      "3 tankers damaged",
      "US sinks 9 Iranian warships",
      "Global shipping paused",
      "Oil prices spike",
    ],
    polygon: [
      [28.5, 49.5], [29.5, 50.5], [29.0, 52.5], [27.5, 55.0],
      [26.5, 56.5], [25.5, 58.0], [24.5, 59.5], [23.0, 59.5],
      [22.5, 58.5], [23.5, 57.0], [24.5, 55.5], [25.5, 55.5],
      [26.5, 54.5], [27.5, 52.5], [28.5, 49.5],
    ],
  },
  {
    id: "ukraine",
    name: "Ukraine War",
    intensity: "high",
    centerLat: 48.5,
    centerLon: 31,
    parties: ["Russia", "Ukraine", "NATO (support)"],
    casualties: "500,000+ (est.)",
    displaced: "6.5M+ refugees",
    description:
      "Full-scale Russian invasion of Ukraine. Active frontlines in Donetsk, Luhansk, Zaporizhzhia, and Kherson oblasts. Heavy artillery, drone warfare, and trench combat.",
    startDateISO: "2022-02-24",
    location: "Eastern Ukraine (Donetsk, Luhansk)",
    keyDevelopments: [
      "Battle of Bakhmut",
      "Kursk incursion",
      "Black Sea drone strikes",
      "Infrastructure attacks",
    ],
    polygon: [
      [52.5, 22.2], [52.0, 28.0], [51.5, 33.5], [52.3, 35.5],
      [50.0, 38.5], [47.5, 40.0], [46.5, 37.5], [45.5, 35.5],
      [45.2, 36.5], [45.0, 34.0], [45.5, 32.5], [46.0, 30.5],
      [45.5, 29.5], [45.7, 28.5], [48.0, 24.0], [49.0, 22.5],
      [52.5, 22.2],
    ],
  },
  {
    id: "gaza",
    name: "Gaza Conflict",
    intensity: "high",
    centerLat: 31.5,
    centerLon: 34.5,
    parties: ["Israel", "Hamas", "Hezbollah", "PIJ"],
    casualties: "40,000+ (Gaza)",
    displaced: "2M+ displaced",
    description:
      "Israeli military operations in Gaza following October 7 attacks. Ground invasion, aerial bombardment. Humanitarian crisis. Regional escalation with Hezbollah.",
    startDateISO: "2023-10-07",
    location: "Gaza Strip, Palestinian Territories",
    keyDevelopments: [
      "Rafah ground operation",
      "Humanitarian crisis",
      "Hostage negotiations",
      "Iran-backed attacks",
    ],
    polygon: [
      [31.73, 34.53], [31.60, 34.53], [31.48, 34.50],
      [31.35, 34.46], [31.22, 34.38], [31.22, 34.24],
      [31.40, 34.22], [31.60, 34.24], [31.73, 34.30],
      [31.73, 34.53],
    ],
  },
  {
    id: "south_lebanon",
    name: "Israel-Lebanon Border",
    intensity: "high",
    centerLat: 33.2,
    centerLon: 35.4,
    parties: ["Israel (IDF)", "Hezbollah"],
    casualties: "500+ killed",
    displaced: "150k+ displaced",
    description:
      "Cross-border artillery and rocket fire. Targeted assassinations. High risk of full-scale escalation.",
    startDateISO: "2023-10-08",
    location: "Southern Lebanon / Northern Israel",
    keyDevelopments: [
      "Daily rocket fire",
      "IDF airstrikes",
      "Buffer zone evacuation",
      "Litani River tensions",
    ],
    polygon: [
      [34.0, 35.1], [33.9, 35.5], [33.8, 36.0], [33.6, 36.5],
      [33.3, 36.6], [33.0, 36.5], [32.8, 36.0], [32.7, 35.5],
      [32.8, 35.0], [33.1, 34.9], [33.5, 35.0], [34.0, 35.1],
    ],
  },
  {
    id: "yemen_redsea",
    name: "Red Sea Crisis",
    intensity: "high",
    centerLat: 14,
    centerLon: 43,
    parties: ["Houthis", "US/UK Coalition", "Yemen Govt"],
    casualties: "Unknown (Maritime)",
    displaced: "4.5M+ (Yemen Civil War)",
    description:
      "Houthi maritime campaign against commercial shipping. US/UK airstrikes on Houthi targets. Ongoing blockade attempts.",
    startDateISO: "2023-11-19",
    location: "Red Sea & Gulf of Aden, Yemen",
    keyDevelopments: ["Ship hijackings", "Cable cuts", "Sinking of Rubymar", "Oil prices spike"],
    polygon: [
      [22.0, 37.0], [21.0, 38.5], [18.5, 39.0], [16.0, 42.0],
      [14.0, 43.0], [12.0, 44.5], [11.0, 45.5], [11.5, 46.5],
      [12.5, 45.0], [14.5, 44.5], [16.5, 43.5], [18.5, 41.5],
      [20.5, 39.5], [22.5, 38.0], [23.0, 37.5], [22.5, 36.5],
      [22.0, 37.0],
    ],
  },
  {
    id: "sudan",
    name: "Sudan Civil War",
    intensity: "high",
    centerLat: 15.5,
    centerLon: 30,
    parties: ["Sudanese Armed Forces (SAF)", "Rapid Support Forces (RSF)", "Allied militias"],
    casualties: "150,000+ killed (est.)",
    displaced: "14M+ internally displaced, 3M+ refugees",
    description:
      "Power struggle between SAF and RSF paramilitary has engulfed the entire country. RSF controls most of Darfur and Khartoum; SAF holds Port Sudan and eastern regions. World's largest displacement crisis. Famine conditions in multiple states.",
    startDateISO: "2023-04-15",
    location: "Sudan (nationwide)",
    keyDevelopments: [
      "Khartoum destruction",
      "Darfur ethnic massacres",
      "El Fasher siege",
      "Wad Madani fall to RSF",
      "Famine declared in North Darfur",
      "SAF counter-offensives",
      "Regional proxy involvement (UAE, Egypt)",
    ],
    polygon: [
      [22.0, 25.0], [22.0, 30.5], [21.5, 32.0], [22.0, 36.5],
      [19.5, 37.5], [17.5, 38.5], [15.0, 36.5], [12.0, 35.0],
      [10.5, 34.0], [10.0, 32.5], [11.0, 28.0], [12.5, 25.5],
      [15.5, 24.0], [20.0, 24.0], [22.0, 25.0],
    ],
  },
  {
    id: "myanmar",
    name: "Myanmar Civil War",
    intensity: "medium",
    centerLat: 20,
    centerLon: 96.5,
    parties: ["Military junta (Tatmadaw)", "NUG / PDF", "Arakan Army (AA)", "MNDAA / TNLA / KIA", "Ethnic armed organizations"],
    casualties: "50,000+ (est.)",
    displaced: "3M+ internally displaced",
    description:
      "Civil war following military coup. Resistance forces gaining ground. Multiple ethnic armed organizations. Humanitarian crisis.",
    startDateISO: "2021-02-01",
    location: "Myanmar (Burma)",
    keyDevelopments: [
      "Operation 1027 (Shan State)",
      "Lashio capture by MNDAA",
      "AA controls most of Rakhine",
      "Myawaddy capture",
      "Junta airstrikes on civilians",
      "Resistance advances in Sagaing",
    ],
    polygon: [
      [28.5, 97.5], [26.5, 98.5], [25.5, 97.5], [24.0, 97.5],
      [23.5, 98.5], [22.0, 98.0], [20.5, 99.5], [20.0, 100.5],
      [18.5, 100.5], [17.5, 100.0], [16.0, 98.5], [15.5, 97.5],
      [14.0, 98.5], [14.5, 100.0], [16.0, 101.0], [18.5, 101.5],
      [20.0, 101.0], [22.5, 101.5], [24.5, 101.5], [25.5, 100.5],
      [27.5, 99.5], [28.5, 97.5],
    ],
  },
  {
    id: "korean_dmz",
    name: "Korean DMZ",
    intensity: "low",
    centerLat: 38.3,
    centerLon: 127.0,
    parties: ["ROK / US Forces Korea", "DPRK KPA", "UN Command"],
    casualties: null,
    displaced: null,
    description:
      "One of the most heavily fortified borders on Earth. 4km-wide Demilitarized Zone separating North and South Korea since 1953. DPRK has declared inter-Korean relations permanently hostile.",
    startDateISO: "1953-07-27",
    location: "Korean Demilitarized Zone (38th Parallel)",
    keyDevelopments: [
      "DPRK constitutional change: ROK = enemy state",
      "Balloon/trash warfare ongoing",
      "Russia-DPRK military cooperation",
      "ICBM test program active",
    ],
    polygon: [
      [38.65, 125.5], [38.7, 127.5], [38.6, 129.0], [38.45, 129.2],
      [38.2, 129.0], [37.95, 128.5], [37.85, 127.0], [37.9, 125.8],
      [38.1, 125.5], [38.4, 125.4], [38.65, 125.5],
    ],
  },
  {
    id: "pak_afghan",
    name: "Pakistan–Afghanistan Border Conflict",
    intensity: "medium",
    centerLat: 31.8,
    centerLon: 69.0,
    parties: ["Pakistan Military", "TTP", "Afghan Taliban"],
    casualties: "Ongoing military and civilian casualties",
    displaced: "Displacement along border areas",
    description:
      "Escalating tensions along the Pakistan–Afghanistan border. Pakistan has conducted cross-border strikes targeting TTP sanctuaries in Afghan territory, prompting border closures and diplomatic friction with the Taliban government. Long-running dispute over militant safe havens and border security.",
    startDateISO: "2024-01-01",
    location: "Pakistan–Afghanistan border (KPK, Balochistan)",
    keyDevelopments: [
      "Pakistan cross-border strikes in Afghanistan",
      "TTP attacks in KPK",
      "Torkham/Chaman crossing tensions",
      "Militant infiltration and border closures",
    ],
    polygon: [
      [35.70, 72.50],
      [31.69, 69.40],
      [29.33, 65.95],
      [30.29, 64.90],
      [36.55, 71.02],
      [35.70, 72.50],
    ],
  },
];

const ETAG = makeEtag(DATA);

export default function handler(req: Request): Promise<Response> {
  return serveStatic(req, DATA, ETAG);
}
