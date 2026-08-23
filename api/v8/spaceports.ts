export const config = { runtime: 'edge' };

import { makeEtag, serveStatic } from '../../server/_shared/v8-static';

// Source: https://github.com/koala73/worldmonitor/blob/main/src/config/geo-map.ts (SPACEPORTS)
// This dataset already matches upstream 1:1 (12/12) — nothing to pull in for now.


export interface Spaceport {
  id: string;
  name: string;
  country: string;
  operatorName: string;
  lat: number;
  lon: number;
  launchActivity: "high" | "medium" | "low";
  description: string;
  notablePrograms: string[];
}

const DATA: Spaceport[] = [
  {
    id: "ksc",
    name: "Kennedy Space Center",
    country: "USA",
    operatorName: "NASA / SpaceX",
    lat: 28.524,
    lon: -80.651,
    launchActivity: "high",
    description:
      "America's primary crewed launch facility. SpaceX Falcon 9 workhorse. Artemis moon program headquarters. Highest launch cadence of any US facility.",
    notablePrograms: [
      "Artemis moon program",
      "SpaceX Dragon crewed missions",
      "NSSL national security launches",
      "Commercial ISS resupply",
    ],
  },
  {
    id: "boca_chica",
    name: "Starbase (Boca Chica)",
    country: "USA",
    operatorName: "SpaceX",
    lat: 25.997,
    lon: -97.155,
    launchActivity: "high",
    description:
      "SpaceX's Starship development and launch complex. Fully reusable super-heavy rocket reshaping economics of space access. Elon Musk's vision for Mars.",
    notablePrograms: [
      "Starship / Super Heavy",
      "Starlink constellation expansion",
      "Mars mission architecture",
      "Point-to-point Earth transport",
    ],
  },
  {
    id: "vandenberg",
    name: "Vandenberg Space Force Base",
    country: "USA",
    operatorName: "US Space Force",
    lat: 34.73,
    lon: -120.57,
    launchActivity: "medium",
    description:
      "US military's primary space launch facility. Polar orbit capability for reconnaissance and intelligence satellites. National security payload priority.",
    notablePrograms: [
      "NRO reconnaissance satellites",
      "GPS Block III constellation",
      "National security payloads",
      "SpaceX rideshare polar missions",
    ],
  },
  {
    id: "baikonur",
    name: "Baikonur Cosmodrome",
    country: "Kazakhstan",
    operatorName: "Roscosmos",
    lat: 45.965,
    lon: 63.305,
    launchActivity: "medium",
    description:
      "World's first and historically largest launch facility. Gagarin launched from here in 1961. Russia leases from Kazakhstan. Activity declining post-sanctions.",
    notablePrograms: [
      "Soyuz crewed missions (declining)",
      "Proton rockets",
      "ISS resupply (reduced)",
      "Russian military satellites",
    ],
  },
  {
    id: "plesetsk",
    name: "Plesetsk Cosmodrome",
    country: "Russia",
    operatorName: "Russian Ministry of Defence",
    lat: 62.93,
    lon: 40.57,
    launchActivity: "medium",
    description:
      "Russia's primary military launch site inside Russian territory. Soyuz-2 and new Angara heavy rockets. Polar orbit capability. ASAT weapon test site.",
    notablePrograms: [
      "Military surveillance satellites",
      "Angara-A5 heavy lift",
      "Glonass GPS constellation",
      "ASAT tests (2021 debris field)",
    ],
  },
  {
    id: "vostochny",
    name: "Vostochny Cosmodrome",
    country: "Russia",
    operatorName: "Roscosmos",
    lat: 51.884,
    lon: 128.334,
    launchActivity: "low",
    description:
      "Russia's future civilian launch site on home soil, reducing Kazakhstan dependency. Plagued by construction delays and mass corruption arrests. Kim Jong-un visited for arms-for-tech deal.",
    notablePrograms: [
      "Angara launches",
      "Future lunar missions",
      "DPRK partnership site visit",
      "Long-term civilian launch hub",
    ],
  },
  {
    id: "jiuquan",
    name: "Jiuquan Satellite Launch Centre",
    country: "China",
    operatorName: "CNSA / PLA",
    lat: 41.118,
    lon: 100.469,
    launchActivity: "high",
    description:
      "China's oldest and most prolific launch site. All Chinese crewed missions launch here. Tiangong space station assembly support. High launch cadence.",
    notablePrograms: [
      "Shenzhou crewed missions",
      "Tiangong space station support",
      "Long March 2F rockets",
      "Reusable launch vehicle tests",
    ],
  },
  {
    id: "xichang",
    name: "Xichang Satellite Launch Centre",
    country: "China",
    operatorName: "CNSA",
    lat: 28.246,
    lon: 102.026,
    launchActivity: "high",
    description:
      "China's primary GEO and deep-space launch facility. BeiDou GPS constellation launches. Military communications satellites. Chang'e lunar missions.",
    notablePrograms: [
      "BeiDou-3 global GPS constellation",
      "Military comms satellites",
      "Chang'e lunar missions",
      "GEO communications satellites",
    ],
  },
  {
    id: "wenchang",
    name: "Wenchang Space Launch Site",
    country: "China",
    operatorName: "CNSA",
    lat: 19.614,
    lon: 110.951,
    launchActivity: "medium",
    description:
      "China's newest coastal launch facility with near-equatorial advantage. Long March 5 heavy lift. Tianwen-1 Mars mission launched here. Space station modules.",
    notablePrograms: [
      "Long March 5 heavy lift",
      "Tianwen-1 Mars orbiter/rover",
      "Chang'e-5 lunar sample return",
      "Tiangong core module launch",
    ],
  },
  {
    id: "kourou",
    name: "Guiana Space Centre",
    country: "France / ESA",
    operatorName: "ESA / CNES / ArianeGroup",
    lat: 5.236,
    lon: -52.769,
    launchActivity: "medium",
    description:
      "European launch site with near-equatorial advantage. Ariane 6 returning after delays. Strategic launch independence from US and Russia. EU GPS (Galileo) constellation launches.",
    notablePrograms: [
      "Ariane 6 return to flight",
      "Vega-C medium lift",
      "Galileo GPS constellation",
      "ESA science missions",
    ],
  },
  {
    id: "sriharikota",
    name: "Satish Dhawan Space Centre",
    country: "India",
    operatorName: "ISRO",
    lat: 13.733,
    lon: 80.235,
    launchActivity: "medium",
    description:
      "India's primary launch facility. Chandrayaan-3 became first mission to land at Moon's south pole. Gaganyaan crewed mission in development. World's fastest-growing space program.",
    notablePrograms: [
      "Chandrayaan-3 lunar south pole",
      "Gaganyaan crewed mission",
      "PSLV / GSLV rockets",
      "Commercial satellite launches",
    ],
  },
  {
    id: "tanegashima",
    name: "Tanegashima Space Centre",
    country: "Japan",
    operatorName: "JAXA",
    lat: 30.4,
    lon: 130.97,
    launchActivity: "low",
    description:
      "Japan's primary launch facility. H3 rocket development after initial failure. SLIM Moon Sniper precision landing. Deep JAXA-NASA cooperation on Artemis.",
    notablePrograms: [
      "H3 rocket program",
      "SLIM Moon Sniper precision lander",
      "ISS HTV resupply (historical)",
      "JAXA-NASA Artemis cooperation",
    ],
  },
];

const ETAG = makeEtag(DATA);

export default function handler(req: Request): Promise<Response> {
  return serveStatic(req, DATA, ETAG);
}
