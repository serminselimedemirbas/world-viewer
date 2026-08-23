export const config = { runtime: 'edge' };

import { makeEtag, serveStatic } from '../../server/_shared/v8-static';

// Source: https://github.com/koala73/worldmonitor/blob/main/src/config/geo-map.ts (CRITICAL_MINERALS)
// This dataset already matches upstream 1:1 (11/11) — nothing to pull in for now.


export interface CriticalMineral {
  id: string;
  name: string;
  mineral: string;
  country: string;
  operatorName: string;
  lat: number;
  lon: number;
  significance: string;
  geopoliticalRisk: string;
  globalShare: string;
}

const DATA: CriticalMineral[] = [
  {
    id: "greenbushes",
    name: "Greenbushes Mine",
    mineral: "Lithium",
    country: "Australia",
    operatorName: "Talison Lithium (Albemarle / Tianqi)",
    lat: -33.85,
    lon: 116.05,
    significance:
      "World's largest hard-rock lithium mine. Primary supply source for EV battery cathode manufacturers in Asia and Europe.",
    geopoliticalRisk:
      "Chinese partial ownership via Tianqi Lithium creates strategic supply chain exposure for Western battery supply.",
    globalShare: "~15% global lithium supply",
  },
  {
    id: "atacama",
    name: "Salar de Atacama",
    mineral: "Lithium",
    country: "Chile",
    operatorName: "SQM / Albemarle",
    lat: -23.5,
    lon: -68.25,
    significance:
      "World's largest lithium brine deposit. Chile holds 37% of global reserves. Lowest-cost production globally.",
    geopoliticalRisk:
      "Chilean lithium nationalisation risk. Indigenous community water rights conflict. SQM political controversy.",
    globalShare: "~25% global lithium production",
  },
  {
    id: "silver_peak",
    name: "Silver Peak Mine",
    mineral: "Lithium",
    country: "USA",
    operatorName: "Albemarle",
    lat: 37.75,
    lon: -117.63,
    significance:
      "Only active US lithium mine. Critical for domestic battery supply chain under IRA provisions. Small output but outsized strategic importance.",
    geopoliticalRisk:
      "Scaling bottleneck. IRA subsidy dependency. US-China trade war pressure to expand domestic supply.",
    globalShare: "<1% global — strategic importance far exceeds volume",
  },
  {
    id: "pilgangoora",
    name: "Pilgangoora Project",
    mineral: "Lithium",
    country: "Australia",
    operatorName: "Pilbara Minerals",
    lat: -21.24,
    lon: 118.64,
    significance:
      "Major hard-rock spodumene producer. Key supplier to Chinese and South Korean battery cell manufacturers.",
    geopoliticalRisk:
      "Export dependency on China for processing. Five Eyes alignment pushing US-Australia critical minerals agreement.",
    globalShare: "~5% global lithium supply",
  },
  {
    id: "mutanda",
    name: "Mutanda Mine",
    mineral: "Cobalt",
    country: "DRC",
    operatorName: "Glencore",
    lat: -11.25,
    lon: 26.85,
    significance:
      "World's largest cobalt mine. Cobalt essential for lithium-ion battery cathode stability and jet engine superalloys.",
    geopoliticalRisk:
      "DRC political instability. Artisanal child mining scandal. Glencore past bribery history in DRC. M23 conflict proximity.",
    globalShare: "~20% global cobalt",
  },
  {
    id: "tenke",
    name: "Tenke Fungurume",
    mineral: "Cobalt / Copper",
    country: "DRC",
    operatorName: "CMOC (China)",
    lat: -10.6,
    lon: 26.12,
    significance:
      "Major Chinese-controlled cobalt and copper source. CMOC acquired from Freeport-McMoRan in 2016 — a strategic Chinese resource move.",
    geopoliticalRisk:
      "Chinese control of critical Western EV supply chain. DRC royalty disputes. Belt and Road extraction model.",
    globalShare: "~10% global cobalt",
  },
  {
    id: "bayan_obo",
    name: "Bayan Obo Mine",
    mineral: "Rare Earth Elements",
    country: "China",
    operatorName: "China Northern Rare Earth",
    lat: 41.8,
    lon: 109.97,
    significance:
      "World's largest REE deposit. Neodymium for EV motors and defense magnets. China controls 60%+ of global REE production. Beijing's export controls leverage.",
    geopoliticalRisk:
      "Chinese REE export restriction weapon. US/EU diversification efforts constrained. No short-term substitutes for neodymium magnets.",
    globalShare: "45% global REE production",
  },
  {
    id: "mountain_pass",
    name: "Mountain Pass Mine",
    mineral: "Rare Earth Elements",
    country: "USA",
    operatorName: "MP Materials",
    lat: 35.47,
    lon: -115.53,
    significance:
      "Only significant US REE mine. DoD supply chain priority. Still partially dependent on Chinese processing. Critical for F-35 and EV motor magnets.",
    geopoliticalRisk:
      "Chinese processing dependency for heavy REE. US-China trade war driver. DoD strategic stockpile concerns.",
    globalShare: "~15% US production; <5% global",
  },
  {
    id: "mount_weld",
    name: "Mount Weld",
    mineral: "Rare Earth Elements",
    country: "Australia",
    operatorName: "Lynas Rare Earths",
    lat: -27.4,
    lon: 122.55,
    significance:
      "Highest-grade REE deposit outside China. Lynas is the largest non-Chinese REE producer globally. Strategic Western alternative.",
    geopoliticalRisk:
      "Processing concentration in Malaysia creates risk. US-Australia critical minerals partnership accelerating.",
    globalShare: "~10% non-China REE supply",
  },
  {
    id: "wedabay",
    name: "Weda Bay Nickel",
    mineral: "Nickel",
    country: "Indonesia",
    operatorName: "Tsingshan / Eramet",
    lat: 0.4,
    lon: 127.97,
    significance:
      "Part of Indonesia's massive laterite nickel belt. Indonesia controls 52%+ of global nickel reserves. Chinese-funded smelters dominate processing.",
    geopoliticalRisk:
      "Indonesian export ban leverage. Chinese smelter dominance in processing. EV battery nickel demand surge creating geopolitical pressure.",
    globalShare: "~5% of Indonesia's dominant reserves",
  },
  {
    id: "norilsk",
    name: "Norilsk Complex",
    mineral: "Nickel / Palladium",
    country: "Russia",
    operatorName: "Nornickel",
    lat: 69.35,
    lon: 88.2,
    significance:
      "World's largest palladium producer (40%+ global supply). Major nickel and platinum group metals. Western sanctions creating supply disruption for auto catalysts.",
    geopoliticalRisk:
      "Ukraine war sanctions. No viable short-term alternative for palladium autocatalysts. Arctic logistics dependency. Most polluted city on Earth.",
    globalShare: "40%+ palladium; 15%+ global nickel",
  },
];

const ETAG = makeEtag(DATA);

export default function handler(req: Request): Promise<Response> {
  return serveStatic(req, DATA, ETAG);
}
