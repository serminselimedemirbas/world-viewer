export const config = { runtime: 'edge' };

import { makeEtag, serveStatic } from '../../server/_shared/v8-static';

// Source: https://github.com/koala73/worldmonitor/blob/main/shared/military-bases-data.ts
// BIG GAP: upstream has 208 bases, only 41 are seeded below. To close the gap:
// pull the full array from the URL above and merge new entries into DATA,
// following this shape (upstream's raw fields map closely — id/name/lat/lon/
// type/country map over directly; `description` needs writing per new entry
// to match this dataset's style, upstream doesn't carry one).


export interface MilitaryBase {
  id: string;
  name: string;
  lat: number;
  lon: number;
  baseType: "naval" | "air_force" | "army" | "space" | "strategic";
  nation: string;
  description: string;
}

const DATA: MilitaryBase[] = [
  { id: "norfolk_naval", name: "Norfolk Naval Station", lat: 36.94, lon: -76.29, baseType: "naval", nation: "USA",
    description: "World's largest naval station. Atlantic Fleet HQ. Home to 75+ ships and 130+ aircraft. Command hub for US East Coast operations." },
  { id: "kitsap_naval", name: "Naval Base Kitsap", lat: 47.55, lon: -122.63, baseType: "naval", nation: "USA",
    description: "Pacific deterrent hub. Home to Ohio-class Trident ballistic missile submarines. West Coast nuclear deterrence anchor." },
  { id: "kings_bay", name: "Kings Bay Submarine Base", lat: 30.8, lon: -81.56, baseType: "naval", nation: "USA",
    description: "East Coast Trident submarine base. Ohio-class SSBN home port. Part of US nuclear triad. Constant patrols maintain second-strike capability." },
  { id: "san_diego_naval", name: "Naval Base San Diego", lat: 32.68, lon: -117.13, baseType: "naval", nation: "USA",
    description: "Largest Navy base on the US West Coast. Home to the Pacific Fleet surface combatants. Major deployment hub for Indo-Pacific operations." },
  { id: "nellis_afb", name: "Nellis Air Force Base", lat: 36.24, lon: -115.03, baseType: "air_force", nation: "USA",
    description: "USAF's premier air combat training center. Red Flag exercises. F-35 and advanced systems testing. Area 51 / Nevada Test Site proximity." },
  { id: "barksdale_afb", name: "Barksdale Air Force Base", lat: 32.5, lon: -93.66, baseType: "strategic", nation: "USA",
    description: "Home of 8th Air Force / Global Strike Command. B-52 Stratofortress bombers. Nuclear deterrence operations. Long-range strike planning." },
  { id: "whiteman_afb", name: "Whiteman Air Force Base", lat: 38.72, lon: -93.55, baseType: "strategic", nation: "USA",
    description: "Home of the B-2 Spirit stealth bomber fleet. Only B-2 base in the world. Can strike anywhere on Earth within hours. Nuclear-capable." },
  { id: "dyess_afb", name: "Dyess Air Force Base", lat: 32.42, lon: -99.85, baseType: "strategic", nation: "USA",
    description: "Home of B-1B Lancer bombers and C-130 airlift. First Air Force base to host the B-21 Raider stealth bomber in transition." },
  { id: "cheyenne_mountain", name: "Cheyenne Mountain Complex", lat: 38.74, lon: -104.85, baseType: "space", nation: "USA",
    description: "NORAD / USNORTHCOM underground command. Designed to survive nuclear attack. Missile warning, space surveillance, air defense. Hardened 2,000 feet underground." },
  { id: "peterson_sfb", name: "Peterson Space Force Base", lat: 38.82, lon: -104.72, baseType: "space", nation: "USA",
    description: "US Space Command headquarters. Space defense operations. Satellite surveillance. Collocated with NORAD. Space domain awareness mission." },
  { id: "schriever_sfb", name: "Schriever Space Force Base", lat: 38.8, lon: -104.53, baseType: "space", nation: "USA",
    description: "GPS satellite constellation operations. Space control. Satellite command and control. Over 6 squadrons operating national security space assets." },
  { id: "fort_liberty", name: "Fort Liberty (Bragg)", lat: 35.14, lon: -79.0, baseType: "army", nation: "USA",
    description: "Largest US Army base. Home of the 82nd Airborne Division (rapid deployment) and US Army Special Operations Command. Global rapid response force." },
  { id: "camp_pendleton", name: "Camp Pendleton", lat: 33.37, lon: -117.5, baseType: "army", nation: "USA",
    description: "Largest US Marine Corps base on the West Coast. 1st Marine Division. Amphibious assault training. Pacific power projection." },
  { id: "yokosuka", name: "Fleet Activities Yokosuka", lat: 35.29, lon: 139.67, baseType: "naval", nation: "USA",
    description: "US 7th Fleet headquarters. Largest US naval base in the Western Pacific. Home of USS Ronald Reagan carrier strike group. Key to Indo-Pacific deterrence." },
  { id: "kadena_ab", name: "Kadena Air Base", lat: 26.35, lon: 127.77, baseType: "air_force", nation: "USA",
    description: "Largest US Air Force base in Asia. F-15 Eagles. Key to Taiwan Strait contingency. Air superiority over Western Pacific. Okinawa, Japan." },
  { id: "camp_humphreys", name: "Camp Humphreys (USAG-H)", lat: 36.97, lon: 127.03, baseType: "army", nation: "USA",
    description: "Largest US overseas military base. US Forces Korea headquarters. 28,000 US personnel. Primary deterrent to DPRK aggression." },
  { id: "ramstein_ab", name: "Ramstein Air Base", lat: 49.44, lon: 7.6, baseType: "air_force", nation: "USA",
    description: "USAF HQ in Europe and Africa. EUCOM air operations. Ukraine war support logistics hub. NATO's largest air base in Europe." },
  { id: "aviano_ab", name: "Aviano Air Base", lat: 46.03, lon: 12.6, baseType: "air_force", nation: "USA",
    description: "NATO air base in northern Italy. F-16 Fighting Falcons. Dual-capable aircraft (nuclear-certified). Southern Europe / Mediterranean operations." },
  { id: "incirlik_ab", name: "Incirlik Air Base", lat: 37.0, lon: 35.43, baseType: "air_force", nation: "USA",
    description: "US/NATO air base in southern Turkey. Stores approximately 50 B61 nuclear gravity bombs under NATO sharing arrangement. Middle East strike range." },
  { id: "diego_garcia", name: "Diego Garcia (BIOT)", lat: -7.31, lon: 72.41, baseType: "naval", nation: "USA",
    description: "Remote Indian Ocean atoll base. B-2 and B-52 forward staging. Nuclear submarine support. Equidistant strike range to Middle East, South Asia, and East Africa." },
  { id: "al_udeid", name: "Al Udeid Air Base", lat: 25.12, lon: 51.32, baseType: "air_force", nation: "USA",
    description: "USAF's largest base in Middle East. CENTCOM Forward HQ. Over 10,000 personnel. Manages air operations across Iraq, Syria, Afghanistan. Qatar." },
  { id: "nsa_bahrain", name: "NSA Bahrain (5th Fleet)", lat: 26.19, lon: 50.55, baseType: "naval", nation: "USA",
    description: "US 5th Fleet headquarters. Manages Persian Gulf, Red Sea, Arabian Sea operations. Central to Hormuz contingency planning." },
  { id: "guam_andersen", name: "Andersen Air Force Base", lat: 13.58, lon: 144.93, baseType: "air_force", nation: "USA",
    description: "Westernmost US military base in Pacific. B-52, B-1, B-2 forward deployments. First responder to Taiwan or Korean contingency. Growing Chinese ASAT/missile threat." },
  { id: "raf_mildenhall", name: "RAF Mildenhall", lat: 52.36, lon: 0.49, baseType: "air_force", nation: "USA",
    description: "US Air Force base in UK. KC-135 aerial refueling. Special Operations Command Europe. Intelligence, surveillance, and reconnaissance operations." },
  { id: "rota_naval", name: "Naval Station Rota", lat: 36.65, lon: -6.36, baseType: "naval", nation: "USA",
    description: "US Navy base in southern Spain. Aegis BMD destroyers forward deployed. NATO southern flank. Mediterranean and Atlantic chokepoint control." },
  { id: "sigonella", name: "NAS Sigonella", lat: 37.42, lon: 14.92, baseType: "naval", nation: "USA",
    description: "US/NATO hub in Sicily. P-8 Poseidon maritime patrol. Mediterranean ISR. Drone operations. Key node for Libya and Middle East surveillance." },
  { id: "guantanamo", name: "Naval Station Guantanamo Bay", lat: 19.9, lon: -75.1, baseType: "naval", nation: "USA",
    description: "Oldest US overseas base. Detention facility for terror suspects. Strategic location monitoring Caribbean and Atlantic. Political controversy ongoing." },
  { id: "severomorsk", name: "Severomorsk (Northern Fleet HQ)", lat: 69.07, lon: 33.42, baseType: "naval", nation: "Russia",
    description: "Russia's most powerful fleet HQ. Arctic operations. Delta IV and Borei SSBN submarines. Nuclear-armed cruise missiles. NATO's primary surveillance target." },
  { id: "vladivostok_fleet", name: "Vladivostok (Pacific Fleet)", lat: 43.08, lon: 131.88, baseType: "naval", nation: "Russia",
    description: "Russia's Pacific Fleet headquarters. Oscar-class SSGNs. Monitoring Japan, South Korea, and US Pacific assets. Kilo-class submarines active." },
  { id: "sevastopol", name: "Sevastopol Naval Base", lat: 44.62, lon: 33.52, baseType: "naval", nation: "Russia",
    description: "Former Black Sea Fleet HQ in occupied Crimea. Under continuous Ukrainian drone and missile attack since 2022. Multiple warships sunk or damaged." },
  { id: "kaliningrad_base", name: "Kaliningrad Military District", lat: 54.72, lon: 20.5, baseType: "strategic", nation: "Russia",
    description: "Russia's NATO-encircled exclave. Baltic Fleet. Iskander-M ballistic missiles (nuclear-capable). S-400 air defense. EU's most concerning Russian military enclave." },
  { id: "hmeimim_ab", name: "Hmeimim Air Base", lat: 35.4, lon: 35.95, baseType: "air_force", nation: "Russia",
    description: "Russia's Syria air base since 2015. Su-35, Su-34 deployed. Mediterranean power projection. Enables Russian presence in Middle East and North Africa." },
  { id: "tartus_port", name: "Tartus Naval Base", lat: 34.9, lon: 35.87, baseType: "naval", nation: "Russia",
    description: "Russia's only Mediterranean naval base. Resupply point for Russian warships. Enables Black Sea Fleet to project into Mediterranean without Bosphorus transit." },
  { id: "hainan_naval", name: "Yulin Naval Base (Hainan)", lat: 18.24, lon: 109.51, baseType: "naval", nation: "China",
    description: "China's Type 094 Jin-class SSBN home base. Underground submarine pens. South China Sea primary naval hub. South Sea Fleet headquarters." },
  { id: "fiery_cross", name: "Fiery Cross Reef", lat: 9.55, lon: 112.89, baseType: "air_force", nation: "China",
    description: "Largest of China's South China Sea artificial islands. 3,000m runway. J-10 fighters, HQ-9 SAMs, YJ-12 anti-ship missiles. UNCLOS violation." },
  { id: "mischief_reef", name: "Mischief Reef", lat: 9.9, lon: 115.53, baseType: "naval", nation: "China",
    description: "Chinese-built island disputed by Philippines. Naval facilities, radar, missile launchers. Within 250km of Philippine coast. SCS territorial expansion." },
  { id: "djibouti_pla", name: "PLA Base Djibouti", lat: 11.52, lon: 43.07, baseType: "naval", nation: "China",
    description: "China's first overseas military base. Horn of Africa strategic position. Logistics hub for PLAN. Adjacent to US Camp Lemonnier. Surveillance concern." },
  { id: "shape_belgium", name: "SHAPE (NATO HQ)", lat: 50.44, lon: 4.38, baseType: "army", nation: "NATO",
    description: "Supreme Headquarters Allied Powers Europe. NATO's military command HQ since 1949. Coordinates defense of 32 member states. Article 5 operations planning." },
  { id: "grafenwohr", name: "Grafenwöhr Training Area", lat: 49.7, lon: 11.94, baseType: "army", nation: "NATO",
    description: "Europe's largest US Army training base. 7th Army Training Command. Abrams tanks and Bradley IFVs. Ukraine war has dramatically increased NATO readiness training." },
  { id: "sohae_launch", name: "Sohae Satellite Launch Station", lat: 39.66, lon: 124.71, baseType: "strategic", nation: "North Korea",
    description: "DPRK's primary space and ICBM launch site. Hwasong-17/18 ICBM tests. Satellite launches. Constantly monitored by NRO and JAXA satellites." },
  { id: "isfahan_air", name: "Isfahan Air Defense Complex", lat: 32.67, lon: 51.69, baseType: "air_force", nation: "Iran",
    description: "Key IRGC Air Force hub. Near Natanz enrichment site. Air defense systems. Israeli strikes in April 2024 targeted radar here. Central Iran defense node." },
];

const ETAG = makeEtag(DATA);

export default function handler(req: Request): Promise<Response> {
  return serveStatic(req, DATA, ETAG);
}
