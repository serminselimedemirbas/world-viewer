export const config = { runtime: 'edge' };

import { makeEtag, serveStatic } from '../../server/_shared/v8-static';

// Source: https://github.com/koala73/worldmonitor/blob/main/src/config/geo-map.ts (ECONOMIC_CENTERS)
// Close to upstream (40 here vs 41 upstream) — the only structural difference is
// that upstream lists BSE and NSE (India) as two separate exchanges while this
// combines them into one "bse" entry. Nothing else to pull in for now.


export interface EconomicHub {
  id: string;
  name: string;
  hubType: "exchange" | "central_bank" | "financial_hub";
  city: string;
  country: string;
  region: string;
  lat: number;
  lon: number;
  description: string;
  metric: string;
  keyIndicators: string[];
}

const DATA: EconomicHub[] = [
  {
    id: "nyse", name: "NYSE", hubType: "exchange", city: "New York", country: "USA", region: "Americas",
    lat: 40.707, lon: -74.011,
    description: "World's largest stock exchange by market cap. Home to most S&P 500 blue chips. Primary bellwether for global equity markets.",
    metric: "$25T+ market cap",
    keyIndicators: ["S&P 500", "Dow Jones Industrial", "VIX Fear Index", "Fed rate sensitivity"],
  },
  {
    id: "nasdaq", name: "NASDAQ", hubType: "exchange", city: "New York", country: "USA", region: "Americas",
    lat: 40.757, lon: -73.987,
    description: "Tech-heavy exchange. Home to Apple, Microsoft, NVIDIA, Meta. Primary valuation metric for AI and tech sector globally.",
    metric: "$21T+ market cap",
    keyIndicators: ["NASDAQ Composite", "Magnificent 7 stocks", "AI sector valuations", "Tech sector sentiment"],
  },
  {
    id: "federal_reserve", name: "Federal Reserve", hubType: "central_bank", city: "Washington DC", country: "USA", region: "Americas",
    lat: 38.895, lon: -77.044,
    description: "World's most influential monetary authority. USD reserve currency status means Fed decisions ripple across all global asset classes.",
    metric: "$7.7T balance sheet",
    keyIndicators: ["Federal Funds Rate", "QT/QE policy", "Inflation targeting (2%)", "USD strength"],
  },
  {
    id: "cme", name: "CME Group", hubType: "exchange", city: "Chicago", country: "USA", region: "Americas",
    lat: 41.878, lon: -87.635,
    description: "World's largest derivatives marketplace. Oil futures, agricultural commodities, interest rate contracts. WTI crude price benchmark set here.",
    metric: "$1Q+ notional daily volume",
    keyIndicators: ["WTI crude futures", "Fed funds futures", "Gold futures", "Agricultural prices"],
  },
  {
    id: "ecb", name: "European Central Bank", hubType: "central_bank", city: "Frankfurt", country: "Germany", region: "Europe",
    lat: 50.107, lon: 8.679,
    description: "Monetary authority for 20 Eurozone nations. Controls the €14T+ Eurozone economy. Euro stability directly links to EU geopolitical unity.",
    metric: "€7.5T balance sheet",
    keyIndicators: ["ECB main rate", "Euro/dollar parity", "PEPP bond programs", "Eurozone CPI"],
  },
  {
    id: "lse", name: "London Stock Exchange", hubType: "exchange", city: "London", country: "UK", region: "Europe",
    lat: 51.514, lon: -0.099,
    description: "World's most international exchange. Post-Brexit resilience test ongoing. FTSE 100 heavily weighted to energy, mining, and financials.",
    metric: "$3.7T market cap",
    keyIndicators: ["FTSE 100", "GBP/USD", "Energy sector weight", "International listings"],
  },
  {
    id: "boj", name: "Bank of Japan", hubType: "central_bank", city: "Tokyo", country: "Japan", region: "Asia-Pacific",
    lat: 35.685, lon: 139.762,
    description: "Pioneer of quantitative easing. Yield curve control exit triggered global yen carry trade unwind. ¥20T+ in yen carry positions globally.",
    metric: "¥730T+ balance sheet",
    keyIndicators: ["YCC policy", "Yen carry trade", "JPY/USD", "Nikkei 225"],
  },
  {
    id: "pboc", name: "People's Bank of China", hubType: "central_bank", city: "Beijing", country: "China", region: "Asia-Pacific",
    lat: 39.91, lon: 116.37,
    description: "Controls world's second-largest economy. Leading digital currency (e-CNY) rollout. Manages $3T+ in foreign reserves as geopolitical leverage.",
    metric: "$3T+ forex reserves",
    keyIndicators: ["Yuan (CNY) fixing", "Capital controls", "e-CNY rollout", "Property sector support"],
  },
  {
    id: "hkex", name: "HKEX", hubType: "exchange", city: "Hong Kong", country: "China SAR", region: "Asia-Pacific",
    lat: 22.283, lon: 114.156,
    description: "Gateway between Chinese capital and global markets. Chinese company listings. Under increasing Beijing influence post-National Security Law 2020.",
    metric: "$4T market cap",
    keyIndicators: ["Hang Seng Index", "CNH/USD offshore", "Capital outflow signals", "Geopolitical risk discount"],
  },
  {
    id: "sgx", name: "Singapore Exchange (SGX)", hubType: "exchange", city: "Singapore", country: "Singapore", region: "Asia-Pacific",
    lat: 1.284, lon: 103.851,
    description: "Asia's neutral financial hub. ASEAN gateway. Commodity and derivatives center. Benefiting from capital flight from Hong Kong.",
    metric: "$750B market cap",
    keyIndicators: ["SGD stability", "Iron ore futures", "ASEAN gateway flows", "HK capital migration"],
  },
  {
    id: "tadawul", name: "Tadawul (Saudi Exchange)", hubType: "exchange", city: "Riyadh", country: "Saudi Arabia", region: "Middle East",
    lat: 24.711, lon: 46.674,
    description: "Largest stock exchange in MENA. Home to Saudi Aramco — world's most profitable company. Vision 2030 IPO pipeline. OPEC+ oil policy bellwether.",
    metric: "$2.8T market cap",
    keyIndicators: ["Aramco valuation", "Oil price linkage", "Vision 2030 IPOs", "OPEC+ decisions"],
  },
  {
    id: "difc", name: "DIFC (Dubai Financial Centre)", hubType: "financial_hub", city: "Dubai", country: "UAE", region: "Middle East",
    lat: 25.218, lon: 55.282,
    description: "MENA's fastest-growing financial hub. Attracts capital fleeing geopolitical risk. Crypto and fintech center. Concerns over sanctions circumvention by Russia and Iran.",
    metric: "$500B+ regional AUM",
    keyIndicators: ["Capital inflow from Russia/China", "Crypto regulation", "Western firm presence", "Sanctions compliance scrutiny"],
  },
  {
    id: "tsx", name: "TSX (Toronto Stock Exchange)", hubType: "exchange", city: "Toronto", country: "Canada", region: "Americas",
    lat: 43.648, lon: -79.383,
    description: "Largest stock exchange in Canada. Heavy weighting in energy, mining, and financials. Key indicator for commodity-linked equities.",
    metric: "$3T market cap",
    keyIndicators: ["Energy sector", "Mining stocks", "Canadian dollar", "TSXV junior miners"],
  },
  {
    id: "bovespa", name: "B3 (Bovespa)", hubType: "exchange", city: "São Paulo", country: "Brazil", region: "Americas",
    lat: -23.543, lon: -46.634,
    description: "Largest exchange in Latin America. Combines B3's NYSE/NASDAQ roles. Heavy commodities exposure: iron ore, soybeans, oil. Petrobras and Vale are bellwethers.",
    metric: "$900B market cap",
    keyIndicators: ["Real/USD", "Petrobras", "Vale iron ore", "Brazil political risk"],
  },
  {
    id: "dax", name: "Deutsche Börse (XETRA/DAX)", hubType: "exchange", city: "Frankfurt", country: "Germany", region: "Europe",
    lat: 50.117, lon: 8.671,
    description: "Germany's primary exchange. DAX 40 index. Heavily exposed to auto industry (VW, BMW, Mercedes) and chemicals (BASF). German economy bellwether.",
    metric: "$2.2T market cap",
    keyIndicators: ["DAX 40", "Auto sector", "EUR/USD", "German industrial output"],
  },
  {
    id: "six", name: "SIX Swiss Exchange", hubType: "exchange", city: "Zurich", country: "Switzerland", region: "Europe",
    lat: 47.376, lon: 8.541,
    description: "Swiss exchange. Nestlé, Novartis, and Roche dominate. SMI index. Safe haven capital flows during geopolitical crises.",
    metric: "$1.9T market cap",
    keyIndicators: ["SMI index", "CHF safe haven", "Pharma sector", "Private banking proximity"],
  },
  {
    id: "snb", name: "Swiss National Bank", hubType: "central_bank", city: "Bern", country: "Switzerland", region: "Europe",
    lat: 46.947, lon: 7.447,
    description: "Swiss central bank. Manages world's largest FX reserves relative to GDP. CHF safe haven status means SNB must constantly intervene to prevent excessive appreciation.",
    metric: "CHF900B+ balance sheet",
    keyIndicators: ["CHF intervention", "Negative rates policy", "FX reserve composition", "EU safe haven flows"],
  },
  {
    id: "sse", name: "Shanghai Stock Exchange", hubType: "exchange", city: "Shanghai", country: "China", region: "Asia-Pacific",
    lat: 31.233, lon: 121.473,
    description: "Mainland China's largest exchange (A-shares). Restricted to foreign investors. State-owned enterprise heavy. PBOC and Party policy directly moves the index.",
    metric: "$7T market cap",
    keyIndicators: ["Shanghai Composite", "A-share foreign access", "Policy stimulus", "SOE valuations"],
  },
  {
    id: "szse", name: "Shenzhen Stock Exchange", hubType: "exchange", city: "Shenzhen", country: "China", region: "Asia-Pacific",
    lat: 22.539, lon: 114.058,
    description: "China's tech-focused exchange. ChiNext board = China's NASDAQ. Tencent, BYD, and Chinese tech champions. Growth-oriented companies. More volatile than SSE.",
    metric: "$5T market cap",
    keyIndicators: ["ChiNext board", "EV sector", "Chinese tech", "Renminbi liquidity"],
  },
  {
    id: "kospi", name: "KRX (Korea Exchange)", hubType: "exchange", city: "Seoul", country: "South Korea", region: "Asia-Pacific",
    lat: 37.567, lon: 126.978,
    description: "South Korea's main exchange. Samsung Electronics alone is 20%+ of KOSPI. Semiconductor super-cycle bellwether. DPRK geopolitical risk priced in.",
    metric: "$1.7T market cap",
    keyIndicators: ["KOSPI", "Samsung weight", "Semiconductor cycle", "DPRK risk premium"],
  },
  {
    id: "bse", name: "BSE / NSE (Mumbai)", hubType: "exchange", city: "Mumbai", country: "India", region: "Asia-Pacific",
    lat: 18.934, lon: 72.835,
    description: "BSE Sensex (oldest Asian index) and NSE Nifty 50. India fastest-growing major economy. Foreign investor inflows surging. Reliance Industries bellwether.",
    metric: "$4T combined market cap",
    keyIndicators: ["Nifty 50", "Sensex", "FII flows", "India growth premium"],
  },
  {
    id: "rbi", name: "Reserve Bank of India", hubType: "central_bank", city: "Mumbai", country: "India", region: "Asia-Pacific",
    lat: 18.933, lon: 72.833,
    description: "India's central bank. Manages rupee stability. $600B+ FX reserves. Navigating between Western sanctions (Russia) and India's strategic autonomy policy.",
    metric: "$600B+ FX reserves",
    keyIndicators: ["INR stability", "FX reserves", "India rate policy", "Capital flow management"],
  },
  {
    id: "asx", name: "ASX (Australian Securities Exchange)", hubType: "exchange", city: "Sydney", country: "Australia", region: "Asia-Pacific",
    lat: -33.866, lon: 151.207,
    description: "Australia's primary exchange. Mining-heavy: BHP, Rio Tinto, Fortescue. Iron ore price to China drives index. AUKUS defence stocks rising.",
    metric: "$1.8T market cap",
    keyIndicators: ["Iron ore price", "BHP/Rio Tinto", "AUD/USD", "China demand proxy"],
  },
  {
    id: "rba", name: "Reserve Bank of Australia", hubType: "central_bank", city: "Sydney", country: "Australia", region: "Asia-Pacific",
    lat: -33.866, lon: 151.213,
    description: "Australia's central bank. AUD closely correlated with commodity prices and China growth. AUKUS security pact impacting fiscal outlook.",
    metric: "AUD600B+ balance sheet",
    keyIndicators: ["AUD/USD", "Cash rate", "Housing market", "China trade dependency"],
  },
  {
    id: "boe", name: "Bank of England", hubType: "central_bank", city: "London", country: "UK", region: "Europe",
    lat: 51.514, lon: -0.088,
    description: "UK central bank and monetary authority. Controls GBP interest rates. Post-Brexit currency dynamics. Balances inflation targeting with growth concerns.",
    metric: "£1T+ balance sheet",
    keyIndicators: ["Bank Rate", "GBP/USD", "UK CPI", "Gilt yields"],
  },
  {
    id: "euronext", name: "Euronext", hubType: "exchange", city: "Paris", country: "France", region: "Europe",
    lat: 48.869, lon: 2.336,
    description: "Pan-European exchange spanning Paris, Amsterdam, Brussels, Lisbon, Dublin, and Oslo. CAC 40 and AEX flagship indices. Largest European exchange operator.",
    metric: "$5.5T combined market cap",
    keyIndicators: ["CAC 40", "AEX", "EUR/USD", "European equities breadth"],
  },
  {
    id: "tse", name: "Tokyo Stock Exchange", hubType: "exchange", city: "Tokyo", country: "Japan", region: "Asia-Pacific",
    lat: 35.683, lon: 139.774,
    description: "Asia's second-largest exchange. Nikkei 225 and TOPIX indices. Major corporate governance reforms driving foreign investor interest. BOJ policy closely watched.",
    metric: "$6T+ market cap",
    keyIndicators: ["Nikkei 225", "TOPIX", "JPY/USD", "BOJ yield curve"],
  },
  {
    id: "mas", name: "Monetary Authority of Singapore", hubType: "central_bank", city: "Singapore", country: "Singapore", region: "Asia-Pacific",
    lat: 1.279, lon: 103.854,
    description: "Singapore's de facto central bank and financial regulator. Uses exchange rate (SGD NEER) rather than interest rates as primary monetary tool. Regional financial stability anchor.",
    metric: "SGD300B+ official foreign reserves",
    keyIndicators: ["SGD NEER policy", "USD/SGD", "Singapore CPI", "Regional liquidity"],
  },
  {
    id: "adx", name: "ADX (Abu Dhabi Securities Exchange)", hubType: "exchange", city: "Abu Dhabi", country: "UAE", region: "Middle East",
    lat: 24.454, lon: 54.377,
    description: "Abu Dhabi's primary bourse. ADNOC, First Abu Dhabi Bank, and Etihad Airways among listings. Rising profile as Gulf capital hub. ADNOC IPO pipeline key driver.",
    metric: "$700B+ market cap",
    keyIndicators: ["ADX General Index", "ADNOC listings", "Oil price linkage", "Sovereign wealth flows"],
  },
  {
    id: "dfm", name: "DFM (Dubai Financial Market)", hubType: "exchange", city: "Dubai", country: "UAE", region: "Middle East",
    lat: 25.222, lon: 55.287,
    description: "Dubai's stock exchange. Emaar Properties and Emirates NBD among blue chips. Benefiting from real estate boom and capital migration from Russia and emerging markets.",
    metric: "$200B+ market cap",
    keyIndicators: ["DFM General Index", "Real estate sector", "Regional capital inflows", "Sanctions-related flows"],
  },
  {
    id: "qse", name: "Qatar Stock Exchange", hubType: "exchange", city: "Doha", country: "Qatar", region: "Middle East",
    lat: 25.285, lon: 51.531,
    description: "Qatar's national bourse. QatarEnergy and Qatar National Bank dominant. LNG energy revenues drive market. Post-2022 World Cup international profile raised.",
    metric: "$170B+ market cap",
    keyIndicators: ["QE General Index", "LNG exports", "QatarEnergy", "Sovereign wealth activity"],
  },
  {
    id: "bkw", name: "Boursa Kuwait", hubType: "exchange", city: "Kuwait City", country: "Kuwait", region: "Middle East",
    lat: 29.376, lon: 47.977,
    description: "Kuwait's stock exchange. Upgraded to MSCI Emerging Market status 2020. Kuwait Finance House and National Bank of Kuwait bellwethers. Oil revenue funded.",
    metric: "$110B+ market cap",
    keyIndicators: ["Kuwait All Share Index", "Oil revenues", "GCC regional flows", "KWD stability"],
  },
  {
    id: "tase", name: "TASE (Tel Aviv Stock Exchange)", hubType: "exchange", city: "Tel Aviv", country: "Israel", region: "Middle East",
    lat: 32.085, lon: 34.782,
    description: "Israel's stock exchange. Strong tech and pharma sector — sometimes called 'NASDAQ of the Middle East'. War risk premium embedded. Defense sector elevated.",
    metric: "$250B+ market cap",
    keyIndicators: ["TA-35 index", "Defense sector premium", "War risk discount", "Tech sector weight"],
  },
  {
    id: "egx", name: "EGX (Egyptian Exchange)", hubType: "exchange", city: "Cairo", country: "Egypt", region: "Middle East",
    lat: 30.044, lon: 31.236,
    description: "Egypt's stock exchange. Largest bourse in Africa by listings. IMF program dependency. EGP devaluation cycles impact foreign investor returns. Canal revenues key indicator.",
    metric: "$45B+ market cap",
    keyIndicators: ["EGX 30", "Egyptian Pound stability", "IMF program compliance", "Suez Canal revenues"],
  },
  {
    id: "jse", name: "JSE (Johannesburg Stock Exchange)", hubType: "exchange", city: "Johannesburg", country: "South Africa", region: "Africa",
    lat: -26.145, lon: 28.038,
    description: "Africa's largest exchange. FTSE/JSE All Share index. Mining majors Anglo American, Glencore, and Impala Platinum. Rand volatility high. Load-shedding weighs on corporate earnings.",
    metric: "$1T+ market cap",
    keyIndicators: ["JSE All Share", "ZAR/USD", "Mining sector", "Eskom power risk"],
  },
  {
    id: "nse_nigeria", name: "NGX (Nigerian Exchange Group)", hubType: "exchange", city: "Lagos", country: "Nigeria", region: "Africa",
    lat: 6.454, lon: 3.422,
    description: "Nigeria's stock exchange. Largest economy in Africa. Dangote Cement and MTN Nigeria prominent. Naira devaluation and oil revenue volatility primary risks.",
    metric: "$35B+ market cap",
    keyIndicators: ["NGX All-Share Index", "Naira (NGN) stability", "Oil price linkage", "FX liquidity"],
  },
  {
    id: "casa", name: "Casablanca Stock Exchange", hubType: "exchange", city: "Casablanca", country: "Morocco", region: "Africa",
    lat: 33.573, lon: -7.590,
    description: "Morocco's bourse and gateway exchange for Francophone West Africa. Attijariwafa Bank flagship. Morocco positioned as Africa-EU bridge. Phosphate sector strategic.",
    metric: "$65B+ market cap",
    keyIndicators: ["MASI index", "Phosphate exports", "Dirham stability", "Africa investment gateway"],
  },
  {
    id: "cayman", name: "Cayman Islands (Offshore Hub)", hubType: "financial_hub", city: "George Town", country: "Cayman Islands", region: "Americas",
    lat: 19.313, lon: -81.255,
    description: "World's second-largest offshore financial centre. Headquarters for thousands of hedge funds and private equity vehicles. Major conduit for global capital flows. US tax haven scrutiny ongoing.",
    metric: "$5T+ offshore AUM",
    keyIndicators: ["Hedge fund registrations", "FATF compliance status", "US/EU tax reform pressure", "SPV vehicles count"],
  },
  {
    id: "luxembourg", name: "Luxembourg (EU Fund Hub)", hubType: "financial_hub", city: "Luxembourg City", country: "Luxembourg", region: "Europe",
    lat: 49.612, lon: 6.132,
    description: "Europe's leading investment fund domicile. Second-largest fund centre globally after US. Largest Chinese RMB clearing centre outside Asia. Eurobond market original home.",
    metric: "$5T+ fund assets",
    keyIndicators: ["UCITS fund flows", "RMB clearing volumes", "EU regulatory compliance", "Cross-border fund distribution"],
  },
  {
    id: "bse_bahrain", name: "Bahrain Bourse", hubType: "exchange", city: "Manama", country: "Bahrain", region: "Middle East",
    lat: 26.229, lon: 50.586,
    description: "Bahrain's stock exchange. GCC banking and Islamic finance hub. Ahli United Bank and Batelco prominent. First GCC country to sign FTA with US. Smaller but strategically positioned.",
    metric: "$25B+ market cap",
    keyIndicators: ["BAX index", "Islamic finance issuance", "GCC banking sector", "Oil subsidy fiscal health"],
  },
];

const ETAG = makeEtag(DATA);

export default function handler(req: Request): Promise<Response> {
  return serveStatic(req, DATA, ETAG);
}
