export const config = { runtime: 'edge' };

import { makeEtag, serveStatic } from '../../server/_shared/v8-static';

// Source: https://github.com/koala73/worldmonitor/blob/main/src/config/geo-map.ts (NUCLEAR_FACILITIES)
// BIG GAP: upstream has 367 facilities, only 124 are seeded below. To close
// the gap: pull the full array from the URL above and merge new entries,
// following this shape (upstream's id/name/lat/lon/type/status map over
// directly; `description` and `riskLevel` need composing per new entry —
// riskLevel roughly follows: weapons/enrichment sites in nuclear-armed or
// contested states = critical/high, inactive plants = low, active plants = medium).


export interface NuclearSite {
  id: string;
  name: string;
  siteType: "weapons" | "enrichment" | "reprocessing" | "plant";
  country: string;
  operatorName: string | null;
  status: "active" | "inactive" | "contested" | "suspended" | "construction";
  lat: number;
  lon: number;
  description: string | null;
  riskLevel: "critical" | "high" | "medium" | "low";
}

const DATA: NuclearSite[] = [
  // USA — Weapons Labs
  { id: "los_alamos", name: "Los Alamos National Lab", siteType: "weapons", country: "USA", operatorName: "NNSA / Triad", status: "active", lat: 35.88, lon: -106.31, riskLevel: "critical",
    description: "Birthplace of the atomic bomb. Primary US nuclear weapons design laboratory. W80 cruise missile warhead modernization. Plutonium pit production ramping to 30/year." },
  { id: "sandia", name: "Sandia National Laboratories", siteType: "weapons", country: "USA", operatorName: "NNSA / Honeywell", status: "active", lat: 35.04, lon: -106.54, riskLevel: "critical",
    description: "Nuclear weapon engineering and non-nuclear components design. B61-12 gravity bomb program. Stockpile stewardship. Manages 2/3 of nuclear warhead components." },
  { id: "livermore", name: "Lawrence Livermore National Lab", siteType: "weapons", country: "USA", operatorName: "NNSA / LLNS", status: "active", lat: 37.69, lon: -121.7, riskLevel: "critical",
    description: "Co-primary US weapons lab. W87-1 Mod warhead for GBSD. NIF fusion research. First to achieve nuclear fusion ignition in 2022. National security and energy research." },
  { id: "pantex", name: "Pantex Plant", siteType: "weapons", country: "USA", operatorName: "NNSA / CNS", status: "active", lat: 35.24, lon: -101.55, riskLevel: "critical",
    description: "Only US nuclear weapons final assembly and disassembly facility. Manages the entire operational US stockpile. Single point of failure for US nuclear deterrent." },
  // USA — Enrichment & Plants
  { id: "oak_ridge", name: "Oak Ridge (Y-12 / ORNL)", siteType: "enrichment", country: "USA", operatorName: "NNSA / CNS", status: "active", lat: 35.93, lon: -84.31, riskLevel: "high",
    description: "Y-12 National Security Complex: highly enriched uranium storage and processing. Manhattan Project origin. Uranium warhead component production." },
  { id: "hanford", name: "Hanford Site", siteType: "reprocessing", country: "USA", operatorName: "DOE", status: "inactive", lat: 46.55, lon: -119.49, riskLevel: "medium",
    description: "Produced plutonium for WWII and Cold War weapons. Now the most contaminated nuclear site in the US. $677B+ cleanup. Vitrification plant under construction." },
  { id: "palo_verde", name: "Palo Verde Nuclear", siteType: "plant", country: "USA", operatorName: "APS", status: "active", lat: 33.39, lon: -112.86, riskLevel: "low", description: null },
  { id: "south_texas", name: "South Texas Nuclear", siteType: "plant", country: "USA", operatorName: "NRG Energy", status: "active", lat: 28.795, lon: -96.048, riskLevel: "low", description: null },
  { id: "comanche_peak", name: "Comanche Peak", siteType: "plant", country: "USA", operatorName: "Vistra", status: "active", lat: 32.30, lon: -97.79, riskLevel: "low", description: null },
  { id: "vogtle", name: "Vogtle Electric", siteType: "plant", country: "USA", operatorName: "Georgia Power", status: "active", lat: 33.14, lon: -81.76, riskLevel: "low",
    description: "Newest nuclear plant in the US. AP1000 reactor units 3&4 completed 2023-2024 after massive delays. First new US nuclear reactor in 30 years." },
  { id: "mcguire", name: "McGuire Nuclear", siteType: "plant", country: "USA", operatorName: "Duke Energy", status: "active", lat: 35.43, lon: -80.95, riskLevel: "low", description: null },
  { id: "oconee", name: "Oconee Nuclear", siteType: "plant", country: "USA", operatorName: "Duke Energy", status: "active", lat: 34.79, lon: -82.90, riskLevel: "low", description: null },
  { id: "catawba", name: "Catawba Nuclear", siteType: "plant", country: "USA", operatorName: "Duke Energy", status: "active", lat: 35.05, lon: -81.07, riskLevel: "low", description: null },
  { id: "brunswick", name: "Brunswick Nuclear", siteType: "plant", country: "USA", operatorName: "Duke Energy", status: "active", lat: 33.96, lon: -78.01, riskLevel: "low", description: null },
  { id: "calvert_cliffs", name: "Calvert Cliffs", siteType: "plant", country: "USA", operatorName: "Constellation Energy", status: "active", lat: 38.43, lon: -76.44, riskLevel: "low", description: null },
  { id: "salem", name: "Salem / Hope Creek", siteType: "plant", country: "USA", operatorName: "PSEG", status: "active", lat: 39.46, lon: -75.54, riskLevel: "low", description: null },
  { id: "limerick", name: "Limerick Generating", siteType: "plant", country: "USA", operatorName: "Constellation Energy", status: "active", lat: 40.22, lon: -75.59, riskLevel: "low", description: null },
  { id: "peach_bottom", name: "Peach Bottom", siteType: "plant", country: "USA", operatorName: "Constellation Energy", status: "active", lat: 39.76, lon: -76.27, riskLevel: "low", description: null },
  { id: "indian_point", name: "Indian Point (Decommissioned)", siteType: "plant", country: "USA", operatorName: "Holtec International", status: "inactive", lat: 41.27, lon: -73.95, riskLevel: "low", description: null },
  { id: "millstone", name: "Millstone Power Station", siteType: "plant", country: "USA", operatorName: "Dominion Energy", status: "active", lat: 41.31, lon: -72.17, riskLevel: "low", description: null },
  { id: "seabrook", name: "Seabrook Station", siteType: "plant", country: "USA", operatorName: "NextEra Energy", status: "active", lat: 42.90, lon: -70.85, riskLevel: "low", description: null },
  { id: "byron", name: "Byron Nuclear", siteType: "plant", country: "USA", operatorName: "Constellation Energy", status: "active", lat: 42.08, lon: -89.28, riskLevel: "low", description: null },
  { id: "braidwood", name: "Braidwood Station", siteType: "plant", country: "USA", operatorName: "Constellation Energy", status: "active", lat: 41.24, lon: -88.21, riskLevel: "low", description: null },
  { id: "lasalle", name: "LaSalle County Station", siteType: "plant", country: "USA", operatorName: "Constellation Energy", status: "active", lat: 41.24, lon: -88.67, riskLevel: "low", description: null },
  { id: "dresden", name: "Dresden Nuclear", siteType: "plant", country: "USA", operatorName: "Constellation Energy", status: "active", lat: 41.39, lon: -88.27, riskLevel: "low", description: null },
  { id: "quad_cities", name: "Quad Cities Station", siteType: "plant", country: "USA", operatorName: "Constellation Energy", status: "active", lat: 41.73, lon: -90.34, riskLevel: "low", description: null },
  { id: "palisades", name: "Palisades Nuclear", siteType: "plant", country: "USA", operatorName: "Holtec", status: "inactive", lat: 42.32, lon: -86.32, riskLevel: "low",
    description: "Restarting — first US nuclear plant to attempt restart after closure. DOE loan guarantee approved 2023." },
  { id: "dc_cook", name: "D.C. Cook Nuclear", siteType: "plant", country: "USA", operatorName: "Indiana Michigan Power", status: "active", lat: 41.98, lon: -86.56, riskLevel: "low", description: null },
  { id: "davis_besse", name: "Davis-Besse Nuclear", siteType: "plant", country: "USA", operatorName: "Energy Harbor", status: "active", lat: 41.60, lon: -83.09, riskLevel: "low", description: null },
  { id: "beaver_valley", name: "Beaver Valley", siteType: "plant", country: "USA", operatorName: "Energy Harbor", status: "active", lat: 40.62, lon: -80.43, riskLevel: "low", description: null },
  { id: "diablo_canyon", name: "Diablo Canyon", siteType: "plant", country: "USA", operatorName: "PG&E", status: "active", lat: 35.21, lon: -120.85, riskLevel: "low",
    description: "California's last nuclear plant — extended past closure date due to energy crisis. Life extension approved through 2030." },
  { id: "columbia_gen", name: "Columbia Generating Station", siteType: "plant", country: "USA", operatorName: "Energy Northwest", status: "active", lat: 46.47, lon: -119.33, riskLevel: "low", description: null },
  // France
  { id: "gravelines", name: "Gravelines NPP", siteType: "plant", country: "France", operatorName: "EDF", status: "active", lat: 51.01, lon: 2.14, riskLevel: "low", description: null },
  { id: "paluel", name: "Paluel NPP", siteType: "plant", country: "France", operatorName: "EDF", status: "active", lat: 49.86, lon: 0.63, riskLevel: "low", description: null },
  { id: "cattenom", name: "Cattenom NPP", siteType: "plant", country: "France", operatorName: "EDF", status: "active", lat: 49.42, lon: 6.22, riskLevel: "low", description: null },
  { id: "bugey", name: "Bugey NPP", siteType: "plant", country: "France", operatorName: "EDF", status: "active", lat: 45.80, lon: 5.27, riskLevel: "low", description: null },
  { id: "tricastin", name: "Tricastin NPP", siteType: "plant", country: "France", operatorName: "EDF", status: "active", lat: 44.33, lon: 4.73, riskLevel: "low", description: null },
  { id: "cruas", name: "Cruas-Meysse NPP", siteType: "plant", country: "France", operatorName: "EDF", status: "active", lat: 44.63, lon: 4.76, riskLevel: "low", description: null },
  { id: "blayais", name: "Blayais NPP", siteType: "plant", country: "France", operatorName: "EDF", status: "active", lat: 45.26, lon: -0.69, riskLevel: "low", description: null },
  { id: "golfech", name: "Golfech NPP", siteType: "plant", country: "France", operatorName: "EDF", status: "active", lat: 44.11, lon: 0.85, riskLevel: "low", description: null },
  { id: "flamanville", name: "Flamanville EPR", siteType: "plant", country: "France", operatorName: "EDF", status: "active", lat: 49.54, lon: -1.88, riskLevel: "low",
    description: "EPR third-generation reactor — 12 years over schedule and massively over budget. Finally connected to grid 2024. Test case for European nuclear renaissance." },
  { id: "la_hague", name: "La Hague Reprocessing Plant", siteType: "reprocessing", country: "France", operatorName: "Orano", status: "active", lat: 49.68, lon: -1.88, riskLevel: "medium",
    description: "World's largest civilian nuclear reprocessing facility. Processes spent fuel from EU reactors. France derives 70%+ of electricity from nuclear." },
  // UK
  { id: "hinkley_point", name: "Hinkley Point C", siteType: "plant", country: "UK", operatorName: "EDF / CGN", status: "active", lat: 51.21, lon: -3.13, riskLevel: "medium",
    description: "UK's first new nuclear plant in 30 years. Chinese CGN partial ownership created security concerns — UK later excluded Chinese firms from future projects." },
  { id: "sizewell", name: "Sizewell B / C", siteType: "plant", country: "UK", operatorName: "EDF", status: "active", lat: 52.21, lon: 1.62, riskLevel: "low",
    description: "UK's only pressurized water reactor. Sizewell C planned as CGN replacement. UK nuclear expansion program." },
  { id: "heysham", name: "Heysham NPP", siteType: "plant", country: "UK", operatorName: "EDF", status: "active", lat: 54.03, lon: -2.92, riskLevel: "low", description: null },
  { id: "torness", name: "Torness NPP", siteType: "plant", country: "UK", operatorName: "EDF", status: "active", lat: 55.97, lon: -2.41, riskLevel: "low", description: null },
  { id: "sellafield", name: "Sellafield", siteType: "reprocessing", country: "UK", operatorName: "NDA / Sellafield Ltd", status: "active", lat: 54.42, lon: -3.50, riskLevel: "high",
    description: "Described as the world's most hazardous nuclear site. Former weapons plutonium production; now massive radioactive waste storage. £136B decommissioning. IT systems compromised by Russian and Chinese hackers." },
  // Germany
  { id: "neckarwestheim", name: "Neckarwestheim", siteType: "plant", country: "Germany", operatorName: "EnBW", status: "inactive", lat: 49.04, lon: 9.18, riskLevel: "low",
    description: "Last German nuclear plant shut down April 2023. Germany's controversial nuclear exit. Energy crisis and Russia war gas cut created political pressure to reverse." },
  { id: "isar", name: "Isar 2", siteType: "plant", country: "Germany", operatorName: "PreussenElektra", status: "inactive", lat: 48.61, lon: 12.29, riskLevel: "low", description: null },
  { id: "emsland", name: "Emsland NPP", siteType: "plant", country: "Germany", operatorName: "RWE", status: "inactive", lat: 52.47, lon: 7.32, riskLevel: "low", description: null },
  // Russia
  { id: "sarov", name: "Sarov (Arzamas-16)", siteType: "weapons", country: "Russia", operatorName: "RFNC-VNIIEF / Rosatom", status: "active", lat: 54.93, lon: 43.32, riskLevel: "critical",
    description: "Russia's primary nuclear weapons design facility. Soviet-era closed city. Russian Los Alamos. Developing hypersonic warheads and new nuclear delivery systems." },
  { id: "mayak", name: "Mayak Production Association", siteType: "reprocessing", country: "Russia", operatorName: "Rosatom", status: "active", lat: 55.71, lon: 60.80, riskLevel: "high",
    description: "Russia's primary plutonium production and reprocessing site. Site of 1957 Kyshtym disaster — second worst nuclear accident in history. Tritium production for warheads." },
  { id: "kursk_npp", name: "Kursk NPP", siteType: "plant", country: "Russia", operatorName: "Rosenergoatom", status: "active", lat: 51.67, lon: 35.61, riskLevel: "high",
    description: "RBMK-1000 reactors same design as Chernobyl. Near Ukraine war frontline. Ukrainian drone attacks have targeted vicinity. New Kursk II plant under construction." },
  { id: "novovoronezh", name: "Novovoronezh NPP", siteType: "plant", country: "Russia", operatorName: "Rosenergoatom", status: "active", lat: 51.27, lon: 39.22, riskLevel: "medium", description: null },
  { id: "leningrad_npp", name: "Leningrad NPP", siteType: "plant", country: "Russia", operatorName: "Rosenergoatom", status: "active", lat: 59.83, lon: 29.03, riskLevel: "medium", description: null },
  { id: "kalinin_npp", name: "Kalinin NPP", siteType: "plant", country: "Russia", operatorName: "Rosenergoatom", status: "active", lat: 57.79, lon: 35.06, riskLevel: "low", description: null },
  { id: "balakovo", name: "Balakovo NPP", siteType: "plant", country: "Russia", operatorName: "Rosenergoatom", status: "active", lat: 52.09, lon: 47.95, riskLevel: "low", description: null },
  { id: "rostov_npp", name: "Rostov NPP", siteType: "plant", country: "Russia", operatorName: "Rosenergoatom", status: "active", lat: 47.25, lon: 42.10, riskLevel: "low", description: null },
  { id: "kola_npp", name: "Kola NPP", siteType: "plant", country: "Russia", operatorName: "Rosenergoatom", status: "active", lat: 67.46, lon: 32.47, riskLevel: "medium",
    description: "Arctic nuclear plant. RBMK reactors. Russia's oldest operating nuclear plant. Close to NATO territory (Norway/Finland border)." },
  // Ukraine
  { id: "zaporizhzhia", name: "Zaporizhzhia NPP", siteType: "plant", country: "Ukraine", operatorName: "Energoatom (occupied by Russia)", status: "contested", lat: 47.51, lon: 34.58, riskLevel: "critical",
    description: "Europe's largest nuclear power plant — occupied by Russian forces since March 2022. Repeated shelling of facility. External power loss incidents. IAEA permanent mission monitoring. Nuclear accident risk." },
  { id: "rivne_npp", name: "Rivne NPP", siteType: "plant", country: "Ukraine", operatorName: "Energoatom", status: "active", lat: 51.33, lon: 25.88, riskLevel: "medium", description: null },
  { id: "south_ukraine_npp", name: "South Ukraine NPP", siteType: "plant", country: "Ukraine", operatorName: "Energoatom", status: "active", lat: 47.81, lon: 31.22, riskLevel: "medium", description: null },
  { id: "khmelnytskyi_npp", name: "Khmelnytskyi NPP", siteType: "plant", country: "Ukraine", operatorName: "Energoatom", status: "active", lat: 50.30, lon: 26.65, riskLevel: "medium", description: null },
  { id: "chernobyl", name: "Chernobyl Exclusion Zone", siteType: "plant", country: "Ukraine", operatorName: "SNRIU / IAEA", status: "inactive", lat: 51.39, lon: 30.10, riskLevel: "high",
    description: "Site of world's worst nuclear accident (April 26, 1986). New Safe Confinement structure completed 2016. Russian troops briefly occupied March 2022, disturbing radioactive soil. Tourism destination." },
  // China
  { id: "jilantai", name: "Jilantai / PLARF Complex", siteType: "weapons", country: "China", operatorName: "PLA Rocket Force", status: "active", lat: 39.2, lon: 105.7, riskLevel: "critical",
    description: "Satellite imagery confirms rapid arsenal expansion. DF-41 ICBM warhead production. Pentagon: arsenal growing from 500 to 1,500+ warheads by 2035." },
  { id: "daya_bay", name: "Daya Bay NPP", siteType: "plant", country: "China", operatorName: "CGN", status: "active", lat: 22.60, lon: 114.54, riskLevel: "medium",
    description: "Adjacent to Hong Kong (50km). French-built PWR. Power exported to HK. US and French uranium fuel. CGN placed on US Entity List for alleged military use." },
  { id: "taishan", name: "Taishan NPP (EPR)", siteType: "plant", country: "China", operatorName: "TNPJVC / EDF", status: "active", lat: 21.91, lon: 112.98, riskLevel: "medium",
    description: "World's first EPR reactor to operate. 2021 fuel rod damage caused brief international concern — US NRC briefed. EDF and China dispute over operating procedures." },
  { id: "yangjiang", name: "Yangjiang NPP", siteType: "plant", country: "China", operatorName: "CGN", status: "active", lat: 21.71, lon: 112.26, riskLevel: "low", description: null },
  { id: "hongyanhe", name: "Hongyanhe NPP", siteType: "plant", country: "China", operatorName: "CGN", status: "active", lat: 39.79, lon: 121.48, riskLevel: "low", description: null },
  { id: "tianwan", name: "Tianwan NPP", siteType: "plant", country: "China", operatorName: "JNPC / Rosatom", status: "active", lat: 34.69, lon: 119.46, riskLevel: "low",
    description: "Russian-built VVER reactors. Joint China-Russia nuclear cooperation. Rosatom's largest overseas project." },
  { id: "fuqing", name: "Fuqing NPP (Hualong)", siteType: "plant", country: "China", operatorName: "CNNC", status: "active", lat: 25.44, lon: 119.44, riskLevel: "low",
    description: "First deployment of China's indigenous Hualong One reactor. China's export reactor design for Belt and Road countries." },
  { id: "fangjiashan", name: "Fangjiashan NPP", siteType: "plant", country: "China", operatorName: "CNNC", status: "active", lat: 30.44, lon: 120.96, riskLevel: "low", description: null },
  { id: "sanmen", name: "Sanmen AP1000", siteType: "plant", country: "China", operatorName: "SNPTC", status: "active", lat: 29.10, lon: 121.41, riskLevel: "low",
    description: "World's first AP1000 passive safety reactor. Westinghouse-designed. Significant for US nuclear technology export legacy." },
  // Japan
  { id: "kashiwazaki", name: "Kashiwazaki-Kariwa NPP", siteType: "plant", country: "Japan", operatorName: "TEPCO", status: "inactive", lat: 37.43, lon: 138.60, riskLevel: "medium",
    description: "World's largest nuclear plant by capacity. Shut since 2011 Fukushima. Restart repeatedly delayed by safety issues and regulatory concerns. Key to Japan's energy future." },
  { id: "hamaoka", name: "Hamaoka NPP", siteType: "plant", country: "Japan", operatorName: "Chubu Electric", status: "inactive", lat: 34.62, lon: 138.14, riskLevel: "low", description: null },
  { id: "takahama", name: "Takahama NPP", siteType: "plant", country: "Japan", operatorName: "Kansai Electric", status: "active", lat: 35.52, lon: 135.51, riskLevel: "low", description: null },
  { id: "ohi", name: "Ōi NPP", siteType: "plant", country: "Japan", operatorName: "Kansai Electric", status: "active", lat: 35.54, lon: 135.66, riskLevel: "low", description: null },
  { id: "sendai_npp", name: "Sendai NPP", siteType: "plant", country: "Japan", operatorName: "Kyushu Electric", status: "active", lat: 31.83, lon: 130.19, riskLevel: "low", description: null },
  { id: "ikata", name: "Ikata NPP", siteType: "plant", country: "Japan", operatorName: "Shikoku Electric", status: "active", lat: 33.49, lon: 132.31, riskLevel: "low", description: null },
  { id: "rokkasho", name: "Rokkasho Reprocessing Plant", siteType: "enrichment", country: "Japan", operatorName: "JNFL", status: "active", lat: 40.96, lon: 141.33, riskLevel: "high",
    description: "Japan's uranium enrichment and plutonium reprocessing facility. 30 years and $30B+ over budget. Creates plutonium stockpile. North Korea watches closely — breakout concern." },
  // South Korea
  { id: "kori", name: "Kori Nuclear Complex", siteType: "plant", country: "South Korea", operatorName: "KHNP", status: "active", lat: 35.32, lon: 129.29, riskLevel: "low",
    description: "South Korea's oldest and largest nuclear complex. 6 reactors. KHNP now exports APR-1400 reactors to UAE (Barakah). Major nuclear power exporter." },
  { id: "hanbit", name: "Hanbit Nuclear Complex", siteType: "plant", country: "South Korea", operatorName: "KHNP", status: "active", lat: 35.41, lon: 126.42, riskLevel: "low", description: null },
  { id: "hanul", name: "Hanul Nuclear Complex", siteType: "plant", country: "South Korea", operatorName: "KHNP", status: "active", lat: 37.09, lon: 129.38, riskLevel: "low", description: null },
  { id: "wolsong", name: "Wolsong Nuclear Complex", siteType: "plant", country: "South Korea", operatorName: "KHNP", status: "active", lat: 35.71, lon: 129.47, riskLevel: "low", description: null },
  // India
  { id: "tarapur", name: "Tarapur Atomic Power Station", siteType: "plant", country: "India", operatorName: "NPCIL", status: "active", lat: 19.83, lon: 72.65, riskLevel: "low", description: null },
  { id: "kudankulam", name: "Kudankulam NPP", siteType: "plant", country: "India", operatorName: "NPCIL / Rosatom", status: "active", lat: 8.17, lon: 77.71, riskLevel: "low",
    description: "Russian-built VVER reactor. India-Russia nuclear cooperation. Expanding to 6 units. Protestors cited tsunami Fukushima risk at Indian Ocean coast location." },
  { id: "kakrapar", name: "Kakrapar Atomic Power Station", siteType: "plant", country: "India", operatorName: "NPCIL", status: "active", lat: 21.24, lon: 73.35, riskLevel: "low", description: null },
  { id: "rawatbhata", name: "Rajasthan Atomic Power Station", siteType: "plant", country: "India", operatorName: "NPCIL", status: "active", lat: 24.88, lon: 75.59, riskLevel: "low", description: null },
  // Canada
  { id: "bruce", name: "Bruce Nuclear Generating Station", siteType: "plant", country: "Canada", operatorName: "Bruce Power", status: "active", lat: 44.33, lon: -81.60, riskLevel: "low",
    description: "World's largest operating nuclear power station by installed capacity. CANDU reactors. Major refurbishment underway for 30-year life extension." },
  { id: "darlington", name: "Darlington Nuclear", siteType: "plant", country: "Canada", operatorName: "OPG", status: "active", lat: 43.87, lon: -78.72, riskLevel: "low",
    description: "Canada's newest nuclear plant. Major refurbishment project underway. SMR (Small Modular Reactor) deployment planned at site." },
  { id: "pickering", name: "Pickering Nuclear", siteType: "plant", country: "Canada", operatorName: "OPG", status: "active", lat: 43.81, lon: -79.07, riskLevel: "low", description: null },
  // Europe (Various)
  { id: "paks", name: "Paks NPP", siteType: "plant", country: "Hungary", operatorName: "MVM Paks", status: "active", lat: 46.57, lon: 18.86, riskLevel: "medium",
    description: "Hungary's only nuclear plant. Provides ~45% of Hungarian electricity. Paks II expansion contracted to Rosatom — controversial within EU amid Ukraine war." },
  { id: "temelin", name: "Temelín NPP", siteType: "plant", country: "Czech Republic", operatorName: "CEZ", status: "active", lat: 49.18, lon: 14.38, riskLevel: "low", description: null },
  { id: "dukovany", name: "Dukovany NPP", siteType: "plant", country: "Czech Republic", operatorName: "CEZ", status: "active", lat: 49.09, lon: 16.15, riskLevel: "low",
    description: "Czech Republic expanding nuclear. KHNP (South Korean) selected for new units at Dukovany and Temelín over EDF and Westinghouse in 2024." },
  { id: "mochovce", name: "Mochovce NPP", siteType: "plant", country: "Slovakia", operatorName: "Slovenské elektrárne", status: "active", lat: 48.28, lon: 18.44, riskLevel: "low", description: null },
  { id: "kozloduy", name: "Kozloduy NPP", siteType: "plant", country: "Bulgaria", operatorName: "CEZ Bulgaria", status: "active", lat: 43.75, lon: 23.63, riskLevel: "low",
    description: "Bulgaria's only nuclear plant. Soviet VVER design. New units planned. Bulgaria resisting Russian pressure to use Rosatom for expansion amid EU criticism." },
  { id: "cernavoda", name: "Cernavodă NPP", siteType: "plant", country: "Romania", operatorName: "Nuclearelectrica", status: "active", lat: 44.32, lon: 28.05, riskLevel: "low",
    description: "CANDU design. Canada-Romania nuclear cooperation. New units planned with US cooperation — NATO ally choosing US over China (CGN) despite CGN bid." },
  { id: "ringhals", name: "Ringhals NPP", siteType: "plant", country: "Sweden", operatorName: "Vattenfall", status: "active", lat: 57.26, lon: 12.11, riskLevel: "low", description: null },
  { id: "forsmark", name: "Forsmark NPP", siteType: "plant", country: "Sweden", operatorName: "Vattenfall", status: "active", lat: 60.41, lon: 18.17, riskLevel: "low", description: null },
  { id: "oskarshamn", name: "Oskarshamn NPP", siteType: "plant", country: "Sweden", operatorName: "OKG AB", status: "active", lat: 57.42, lon: 16.67, riskLevel: "low", description: null },
  { id: "olkiluoto", name: "Olkiluoto 3 EPR", siteType: "plant", country: "Finland", operatorName: "TVO", status: "active", lat: 61.24, lon: 21.44, riskLevel: "low",
    description: "Europe's newest nuclear reactor (EPR). 14 years over schedule. $12B over budget. Finally at full commercial operation 2023. Test case for European nuclear revival." },
  { id: "loviisa", name: "Loviisa NPP", siteType: "plant", country: "Finland", operatorName: "Fortum", status: "active", lat: 60.37, lon: 26.35, riskLevel: "low", description: null },
  { id: "borssele", name: "Borssele NPP", siteType: "plant", country: "Netherlands", operatorName: "EPZ", status: "active", lat: 51.43, lon: 3.72, riskLevel: "low",
    description: "Netherlands' only nuclear plant. Life extended to 2033. New nuclear program announced — government targeting 2 new large plants by 2035." },
  { id: "doel", name: "Doel NPP", siteType: "plant", country: "Belgium", operatorName: "Engie Electrabel", status: "active", lat: 51.33, lon: 4.26, riskLevel: "low",
    description: "Belgium's nuclear plants extended despite political opposition. Doel 4 and Tihange 3 extended 10 years to 2035 after energy crisis." },
  { id: "tihange", name: "Tihange NPP", siteType: "plant", country: "Belgium", operatorName: "Engie Electrabel", status: "active", lat: 50.53, lon: 5.27, riskLevel: "low", description: null },
  { id: "almaraz", name: "Almaraz NPP", siteType: "plant", country: "Spain", operatorName: "Iberdrola / Endesa / Naturgy", status: "active", lat: 39.81, lon: -5.70, riskLevel: "low", description: null },
  { id: "cofrentes", name: "Cofrentes NPP", siteType: "plant", country: "Spain", operatorName: "Iberdrola", status: "active", lat: 39.21, lon: -1.05, riskLevel: "low", description: null },
  { id: "asco", name: "Ascó NPP", siteType: "plant", country: "Spain", operatorName: "Endesa", status: "active", lat: 41.20, lon: 0.57, riskLevel: "low", description: null },
  { id: "vandellos", name: "Vandellòs II NPP", siteType: "plant", country: "Spain", operatorName: "Endesa", status: "active", lat: 40.95, lon: 0.87, riskLevel: "low", description: null },
  { id: "trillo", name: "Trillo NPP", siteType: "plant", country: "Spain", operatorName: "Iberdrola / Endesa", status: "active", lat: 40.70, lon: -2.62, riskLevel: "low", description: null },
  { id: "krsko", name: "Krško NPP", siteType: "plant", country: "Slovenia", operatorName: "NEK", status: "active", lat: 45.94, lon: 15.52, riskLevel: "low",
    description: "Shared Croatia-Slovenia plant. Seismically active zone. New Krško II unit planned. Slovenia debating nuclear expansion for climate goals." },
  // Global — Strategic
  { id: "koeberg", name: "Koeberg NPP", siteType: "plant", country: "South Africa", operatorName: "Eskom", status: "active", lat: -33.68, lon: 18.43, riskLevel: "medium",
    description: "Africa's only nuclear power plant. French-built KOEBERG. 40-year life extension approved. South Africa's nuclear weapons program dismantled 1989 — only country to do so voluntarily." },
  { id: "atucha", name: "Atucha NPP", siteType: "plant", country: "Argentina", operatorName: "NASA", status: "active", lat: -33.97, lon: -59.21, riskLevel: "low", description: null },
  { id: "embalse", name: "Embalse NPP", siteType: "plant", country: "Argentina", operatorName: "NASA", status: "active", lat: -32.23, lon: -64.47, riskLevel: "low", description: null },
  { id: "angra", name: "Angra dos Reis NPP", siteType: "plant", country: "Brazil", operatorName: "Eletronuclear", status: "active", lat: -23.01, lon: -44.46, riskLevel: "low",
    description: "Brazil's nuclear complex. Angra 3 under construction since 1984. US-Brazil nuclear cooperation. Brazil has domestic uranium enrichment capability." },
  { id: "laguna_verde", name: "Laguna Verde NPP", siteType: "plant", country: "Mexico", operatorName: "CFE", status: "active", lat: 19.72, lon: -96.41, riskLevel: "low", description: null },
  { id: "barakah", name: "Barakah Nuclear Energy Plant", siteType: "plant", country: "UAE", operatorName: "ENEC / KEPCO", status: "active", lat: 23.95, lon: 52.19, riskLevel: "medium",
    description: "Arab world's first nuclear power plant. South Korean APR-1400. 4 units — all operational 2024. UAE's energy independence move. Saudi Arabia watching as model." },
  { id: "bushehr", name: "Bushehr NPP", siteType: "plant", country: "Iran", operatorName: "AEOI / Rosatom", status: "active", lat: 28.83, lon: 50.89, riskLevel: "high",
    description: "Iran's only nuclear power plant. Russian-built VVER-1000. Subject to IAEA safeguards. Partially damaged in Israeli strikes on Iranian nuclear infrastructure." },
  { id: "natanz", name: "Natanz Enrichment Facility", siteType: "enrichment", country: "Iran", operatorName: "AEOI", status: "active", lat: 33.72, lon: 51.73, riskLevel: "critical",
    description: "Iran's main uranium enrichment complex. Enriching to 60%. Subject to Stuxnet attack 2010. Multiple Israeli sabotage incidents. Primary target in US-Israeli strike planning." },
  { id: "fordow", name: "Fordow Fuel Enrichment Plant", siteType: "enrichment", country: "Iran", operatorName: "AEOI", status: "active", lat: 34.88, lon: 51.0, riskLevel: "critical",
    description: "Built 80m underground in a mountain. Revealed by Iranian opposition 2009. Enriching near weapons-grade. Hardened against all but bunker-buster munitions." },
  { id: "yongbyon", name: "Yongbyon Nuclear Complex", siteType: "weapons", country: "North Korea", operatorName: "DPRK GBAE", status: "active", lat: 39.8, lon: 125.75, riskLevel: "critical",
    description: "DPRK's primary nuclear weapons production facility. 5MW reactor restarted. Uranium enrichment expanding. Satellite imagery confirms accelerated construction." },
  { id: "dimona", name: "Negev Nuclear Research Centre", siteType: "weapons", country: "Israel", operatorName: "Israel Atomic Energy Commission", status: "active", lat: 31.0, lon: 35.15, riskLevel: "critical",
    description: "Israel's undeclared nuclear facility. Estimated 80–400 warheads. Nuclear ambiguity policy. Never inspected by IAEA. Vanunu whistleblower imprisoned 18 years." },
  { id: "pakistan_kahuta", name: "Khan Research Laboratories", siteType: "enrichment", country: "Pakistan", operatorName: "PAEC / KRL", status: "active", lat: 33.59, lon: 73.40, riskLevel: "critical",
    description: "Pakistan's uranium enrichment and weapons design facility. A.Q. Khan proliferation network. Sold designs to Libya, Iran, North Korea. Fastest-growing nuclear arsenal." },
  { id: "pakistan_khushab", name: "Khushab Nuclear Complex", siteType: "weapons", country: "Pakistan", operatorName: "PAEC", status: "active", lat: 32.02, lon: 72.22, riskLevel: "critical",
    description: "Pakistan's plutonium production complex. Heavy water reactors. 4 reactors operational. Produces weapons-grade plutonium. India watches closely for doctrine change." },
];

const ETAG = makeEtag(DATA);

export default function handler(req: Request): Promise<Response> {
  return serveStatic(req, DATA, ETAG);
}
