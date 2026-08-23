export const config = { runtime: 'edge' };

import { makeEtag, serveStatic } from '../../server/_shared/v8-static';

// Source: https://github.com/koala73/worldmonitor/blob/main/shared/geo-data.ts (STRATEGIC_WATERWAYS)
// Already synced with upstream (13/13 upstream chokepoints present, plus
// Dardanelles as a bonus entry not modeled separately upstream) — nothing to
// pull in for now.


export interface StrategicWaterway {
  id: string;
  name: string;
  region: string;
  lat: number;
  lon: number;
  description: string;
  tradePercent: string;
  controlledBy: string;
  activeThreats: string[];
  strategicValue: string;
}

const DATA: StrategicWaterway[] = [
  {
    id: "taiwan_strait",
    name: "Taiwan Strait",
    region: "Western Pacific",
    lat: 24.5,
    lon: 120.5,
    description:
      "180km channel between Taiwan and mainland China. 48% of global container ships transit annually. PLA live-fire exercises frequent.",
    tradePercent: "$2.45T trade annually",
    controlledBy: "Contested — China / Taiwan / US",
    activeThreats: [
      "PLA gray-zone operations",
      "Live-fire exercise disruptions",
      "TSMC supply chain risk",
    ],
    strategicValue:
      "90% of world's advanced semiconductors produced on Taiwan. Closure would collapse global tech supply chains.",
  },
  {
    id: "malacca_strait",
    name: "Strait of Malacca",
    region: "Southeast Asia",
    lat: 2.5,
    lon: 101.0,
    description:
      "800km strait connecting the Indian Ocean to the South China Sea. World's busiest shipping lane with 100,000+ vessels per year.",
    tradePercent: "25% of global trade",
    controlledBy: "Malaysia / Singapore / Indonesia",
    activeThreats: [
      "Piracy resurgence",
      "Congestion risk",
      "Chinese influence in port infrastructure",
    ],
    strategicValue:
      "Single viable alternative via Lombok Strait adds 1,000km. China's 'Malacca Dilemma' shapes its BRI strategy.",
  },
  {
    id: "hormuz_strait",
    name: "Strait of Hormuz",
    region: "Persian Gulf",
    lat: 26.6,
    lon: 56.3,
    description:
      "Only sea route from the Persian Gulf. Iran controls the northern shore. IRGC Navy conducts active patrols. Currently contested.",
    tradePercent: "20% of global oil & LNG",
    controlledBy: "Contested — Iran / Oman / US 5th Fleet",
    activeThreats: [
      "Iran closure threat",
      "IRGC vessel harassment",
      "Mine warfare",
      "Tanker seizures",
    ],
    strategicValue:
      "Closure would spike oil prices 30%+ overnight. No viable alternative exists for Persian Gulf exports.",
  },
  {
    id: "bosphorus",
    name: "Bosphorus Strait",
    region: "Black Sea / Turkey",
    lat: 41.1,
    lon: 29.05,
    description:
      "17-mile strait bisecting Istanbul. Turkey controls access under the Montreux Convention. Russian Black Sea Fleet transit blocked since Ukraine war.",
    tradePercent: "3% of global oil; Black Sea grain",
    controlledBy: "Turkey (Montreux Convention 1936)",
    activeThreats: [
      "Russia-NATO standoff",
      "Ukraine war shipping impact",
      "Sanctions enforcement disputes",
    ],
    strategicValue:
      "Only Black Sea access. Russian naval containment. Ukrainian grain export corridor — 400M people depend on Black Sea wheat.",
  },
  {
    id: "suez",
    name: "Suez Canal",
    region: "Egypt / Red Sea",
    lat: 30.5,
    lon: 32.4,
    description:
      "193km canal connecting the Mediterranean to the Red Sea. Managed by Egypt. Ever Given incident exposed systemic fragility. Houthi attacks have forced mass rerouting.",
    tradePercent: "12% of global trade",
    controlledBy: "Egypt (Suez Canal Authority)",
    activeThreats: [
      "Houthi Red Sea campaign forcing rerouting",
      "Egypt political instability",
      "Climate-driven traffic surge",
    ],
    strategicValue:
      "Europe-Asia shortcut. Alternative via Cape of Good Hope adds 10–14 days and 30% freight cost.",
  },
  {
    id: "panama",
    name: "Panama Canal",
    region: "Central America",
    lat: 9.1,
    lon: -79.7,
    description:
      "82km canal connecting Atlantic to Pacific. Chinese firms operate ports at both ends. Severe 2023–2024 drought cut capacity by 30%.",
    tradePercent: "5% of global trade; 40% US container imports",
    controlledBy: "Panama (US strategic interest, Chinese port presence)",
    activeThreats: [
      "Chinese port dominance at both ends",
      "Climate/drought capacity cuts",
      "US-Panama sovereignty tensions",
    ],
    strategicValue:
      "Critical US military projection route. LNG and grain exports. Drought vulnerability is accelerating.",
  },
  {
    id: "gibraltar",
    name: "Strait of Gibraltar",
    region: "Atlantic / Mediterranean",
    lat: 35.95,
    lon: -5.5,
    description:
      "14km strait between Europe and Africa. NATO-controlled gateway to the Mediterranean. 300+ vessels daily. Russian submarine surveillance flashpoint.",
    tradePercent: "10% of global maritime trade",
    controlledBy: "UK (Gibraltar) / Spain / Morocco",
    activeThreats: [
      "Spain-UK sovereignty dispute",
      "Russian submarine monitoring",
      "Migration crisis pressure",
    ],
    strategicValue:
      "NATO inner-sea access gate. Russian submarine tracking hub. Key to Mediterranean maritime dominance.",
  },
  {
    id: "bab_el_mandeb",
    name: "Bab el-Mandeb",
    region: "Red Sea / Horn of Africa",
    lat: 12.6,
    lon: 43.4,
    description:
      "29km strait between Yemen and Djibouti. Houthi attacks ongoing since Nov 2023. US/UK conducting air strikes. 50+ commercial vessels attacked.",
    tradePercent: "10% of global trade via Suez route",
    controlledBy: "Contested — Houthis / US-UK Coalition",
    activeThreats: [
      "Houthi drone and missile attacks",
      "US/UK airstrikes in Yemen",
      "Undersea cable cuts",
      "Commercial shipping rerouting",
    ],
    strategicValue:
      "Insurance premiums spiked 400%. Europe-Asia Suez route blocked for many carriers. Iran proxy demonstration of maritime power.",
  },
  {
    id: "dardanelles",
    name: "Dardanelles",
    region: "Turkey / Aegean",
    lat: 40.2,
    lon: 26.4,
    description:
      "61km strait in northwest Turkey linking the Aegean to the Sea of Marmara. Forms the southern half of the Turkish Straits system with the Bosphorus.",
    tradePercent: "3% of global trade; Black Sea access",
    controlledBy: "Turkey (Montreux Convention)",
    activeThreats: [
      "NATO-Turkey friction on warship transit",
      "Russia warship dispute",
      "Grain corridor politics",
    ],
    strategicValue:
      "Paired with Bosphorus as Turkish Straits — Russia's only warm-water naval exit. Montreux gives Turkey geopolitical leverage.",
  },
  {
    id: "cape_of_good_hope",
    name: "Cape of Good Hope",
    region: "Southern Africa",
    lat: -34.36,
    lon: 18.49,
    description:
      "Southern tip of Africa, the traditional Europe-Asia route before Suez. Traffic has surged since Houthi attacks forced mass rerouting away from the Red Sea/Suez corridor.",
    tradePercent: "Rising share of Europe-Asia tanker traffic",
    controlledBy: "South Africa",
    activeThreats: [
      "Suez/Red Sea rerouting surge",
      "Rough seas and piracy risk off Somalia detour",
      "Port congestion at Durban/Cape Town",
    ],
    strategicValue:
      "Adds 10–14 days and ~30% freight cost versus Suez, but has become the safe-harbor alternative during Red Sea hostilities.",
  },
  {
    id: "dover_strait",
    name: "Strait of Dover",
    region: "English Channel",
    lat: 51.0,
    lon: 1.5,
    description:
      "Narrowest point of the English Channel between England and France. World's busiest shipping lane by vessel count, with 400+ transits daily.",
    tradePercent: "World's busiest shipping lane by traffic volume",
    controlledBy: "UK / France",
    activeThreats: [
      "Migrant small-boat crossings",
      "Post-Brexit customs friction",
      "Vessel congestion and collision risk",
    ],
    strategicValue:
      "Gateway to Northern Europe's largest ports (Rotterdam, Antwerp, Hamburg). Any disruption ripples through European supply chains.",
  },
  {
    id: "korea_strait",
    name: "Korea Strait",
    region: "East Asia",
    lat: 34.0,
    lon: 129.0,
    description:
      "Connects the East China Sea to the Sea of Japan between South Korea and Japan (via Tsushima). Major commercial shipping lane and a corridor for North Korean missile overflights.",
    tradePercent: "Key Japan-Korea-China shipping corridor",
    controlledBy: "South Korea / Japan",
    activeThreats: [
      "DPRK missile tests overflying the strait",
      "Japan-Korea historical/territorial friction",
      "US 7th Fleet transit activity",
    ],
    strategicValue:
      "Critical link for South Korean and Japanese trade; a flashpoint corridor whenever North Korea tests long-range missiles.",
  },
  {
    id: "kerch_strait",
    name: "Kerch Strait",
    region: "Black Sea / Sea of Azov",
    lat: 45.3,
    lon: 36.6,
    description:
      "Narrow strait between Crimea and Russia's Taman Peninsula, spanned by the Russian-built Kerch Bridge. Site of the 2018 Russia-Ukraine naval clash and a persistent flashpoint since the 2022 invasion.",
    tradePercent: "Sole sea access to the Sea of Azov (Mariupol, Berdyansk)",
    controlledBy: "Contested — Russia (de facto) / Ukraine (claimed)",
    activeThreats: [
      "Ukrainian strikes on the Kerch Bridge",
      "Russian naval blockade of Azov ports",
      "Mine warfare risk",
    ],
    strategicValue:
      "Controls all sea access to Mariupol and the Sea of Azov; the bridge is a key logistics link for Russian forces in occupied Crimea.",
  },
  {
    id: "lombok_strait",
    name: "Lombok Strait",
    region: "Indonesia",
    lat: -8.5,
    lon: 115.7,
    description:
      "Deep-water passage between Bali and Lombok. The only route capable of carrying the supertankers (VLCCs) too large or deep-draft for the Strait of Malacca.",
    tradePercent: "Primary VLCC bypass for the Malacca Strait",
    controlledBy: "Indonesia",
    activeThreats: [
      "Growing traffic as Malacca congestion rises",
      "Indonesian archipelagic sea lane disputes",
      "Limited port/salvage infrastructure nearby",
    ],
    strategicValue:
      "Central to China's 'Malacca Dilemma' calculus — the deep-water fallback for oil supertankers that keeps Indo-Pacific energy flows moving if Malacca is disrupted.",
  },
];

const ETAG = makeEtag(DATA);

export default function handler(req: Request): Promise<Response> {
  return serveStatic(req, DATA, ETAG);
}
