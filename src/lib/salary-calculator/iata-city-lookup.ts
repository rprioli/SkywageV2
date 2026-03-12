/**
 * Static IATA-to-city lookup table for Flydubai destinations.
 * Covers all known Flydubai route destinations from DXB.
 * Unknown codes fall back to the IATA code itself.
 */

const IATA_CITY_MAP: Record<string, string> = {
  // Home base
  DXB: 'Dubai, UAE',

  // GCC
  DOH: 'Doha, Qatar',
  KWI: 'Kuwait City, Kuwait',
  BAH: 'Bahrain',
  MCT: 'Muscat, Oman',
  RUH: 'Riyadh, Saudi Arabia',
  JED: 'Jeddah, Saudi Arabia',
  DMM: 'Dammam, Saudi Arabia',
  MED: 'Medina, Saudi Arabia',
  YNB: 'Yanbu, Saudi Arabia',
  AHB: 'Abha, Saudi Arabia',
  TUU: 'Tabuk, Saudi Arabia',
  SLL: 'Salalah, Oman',
  SPX: 'Sphinx, Egypt',

  // Middle East
  AMM: 'Amman, Jordan',
  AQJ: 'Aqaba, Jordan',
  TLV: 'Tel Aviv, Israel',
  BGW: 'Baghdad, Iraq',
  BSR: 'Basra, Iraq',
  NJF: 'Najaf, Iraq',
  EBL: 'Erbil, Iraq',
  ISU: 'Sulaymaniyah, Iraq',
  BEY: 'Beirut, Lebanon',
  IKA: 'Tehran, Iran',
  SYZ: 'Shiraz, Iran',
  ISF: 'Isfahan, Iran',
  LAR: 'Lar, Iran',
  AWZ: 'Ahwaz, Iran',
  MHD: 'Mashhad, Iran',

  // Egypt & North Africa
  CAI: 'Cairo, Egypt',
  ALY: 'Alexandria, Egypt',
  HBE: 'Alexandria, Egypt',
  SSH: 'Sharm El Sheikh, Egypt',
  HRG: 'Hurghada, Egypt',
  LXR: 'Luxor, Egypt',
  ASW: 'Aswan, Egypt',
  CMN: 'Casablanca, Morocco',
  TUN: 'Tunis, Tunisia',
  ALG: 'Algiers, Algeria',

  // East Africa
  KRT: 'Khartoum, Sudan',
  ADD: 'Addis Ababa, Ethiopia',
  NBO: 'Nairobi, Kenya',
  DAR: 'Dar es Salaam, Tanzania',
  ZNZ: 'Zanzibar, Tanzania',
  JNB: 'Johannesburg, South Africa',
  MBA: 'Mombasa, Kenya',
  EBB: 'Entebbe, Uganda',
  JUB: 'Juba, South Sudan',
  DJI: 'Djibouti',
  ASM: 'Asmara, Eritrea',
  HGA: 'Hargeisa, Somalia',

  // South Asia
  DEL: 'Delhi, India',
  BOM: 'Mumbai, India',
  CCU: 'Kolkata, India',
  COK: 'Kochi, India',
  TRV: 'Thiruvananthapuram, India',
  HYD: 'Hyderabad, India',
  BLR: 'Bengaluru, India',
  MAA: 'Chennai, India',
  AMD: 'Ahmedabad, India',
  GOI: 'Goa, India',
  JAI: 'Jaipur, India',
  LKO: 'Lucknow, India',
  KHI: 'Karachi, Pakistan',
  LHE: 'Lahore, Pakistan',
  ISB: 'Islamabad, Pakistan',
  SIA: 'Sialkot, Pakistan',
  MUX: 'Multan, Pakistan',
  FSD: 'Faisalabad, Pakistan',
  UET: 'Quetta, Pakistan',
  SKT: 'Sialkot, Pakistan',
  LYP: 'Faisalabad, Pakistan',
  KBL: 'Kabul, Afghanistan',
  CMB: 'Colombo, Sri Lanka',
  KTM: 'Kathmandu, Nepal',
  DAC: 'Dhaka, Bangladesh',
  CGP: 'Chittagong, Bangladesh',
  MLE: 'Malé, Maldives',

  // Central Asia & CIS
  TAS: 'Tashkent, Uzbekistan',
  SKD: 'Samarkand, Uzbekistan',
  BHK: 'Bukhara, Uzbekistan',
  FRU: 'Bishkek, Kyrgyzstan',
  ALA: 'Almaty, Kazakhstan',
  NQZ: 'Astana, Kazakhstan',
  DYU: 'Dushanbe, Tajikistan',
  GYD: 'Baku, Azerbaijan',
  TBS: 'Tbilisi, Georgia',
  EVN: 'Yerevan, Armenia',
  MSQ: 'Minsk, Belarus',

  // Russia
  SVO: 'Moscow, Russia',
  VKO: 'Moscow, Russia',
  DME: 'Moscow, Russia',
  LED: 'St Petersburg, Russia',
  KZN: 'Kazan, Russia',
  SVX: 'Yekaterinburg, Russia',
  KRR: 'Krasnodar, Russia',
  ROV: 'Rostov-on-Don, Russia',
  MRV: 'Mineralnye Vody, Russia',
  UFA: 'Ufa, Russia',
  KUF: 'Samara, Russia',
  VOZ: 'Voronezh, Russia',

  // Europe
  VIE: 'Vienna, Austria',
  PRG: 'Prague, Czechia',
  BUD: 'Budapest, Hungary',
  WAW: 'Warsaw, Poland',
  KRK: 'Krakow, Poland',
  BEG: 'Belgrade, Serbia',
  SOF: 'Sofia, Bulgaria',
  OTP: 'Bucharest, Romania',
  ZAG: 'Zagreb, Croatia',
  LJU: 'Ljubljana, Slovenia',
  SKP: 'Skopje, North Macedonia',
  SJJ: 'Sarajevo, Bosnia',
  TIV: 'Tivat, Montenegro',
  IST: 'Istanbul, Turkey',
  SAW: 'Istanbul, Turkey',
  ESB: 'Ankara, Turkey',
  TZX: 'Trabzon, Turkey',
  ADB: 'Izmir, Turkey',
  AYT: 'Antalya, Turkey',
  DLM: 'Dalaman, Turkey',
  GZT: 'Gaziantep, Turkey',
  KYA: 'Konya, Turkey',
  MSR: 'Mus, Turkey',
  NAV: 'Nevsehir, Turkey',
  HEL: 'Helsinki, Finland',
  BRU: 'Brussels, Belgium',
  ATH: 'Athens, Greece',
  SKG: 'Thessaloniki, Greece',
  HER: 'Heraklion, Greece',
  LCA: 'Larnaca, Cyprus',
  MXP: 'Milan, Italy',
  NAP: 'Naples, Italy',
  FCO: 'Rome, Italy',
  BCN: 'Barcelona, Spain',

  // Southeast Asia & Far East
  BKK: 'Bangkok, Thailand',
  SIN: 'Singapore',
  KUL: 'Kuala Lumpur, Malaysia',
  CGK: 'Jakarta, Indonesia',
};

/**
 * Looks up the city name for an IATA code.
 * Returns the IATA code itself if not found in the lookup table.
 */
export function lookupCity(iata: string): string {
  return IATA_CITY_MAP[iata.toUpperCase()] ?? iata;
}
