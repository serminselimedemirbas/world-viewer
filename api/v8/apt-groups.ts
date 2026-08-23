export const config = { runtime: 'edge' };

import { makeEtag, serveStatic } from '../../server/_shared/v8-static';

// Source: https://github.com/koala73/worldmonitor/blob/main/src/config/apt-groups.ts (APT_GROUPS)
// BIG GAP: upstream has 159 threat actors across Russia/China/DPRK/Iran/Middle
// East/S-SE Asia/S Korea/Africa/E Europe-criminal/S America/misc. Only 4 are
// seeded below (one per major state actor). To close the gap: pull the full
// `APT_GROUPS` array from the URL above and merge each new entry into DATA,
// following this same shape (add id/name/aka/sponsor/country/lat/lon plus a
// written description/capabilities/recentOperations/primaryTargets — upstream's
// own fields are much thinner than this shape, so those need composing, not
// just copying).


export interface AptGroup {
  id: string;
  name: string;
  aka: string;
  sponsor: string;
  country: string;
  lat: number;
  lon: number;
  description: string;
  capabilities: string[];
  recentOperations: string[];
  primaryTargets: string[];
}

const DATA: AptGroup[] = [
  {
    id: "apt28",
    name: "APT28 / APT29",
    aka: "Fancy Bear / Cozy Bear",
    sponsor: "Russia (GRU / FSB)",
    country: "Russia",
    lat: 55.75,
    lon: 37.6,
    description:
      "Russia's premier cyber warfare units. GRU Unit 26165 (APT28) focuses on aggressive espionage and political interference. FSB (APT29) conducts long-term stealthy collection against Western governments.",
    capabilities: [
      "Spear phishing at scale",
      "Supply chain compromise",
      "Zero-day exploitation",
      "Influence operations",
      "Critical infrastructure pre-positioning",
    ],
    recentOperations: [
      "SolarWinds supply chain (Cozy Bear)",
      "DNC / DCCC hack 2016",
      "European government targeting 2024",
      "Ukraine military cyber ops",
    ],
    primaryTargets: [
      "Government agencies",
      "Defense contractors",
      "Political parties",
      "NATO member states",
      "Think tanks",
    ],
  },
  {
    id: "apt41",
    name: "APT41",
    aka: "Double Dragon / Winnti",
    sponsor: "China (MSS)",
    country: "China",
    lat: 39.9,
    lon: 116.4,
    description:
      "Unique dual-mandate group conducting state espionage AND financially motivated cybercrime simultaneously. MSS-affiliated. Has breached targets in 14+ countries at once.",
    capabilities: [
      "Supply chain compromise",
      "Ransomware deployment",
      "IP theft at scale",
      "Mobile device exploitation",
      "Healthcare data exfiltration",
    ],
    recentOperations: [
      "COVID-19 vaccine research theft",
      "Gaming industry financial fraud",
      "US state government breach 2021",
      "ERP system targeting",
    ],
    primaryTargets: [
      "Healthcare / pharma",
      "Technology companies",
      "Telecoms",
      "Government",
      "Gaming / entertainment",
    ],
  },
  {
    id: "lazarus",
    name: "Lazarus Group",
    aka: "Hidden Cobra / Guardians of Peace",
    sponsor: "North Korea (RGB)",
    country: "North Korea",
    lat: 39.0,
    lon: 125.75,
    description:
      "DPRK's primary cyber warfare unit. Funds regime through financial cybercrime — responsible for $3B+ in stolen cryptocurrency. Elite hackers trained from childhood in state math programs.",
    capabilities: [
      "Cryptocurrency theft",
      "SWIFT banking attacks",
      "Ransomware (WannaCry)",
      "Defense sector espionage",
      "Social engineering / LinkedIn lures",
    ],
    recentOperations: [
      "Bybit exchange $1.5B hack (2025)",
      "Ronin Network $625M theft (2022)",
      "WannaCry global ransomware (2017)",
      "Sony Pictures destruction (2014)",
    ],
    primaryTargets: [
      "Cryptocurrency exchanges",
      "Banking / SWIFT",
      "Defense contractors",
      "South Korea / Japan",
      "Blockchain / DeFi",
    ],
  },
  {
    id: "apt33",
    name: "APT33 / APT35",
    aka: "Elfin / Charming Kitten",
    sponsor: "Iran (IRGC / MOIS)",
    country: "Iran",
    lat: 35.7,
    lon: 51.4,
    description:
      "Iran's dual cyber track. APT33 (IRGC) deploys destructive malware against energy sector targets. APT35 (MOIS) specializes in persistent phishing campaigns against dissidents, journalists, and nuclear researchers.",
    capabilities: [
      "Destructive wiper malware (Shamoon)",
      "ICS/SCADA attacks",
      "Spear phishing",
      "Credential harvesting portals",
      "Mobile surveillance (Android)",
    ],
    recentOperations: [
      "Saudi Aramco Shamoon wiper attack",
      "US/Israeli nuclear researcher targeting",
      "Gulf state critical infrastructure",
      "Anti-protest activist surveillance",
    ],
    primaryTargets: [
      "Energy sector / Aramco-type targets",
      "Aerospace / defense",
      "Nuclear researchers",
      "Dissidents and journalists",
      "Gulf Cooperation Council states",
    ],
  },
];

const ETAG = makeEtag(DATA);

export default function handler(req: Request): Promise<Response> {
  return serveStatic(req, DATA, ETAG);
}
