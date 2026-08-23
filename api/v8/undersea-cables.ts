export const config = { runtime: 'edge' };

import { makeEtag, serveStatic } from '../../server/_shared/v8-static';

// Source: https://github.com/koala73/worldmonitor/blob/main/src/config/geo-map.ts (UNDERSEA_CABLES)
// GAP: upstream lists 86 cables, only 18 are seeded below. To close the gap:
// pull the full array from the URL above and merge new entries, following
// this shape (path is [lat, lon] pairs — upstream's own path arrays use the
// same [lon, lat]-ish landing/waypoint style, just double check axis order
// per entry; `description` needs writing to match this dataset's style).


export interface UnderseaCable {
  id: string;
  name: string;
  region: string;
  capacityTbps: number;
  owners: string[];
  landingPoints: string[];
  description: string;
  path: [number, number][]; // [lat, lon]
}

const DATA: UnderseaCable[] = [
  {
    id: "marea", name: "MAREA", region: "Trans-Atlantic", capacityTbps: 200,
    owners: ["Microsoft", "Meta", "Telxius"],
    landingPoints: ["Virginia Beach, USA", "Bilbao, Spain"],
    description: "Microsoft and Meta's joint trans-Atlantic cable. 6,600km. Among the highest-capacity cables crossing the Atlantic. Opened 2017.",
    path: [[36.85, -75.98], [38.0, -55.0], [42.0, -35.0], [44.0, -15.0], [43.35, -3.0]],
  },
  {
    id: "grace_hopper", name: "Grace Hopper", region: "Trans-Atlantic", capacityTbps: 340,
    owners: ["Google"],
    landingPoints: ["New York, USA", "Bude, UK", "Bilbao, Spain"],
    description: "Google's trans-Atlantic cable named after computing pioneer Grace Hopper. Highest-capacity cable connecting US to Europe and UK. Opened 2022.",
    path: [[40.5, -74.0], [43.0, -45.0], [50.83, -4.57], [43.35, -3.0]],
  },
  {
    id: "havfrue", name: "Havfrue / AEC-2", region: "Trans-Atlantic", capacityTbps: 108,
    owners: ["Google", "Meta", "Aqua Comms"],
    landingPoints: ["New Jersey, USA", "Kristiansand, Norway", "Blaabjerg, Denmark", "Dublin, Ireland"],
    description: "US to Scandinavia cable. Critical for Nordic digital infrastructure. Named 'Mermaid' in Norwegian. Redundancy path avoiding UK. Opened 2020.",
    path: [[40.5, -74.5], [48.0, -40.0], [55.0, -15.0], [53.33, -6.25], [58.15, 8.0], [55.68, 8.18]],
  },
  {
    id: "faster", name: "FASTER", region: "Trans-Pacific", capacityTbps: 60,
    owners: ["Google", "China Mobile", "KDDI", "SingTel", "Global Transit", "CIMB"],
    landingPoints: ["Oregon, USA", "Chiba, Japan", "Mie, Japan"],
    description: "9,000km trans-Pacific cable. Major data corridor between US West Coast and Japan. Opened 2016. China Mobile co-ownership raises US intelligence concerns.",
    path: [[46.2, -124.0], [40.0, -160.0], [35.0, -175.0], [35.68, 139.77]],
  },
  {
    id: "southern_cross", name: "Southern Cross", region: "Trans-Pacific", capacityTbps: 72,
    owners: ["Southern Cross Cables", "Spark NZ", "Telstra", "Singtel Optus"],
    landingPoints: ["Sydney, Australia", "Auckland, NZ", "Fiji", "Hawaii", "Los Angeles, USA"],
    description: "Primary data link between Australia/NZ and the Americas. 30,500km. Critical infrastructure for both nations' digital economy. Upgraded Southern Cross NEXT added 2022.",
    path: [[-33.87, 151.21], [-36.86, 174.77], [-18.0, -178.0], [21.3, -157.8], [34.05, -118.24]],
  },
  {
    id: "curie", name: "Curie", region: "Trans-Pacific", capacityTbps: 72,
    owners: ["Google"],
    landingPoints: ["Los Angeles, USA", "Valparaíso, Chile"],
    description: "Google's private cable connecting US West Coast to South America. Named after Marie Curie. 10,500km. Supports Google Cloud South America expansion. Opened 2020.",
    path: [[34.05, -118.24], [15.0, -118.0], [-2.0, -100.0], [-18.0, -92.0], [-33.04, -71.62]],
  },
  {
    id: "seamewe6", name: "SEA-ME-WE 6", region: "Asia-Europe", capacityTbps: 100,
    owners: ["Consortium (14 carriers)"],
    landingPoints: ["Singapore", "Sri Lanka", "India", "UAE", "Saudi Arabia", "Egypt", "France", "Germany"],
    description: "6th edition of the longest cable system. 19,200km from Southeast Asia to Europe via Indian Ocean. Consortium of 14 major telecoms. Came online 2025.",
    path: [[1.35, 103.82], [7.0, 80.0], [13.0, 72.0], [17.0, 57.0], [25.0, 56.0], [12.0, 45.0], [27.0, 34.0], [31.0, 32.0], [43.0, 5.5], [48.0, 7.0]],
  },
  {
    id: "flag_europe_asia", name: "FLAG Europe-Asia", region: "Asia-Europe", capacityTbps: 10,
    owners: ["Global Cloud Xchange (Reliance)"],
    landingPoints: ["UK", "Spain", "Egypt", "UAE", "India", "Thailand", "Singapore", "Japan"],
    description: "27,000km — once the world's longest cable. Connects UK to Japan via Middle East and Asia. Older capacity (10 Tbps) but strategically routed. India's GCX subsidiary.",
    path: [[51.5, -3.5], [38.0, -9.0], [31.0, 32.0], [25.0, 56.0], [13.0, 80.0], [7.0, 100.0], [1.35, 103.82], [23.0, 121.0], [35.68, 139.77]],
  },
  {
    id: "2africa", name: "2Africa", region: "Africa", capacityTbps: 180,
    owners: ["Meta", "MTN", "Vodafone", "Orange", "Telecom Egypt", "WIOCC"],
    landingPoints: ["UK", "Portugal", "Senegal", "Nigeria", "South Africa", "Kenya", "Saudi Arabia", "Egypt"],
    description: "45,000km — world's longest cable system. Circles entire African continent. Meta-led consortium. Will connect 3 billion people when complete. Transformative for African internet access.",
    path: [
      [51.5, -3.5], [38.0, -9.0], [14.7, -17.5], [5.0, -0.2], [6.45, 3.4],
      [-4.0, 11.0], [-10.0, 15.0], [-25.0, 32.0], [-33.87, 18.42], [-11.0, 36.0],
      [-4.0, 39.67], [2.0, 45.0], [11.59, 43.15], [21.52, 39.18], [27.0, 34.0], [31.0, 32.0],
    ],
  },
  {
    id: "wacs", name: "WACS", region: "Africa", capacityTbps: 14.5,
    owners: ["MTN", "Vodacom", "Togo Telecom", "Telecom Namibia"],
    landingPoints: ["South Africa", "Namibia", "Congo", "Nigeria", "Portugal", "UK"],
    description: "West Africa Cable System. 14,530km. Primary connectivity for West African nations. Key for financial transactions and government communications across 13 landing points.",
    path: [[-33.87, 18.42], [-22.0, 14.0], [-4.0, 10.0], [4.0, 8.0], [14.0, -17.5], [38.0, -9.0], [51.5, -3.5]],
  },
  {
    id: "eassy", name: "EASSy", region: "Africa", capacityTbps: 10,
    owners: ["16-company consortium"],
    landingPoints: ["South Africa", "Mozambique", "Tanzania", "Kenya", "Somalia", "Djibouti"],
    description: "Eastern Africa Submarine Cable System. 10,000km. Serves East African coast. Primary internet backbone for landlocked countries via Kenya and Tanzania nodes.",
    path: [[-33.87, 18.42], [-25.0, 33.0], [-18.0, 36.0], [-10.0, 40.0], [-4.0, 39.67], [2.0, 45.0], [11.59, 43.15]],
  },
  {
    id: "sam1", name: "SAm-1", region: "Americas", capacityTbps: 2,
    owners: ["Telxius (Telefónica)"],
    landingPoints: ["Brazil", "Uruguay", "Argentina", "Chile", "Peru", "Colombia", "Panama"],
    description: "South American ring cable. Circles the continent's coast. Critical for intra-regional communications. Oldest high-capacity cable serving South America's Pacific coast.",
    path: [[-3.1, -44.3], [-15.0, -40.0], [-23.0, -43.2], [-34.0, -53.0], [-33.45, -70.67], [-18.0, -70.5], [-12.0, -77.0], [4.0, -77.0]],
  },
  {
    id: "ellalink", name: "EllaLink", region: "Americas", capacityTbps: 72,
    owners: ["EllaLink", "Tata", "Algar Telecom"],
    landingPoints: ["Madeira, Portugal", "Sines, Portugal", "Cape Verde", "Brazil"],
    description: "Direct Europe-Brazil cable avoiding North American infrastructure. 6,200km. Latency advantage for financial trading. Opened 2021. Named after mathematician Ella Fitzgerald.",
    path: [[38.0, -9.0], [15.0, -25.0], [5.0, -35.0], [-3.1, -44.3]],
  },
  {
    id: "apg", name: "APG (Asia Pacific Gateway)", region: "Asia-Pacific", capacityTbps: 54,
    owners: ["NTT", "China Telecom", "KT Corp", "PLDT", "Viettel"],
    landingPoints: ["Japan", "South Korea", "China", "Taiwan", "Hong Kong", "Vietnam", "Malaysia", "Singapore"],
    description: "10,400km intra-Asia cable. Connects major East Asian economies. China Telecom co-ownership creates intelligence access concern. Key for regional data flows.",
    path: [[35.68, 139.77], [37.56, 126.98], [31.0, 122.0], [25.0, 122.0], [22.28, 114.16], [10.0, 107.0], [3.0, 103.5], [1.35, 103.82]],
  },
  {
    id: "indigo", name: "Indigo Central / West", region: "Asia-Pacific", capacityTbps: 36,
    owners: ["Google", "AARNet", "Indosat", "Singtel"],
    landingPoints: ["Singapore", "Christmas Island", "Perth, Australia", "Sydney, Australia"],
    description: "Google's Australia-Asia cable. 9,200km. Critical for Australian cloud services. Bypasses Southeast Asian congestion. Opened 2019.",
    path: [[1.35, 103.82], [-6.0, 106.0], [-10.5, 105.7], [-22.0, 115.0], [-31.96, 115.86], [-33.87, 151.21]],
  },
  {
    id: "sjc", name: "SJC (South-East Asia Japan Cable)", region: "Asia-Pacific", capacityTbps: 28,
    owners: ["China Mobile", "China Telecom", "Google", "KDDI", "Singtel"],
    landingPoints: ["Singapore", "Hong Kong", "Philippines", "Japan", "Los Angeles, USA"],
    description: "8,900km cable connecting Southeast Asia to Japan and US. China Mobile/Telecom co-ownership critical. Taiwan Strait segment vulnerable. Carries significant China-US traffic.",
    path: [[1.35, 103.82], [14.0, 108.0], [22.28, 114.16], [25.0, 125.0], [35.68, 139.77], [38.0, 165.0], [34.05, -118.24]],
  },
  {
    id: "farice", name: "FARICE-1", region: "Arctic / Europe", capacityTbps: 5,
    owners: ["Farice ehf", "BT", "Irish Telecom"],
    landingPoints: ["Iceland", "Faroe Islands", "UK", "Ireland"],
    description: "Critical Arctic route cable. Iceland's primary link to global internet. 1,400km. Failure would isolate Iceland digitally. Greenland-adjacent Arctic strategic corridor.",
    path: [[64.13, -21.82], [62.0, -7.0], [57.0, -5.0], [54.6, -5.9], [51.9, -10.0]],
  },
  {
    id: "falcon", name: "Falcon", region: "Middle East", capacityTbps: 5,
    owners: ["GBI (Gulf Bridge International)"],
    landingPoints: ["UAE", "Oman", "Bahrain", "Kuwait", "Qatar"],
    description: "Gulf Cooperation Council ring cable. Connects all GCC states. Critical for Saudi Aramco and Gulf financial transactions. Vulnerable to Hormuz crisis disruption.",
    path: [[25.2, 55.27], [23.61, 58.59], [22.0, 60.0], [22.0, 57.0], [25.29, 51.53], [26.22, 50.58], [29.37, 47.98]],
  },
];

const ETAG = makeEtag(DATA);

export default function handler(req: Request): Promise<Response> {
  return serveStatic(req, DATA, ETAG);
}
