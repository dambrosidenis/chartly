'use client';

import React from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
} from 'react-simple-maps';

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// Comprehensive country code to coordinates mapping for markers
const COUNTRY_COORDINATES: Record<string, [number, number]> = {
  'AD': [1.5218, 42.5063], 'AE': [53.8478, 23.4241], 'AF': [67.7090, 33.9391], 'AG': [-61.7969, 17.0608],
  'AI': [-63.0686, 18.2206], 'AL': [20.1683, 41.1533], 'AM': [45.0382, 40.0691], 'AO': [17.8739, -11.2027],
  'AQ': [0.0000, -75.2509], 'AR': [-63.6167, -38.4161], 'AS': [-170.1318, -14.2710], 'AT': [14.5501, 47.5162],
  'AU': [133.7751, -25.2744], 'AW': [-69.9685, 12.5211], 'AX': [19.9156, 60.1785], 'AZ': [47.5769, 40.1431],
  'BA': [17.6791, 43.9159], 'BB': [-59.5432, 13.1939], 'BD': [90.3563, 23.6850], 'BE': [4.4699, 50.5039],
  'BF': [-2.1834, 12.2383], 'BG': [25.4858, 42.7339], 'BH': [50.6370, 26.0667], 'BI': [29.9189, -3.3731],
  'BJ': [2.3158, 9.3077], 'BL': [-62.8348, 17.9000], 'BM': [-64.7505, 32.3078], 'BN': [114.7277, 4.5353],
  'BO': [-63.5887, -16.2902], 'BQ': [-68.2624, 12.2018], 'BR': [-51.9253, -14.2350], 'BS': [-77.3963, 25.0343],
  'BT': [90.4336, 27.5142], 'BV': [3.4366, -54.4208], 'BW': [24.6849, -22.3285], 'BY': [27.9534, 53.7098],
  'BZ': [-88.4976, 17.1899], 'CA': [-106.3468, 56.1304], 'CC': [96.8349, -12.1642], 'CD': [21.7587, -4.0383],
  'CF': [20.9394, 6.6111], 'CG': [15.8277, -0.2280], 'CH': [8.2275, 46.8182], 'CI': [-5.5471, 7.5400],
  'CK': [-159.7777, -21.2367], 'CL': [-71.5430, -35.6751], 'CM': [12.3547, 7.3697], 'CN': [104.1954, 35.8617],
  'CO': [-74.2973, 4.5709], 'CR': [-83.7534, 9.7489], 'CU': [-77.7812, 21.5218], 'CV': [-24.0132, 16.5388],
  'CW': [-69.0183, 12.1696], 'CX': [105.6904, -10.4475], 'CY': [33.4299, 35.1264], 'CZ': [15.4730, 49.8175],
  'DE': [10.4515, 51.1657], 'DJ': [42.5903, 11.8251], 'DK': [9.5018, 55.6761], 'DM': [-61.3710, 15.4140],
  'DO': [-70.1627, 18.7357], 'DZ': [1.6596, 28.0339], 'EC': [-78.1834, -1.8312], 'EE': [25.0136, 58.5953],
  'EG': [30.8025, 26.8206], 'EH': [-12.8858, 24.2155], 'ER': [39.7823, 15.7394], 'ES': [-3.7492, 40.4637],
  'ET': [40.4897, 9.1450], 'FI': [25.7482, 61.9241], 'FJ': [179.4144, -16.5780], 'FK': [-59.5236, -51.7963],
  'FM': [150.5508, 7.4256], 'FO': [-6.9118, 61.8926], 'FR': [2.2137, 46.2276], 'GA': [11.6094, -0.8037],
  'GB': [-3.4360, 55.3781], 'GD': [-61.6790, 12.2628], 'GE': [43.3569, 42.3154], 'GF': [-53.1258, 3.9339],
  'GG': [-2.5850, 49.4484], 'GH': [-1.0232, 7.9465], 'GI': [-5.3536, 36.1408], 'GL': [-42.6043, 71.7069],
  'GM': [-15.3101, 13.4432], 'GN': [-9.6966, 9.9456], 'GP': [-61.5510, 16.9950], 'GQ': [10.2679, 1.6508],
  'GR': [21.8243, 39.0742], 'GS': [-36.5876, -54.4296], 'GT': [-90.2308, 15.7835], 'GU': [144.7937, 13.4443],
  'GW': [-15.1804, 11.8037], 'GY': [-58.9302, 4.8604], 'HK': [114.1694, 22.3193], 'HM': [73.5044, -53.1814],
  'HN': [-87.2750, 15.2000], 'HR': [15.2000, 45.1000], 'HT': [-72.2852, 18.9712], 'HU': [19.5033, 47.1625],
  'ID': [113.9213, -0.7893], 'IE': [-8.2439, 53.4129], 'IL': [34.8516, 32.4279], 'IM': [-4.5481, 54.2361],
  'IN': [78.9629, 20.5937], 'IO': [71.8765, -6.3432], 'IQ': [43.6793, 33.2232], 'IR': [53.6880, 32.4279],
  'IS': [-19.0208, 64.9631], 'IT': [12.5674, 41.8719], 'JE': [-2.1358, 49.2144], 'JM': [-77.2975, 18.1096],
  'JO': [36.2384, 30.5852], 'JP': [138.2529, 36.2048], 'KE': [37.9062, -0.0236], 'KG': [74.7661, 41.2044],
  'KH': [104.9910, 12.5657], 'KI': [-157.3630, -3.3704], 'KM': [43.8722, -11.8750], 'KN': [-62.7830, 17.3578],
  'KP': [127.5101, 40.3399], 'KR': [127.7669, 35.9078], 'KW': [47.4818, 29.3117], 'KY': [-80.5665, 19.5138],
  'KZ': [66.9237, 48.0196], 'LA': [102.4955, 19.8563], 'LB': [35.8623, 33.8547], 'LC': [-60.9789, 13.9094],
  'LI': [9.5215, 47.1660], 'LK': [80.7718, 7.8731], 'LR': [-9.4295, 6.4281], 'LS': [28.2336, -29.6100],
  'LT': [23.8813, 55.1694], 'LU': [6.1296, 49.8153], 'LV': [24.6032, 56.8796], 'LY': [17.2283, 26.3351],
  'MA': [-7.0926, 31.7917], 'MC': [7.4167, 43.7333], 'MD': [28.3699, 47.4116], 'ME': [19.3744, 42.7087],
  'MF': [-63.0501, 18.0708], 'MG': [46.8691, -18.7669], 'MH': [171.1845, 7.1315], 'MK': [21.7453, 41.6086],
  'ML': [-3.9962, 17.5707], 'MM': [95.9560, 21.9162], 'MN': [103.8467, 46.8625], 'MO': [113.5439, 22.1987],
  'MP': [145.3887, 17.3308], 'MQ': [-61.0242, 14.6415], 'MR': [-10.9408, 21.0079], 'MS': [-62.1874, 16.7425],
  'MT': [14.3754, 35.9375], 'MU': [57.5522, -20.3484], 'MV': [73.2207, 3.2028], 'MW': [34.3015, -13.2543],
  'MX': [-102.5528, 23.6345], 'MY': [101.9758, 4.2105], 'MZ': [35.5296, -18.6657], 'NA': [18.4241, -22.9576],
  'NC': [165.6189, -20.9043], 'NE': [8.0817, 17.6078], 'NF': [167.9547, -29.0408], 'NG': [8.6753, 9.0820],
  'NI': [-85.2072, 12.8654], 'NL': [5.2913, 52.1326], 'NO': [8.4689, 60.4720], 'NP': [84.1240, 28.3949],
  'NR': [166.9315, -0.5228], 'NU': [-169.8672, -19.0544], 'NZ': [174.8860, -40.9006], 'OM': [55.9754, 21.4735],
  'PA': [-80.7821, 8.5380], 'PE': [-75.0152, -9.1900], 'PF': [-149.4068, -17.6797], 'PG': [143.9555, -6.3150],
  'PH': [121.7740, 12.8797], 'PK': [69.3451, 30.3753], 'PL': [19.1343, 51.9194], 'PM': [-56.3159, 46.9419],
  'PN': [-127.9216, -24.7036], 'PR': [-66.5901, 18.2208], 'PS': [35.2332, 31.9522], 'PT': [-8.2245, 39.3999],
  'PW': [134.5825, 7.5150], 'PY': [-58.4438, -23.4425], 'QA': [51.1839, 25.3548], 'RE': [55.5364, -21.1151],
  'RO': [24.9668, 45.9432], 'RS': [21.0059, 44.0165], 'RU': [105.3188, 61.5240], 'RW': [29.8739, -1.9403],
  'SA': [45.0792, 23.8859], 'SB': [160.1562, -9.6457], 'SC': [55.4920, -4.6796], 'SD': [30.2176, 12.8628],
  'SE': [18.6435, 60.1282], 'SG': [103.8198, 1.3521], 'SH': [-12.2776, -24.1434], 'SI': [14.9955, 46.1512],
  'SJ': [23.6702, 77.5536], 'SK': [19.6990, 48.6690], 'SL': [-11.7799, 8.4606], 'SM': [12.4578, 43.9424],
  'SN': [-14.4524, 14.4974], 'SO': [46.1996, 5.1521], 'SR': [-56.0278, 3.9193], 'SS': [31.3069, 6.8770],
  'ST': [6.6131, 0.1864], 'SV': [-88.8965, 13.7942], 'SX': [-63.0548, 18.0256], 'SY': [38.9968, 34.8021],
  'SZ': [31.4659, -26.5225], 'TC': [-71.7979, 21.6940], 'TD': [18.7322, 15.4542], 'TF': [69.1673, -49.2804],
  'TG': [0.8248, 8.6195], 'TH': [100.9925, 15.8700], 'TJ': [71.2761, 38.8610], 'TK': [-172.0000, -8.9670],
  'TL': [125.7275, -8.8742], 'TM': [59.5563, 38.9697], 'TN': [9.5375, 33.8869], 'TO': [-175.1982, -21.1789],
  'TR': [35.2433, 38.9637], 'TT': [-61.2225, 10.6918], 'TV': [177.6493, -7.1095], 'TW': [120.9605, 23.6978],
  'TZ': [34.8888, -6.3690], 'UA': [31.1656, 48.3794], 'UG': [32.2903, 1.3733], 'UM': [-160.0000, 0.0000],
  'US': [-95.7129, 37.0902], 'UY': [-55.7658, -32.5228], 'UZ': [64.5853, 41.3775], 'VA': [12.4534, 41.9029],
  'VC': [-61.2872, 12.9843], 'VE': [-66.5897, 6.4238], 'VG': [-64.6963, 18.4207], 'VI': [-64.8963, 18.3358],
  'VN': [108.2772, 14.0583], 'VU': [166.9592, -15.3767], 'WF': [-177.1665, -13.7687], 'WS': [-172.1046, -13.7590],
  'XK': [20.9021, 42.6026], 'YE': [48.5164, 15.5527], 'YT': [45.1662, -12.8275], 'ZA': [22.9375, -30.5595],
  'ZM': [27.8546, -13.1339], 'ZW': [29.1549, -19.0154],
};

// Comprehensive country code to ISO3 mapping for geography matching
const ISO2_TO_ISO3: Record<string, string> = {
  'AD': 'AND', 'AE': 'ARE', 'AF': 'AFG', 'AG': 'ATG', 'AI': 'AIA', 'AL': 'ALB', 'AM': 'ARM', 'AO': 'AGO',
  'AQ': 'ATA', 'AR': 'ARG', 'AS': 'ASM', 'AT': 'AUT', 'AU': 'AUS', 'AW': 'ABW', 'AX': 'ALA', 'AZ': 'AZE',
  'BA': 'BIH', 'BB': 'BRB', 'BD': 'BGD', 'BE': 'BEL', 'BF': 'BFA', 'BG': 'BGR', 'BH': 'BHR', 'BI': 'BDI',
  'BJ': 'BEN', 'BL': 'BLM', 'BM': 'BMU', 'BN': 'BRN', 'BO': 'BOL', 'BQ': 'BES', 'BR': 'BRA', 'BS': 'BHS',
  'BT': 'BTN', 'BV': 'BVT', 'BW': 'BWA', 'BY': 'BLR', 'BZ': 'BLZ', 'CA': 'CAN', 'CC': 'CCK', 'CD': 'COD',
  'CF': 'CAF', 'CG': 'COG', 'CH': 'CHE', 'CI': 'CIV', 'CK': 'COK', 'CL': 'CHL', 'CM': 'CMR', 'CN': 'CHN',
  'CO': 'COL', 'CR': 'CRI', 'CU': 'CUB', 'CV': 'CPV', 'CW': 'CUW', 'CX': 'CXR', 'CY': 'CYP', 'CZ': 'CZE',
  'DE': 'DEU', 'DJ': 'DJI', 'DK': 'DNK', 'DM': 'DMA', 'DO': 'DOM', 'DZ': 'DZA', 'EC': 'ECU', 'EE': 'EST',
  'EG': 'EGY', 'EH': 'ESH', 'ER': 'ERI', 'ES': 'ESP', 'ET': 'ETH', 'FI': 'FIN', 'FJ': 'FJI', 'FK': 'FLK',
  'FM': 'FSM', 'FO': 'FRO', 'FR': 'FRA', 'GA': 'GAB', 'GB': 'GBR', 'GD': 'GRD', 'GE': 'GEO', 'GF': 'GUF',
  'GG': 'GGY', 'GH': 'GHA', 'GI': 'GIB', 'GL': 'GRL', 'GM': 'GMB', 'GN': 'GIN', 'GP': 'GLP', 'GQ': 'GNQ',
  'GR': 'GRC', 'GS': 'SGS', 'GT': 'GTM', 'GU': 'GUM', 'GW': 'GNB', 'GY': 'GUY', 'HK': 'HKG', 'HM': 'HMD',
  'HN': 'HND', 'HR': 'HRV', 'HT': 'HTI', 'HU': 'HUN', 'ID': 'IDN', 'IE': 'IRL', 'IL': 'ISR', 'IM': 'IMN',
  'IN': 'IND', 'IO': 'IOT', 'IQ': 'IRQ', 'IR': 'IRN', 'IS': 'ISL', 'IT': 'ITA', 'JE': 'JEY', 'JM': 'JAM',
  'JO': 'JOR', 'JP': 'JPN', 'KE': 'KEN', 'KG': 'KGZ', 'KH': 'KHM', 'KI': 'KIR', 'KM': 'COM', 'KN': 'KNA',
  'KP': 'PRK', 'KR': 'KOR', 'KW': 'KWT', 'KY': 'CYM', 'KZ': 'KAZ', 'LA': 'LAO', 'LB': 'LBN', 'LC': 'LCA',
  'LI': 'LIE', 'LK': 'LKA', 'LR': 'LBR', 'LS': 'LSO', 'LT': 'LTU', 'LU': 'LUX', 'LV': 'LVA', 'LY': 'LBY',
  'MA': 'MAR', 'MC': 'MCO', 'MD': 'MDA', 'ME': 'MNE', 'MF': 'MAF', 'MG': 'MDG', 'MH': 'MHL', 'MK': 'MKD',
  'ML': 'MLI', 'MM': 'MMR', 'MN': 'MNG', 'MO': 'MAC', 'MP': 'MNP', 'MQ': 'MTQ', 'MR': 'MRT', 'MS': 'MSR',
  'MT': 'MLT', 'MU': 'MUS', 'MV': 'MDV', 'MW': 'MWI', 'MX': 'MEX', 'MY': 'MYS', 'MZ': 'MOZ', 'NA': 'NAM',
  'NC': 'NCL', 'NE': 'NER', 'NF': 'NFK', 'NG': 'NGA', 'NI': 'NIC', 'NL': 'NLD', 'NO': 'NOR', 'NP': 'NPL',
  'NR': 'NRU', 'NU': 'NIU', 'NZ': 'NZL', 'OM': 'OMN', 'PA': 'PAN', 'PE': 'PER', 'PF': 'PYF', 'PG': 'PNG',
  'PH': 'PHL', 'PK': 'PAK', 'PL': 'POL', 'PM': 'SPM', 'PN': 'PCN', 'PR': 'PRI', 'PS': 'PSE', 'PT': 'PRT',
  'PW': 'PLW', 'PY': 'PRY', 'QA': 'QAT', 'RE': 'REU', 'RO': 'ROU', 'RS': 'SRB', 'RU': 'RUS', 'RW': 'RWA',
  'SA': 'SAU', 'SB': 'SLB', 'SC': 'SYC', 'SD': 'SDN', 'SE': 'SWE', 'SG': 'SGP', 'SH': 'SHN', 'SI': 'SVN',
  'SJ': 'SJM', 'SK': 'SVK', 'SL': 'SLE', 'SM': 'SMR', 'SN': 'SEN', 'SO': 'SOM', 'SR': 'SUR', 'SS': 'SSD',
  'ST': 'STP', 'SV': 'SLV', 'SX': 'SXM', 'SY': 'SYR', 'SZ': 'SWZ', 'TC': 'TCA', 'TD': 'TCD', 'TF': 'ATF',
  'TG': 'TGO', 'TH': 'THA', 'TJ': 'TJK', 'TK': 'TKL', 'TL': 'TLS', 'TM': 'TKM', 'TN': 'TUN', 'TO': 'TON',
  'TR': 'TUR', 'TT': 'TTO', 'TV': 'TUV', 'TW': 'TWN', 'TZ': 'TZA', 'UA': 'UKR', 'UG': 'UGA', 'UM': 'UMI',
  'US': 'USA', 'UY': 'URY', 'UZ': 'UZB', 'VA': 'VAT', 'VC': 'VCT', 'VE': 'VEN', 'VG': 'VGB', 'VI': 'VIR',
  'VN': 'VNM', 'VU': 'VUT', 'WF': 'WLF', 'WS': 'WSM', 'XK': 'XKX', 'YE': 'YEM', 'YT': 'MYT', 'ZA': 'ZAF',
  'ZM': 'ZMB', 'ZW': 'ZWE',
};

interface ColorScheme {
  baseColor: string;
  noDataColor: string;
  markerColor: string;
  strokeColor: string;
  hoverColor: string;
}

interface MapDimensions {
  width: number;
  height: number;
  scale: number;
  center: [number, number];
}

interface LegendLabels {
  highVolume: string;
  mediumVolume: string;
  noData: string;
  dataPoints: string;
  valueLabel: string;
}

interface WorldMapProps {
  data: Array<{ country: string; value: number }>;
  title: string;
  colorScheme?: ColorScheme;
  dimensions?: MapDimensions;
  legendLabels?: LegendLabels;
  showMarkers?: boolean;
  showTable?: boolean;
  showLegend?: boolean;
}

export default function WorldMap({ 
  data, 
  title, 
  colorScheme = {
    baseColor: 'rgb(54, 155, 235)',
    noDataColor: '#f0f0f0',
    markerColor: '#ef4444',
    strokeColor: '#ffffff',
    hoverColor: '#1e40af'
  },
  dimensions = {
    width: 800,
    height: 400,
    scale: 120,
    center: [0, 20]
  },
  legendLabels = {
    highVolume: 'High Volume',
    mediumVolume: 'Medium Volume',
    noData: 'No Data',
    dataPoints: 'Data Points',
    valueLabel: 'Volume'
  },
  showMarkers = true,
  showTable = true,
  showLegend = true
}: WorldMapProps) {
  // Deduplicate data by country, summing values for duplicates
  const deduplicatedData = data.reduce((acc, { country, value }) => {
    const upperCountry = country.toUpperCase();
    const existing = acc.find(item => item.country.toUpperCase() === upperCountry);
    if (existing) {
      existing.value += value;
    } else {
      acc.push({ country: upperCountry, value });
    }
    return acc;
  }, [] as Array<{ country: string; value: number }>);
  
  // Find max value for color scaling
  const maxValue = Math.max(...deduplicatedData.map(d => d.value));
  
  // Create a map of country codes to values
  const dataMap = new Map(deduplicatedData.map(d => [d.country, d.value]));
  
  // Get color intensity based on value
  const getCountryColor = (countryCode: string, intensity?: number) => {
    const value = dataMap.get(countryCode);
    if (!value && intensity === undefined) return colorScheme.noDataColor;
    
    const actualIntensity = intensity !== undefined ? intensity : value! / maxValue;
    // Extract RGB values from baseColor
    const baseColorMatch = colorScheme.baseColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (baseColorMatch) {
      const [, r, g, b] = baseColorMatch.map(Number);
      const newR = Math.floor(r + (255 - r) * (1 - actualIntensity));
      const newG = Math.floor(g + (255 - g) * (1 - actualIntensity));
      const newB = Math.floor(b + (255 - b) * (1 - actualIntensity));
      return `rgb(${newR}, ${newG}, ${newB})`;
    }
    // Fallback for hex colors
    return colorScheme.baseColor;
  };

  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold mb-4 text-center">{title}</h3>
      
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          scale: dimensions.scale,
          center: dimensions.center,
        }}
        width={dimensions.width}
        height={dimensions.height}
        className="w-full h-auto"
      >
        <Geographies geography={geoUrl}>
          {({ geographies }: { geographies: any[] }) =>
            geographies.map((geo: any) => {
              const iso3 = geo.properties.ISO_A3;
              const iso2 = Object.keys(ISO2_TO_ISO3).find(
                key => ISO2_TO_ISO3[key] === iso3
              );
              
              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={iso2 ? getCountryColor(iso2) : colorScheme.noDataColor}
                  stroke={colorScheme.strokeColor}
                  strokeWidth={0.5}
                  style={{
                    default: { outline: 'none' },
                    hover: { 
                      outline: 'none',
                      fill: iso2 ? colorScheme.hoverColor : colorScheme.noDataColor,
                    },
                    pressed: { outline: 'none' },
                  }}
                />
              );
            })
          }
        </Geographies>
        
        {/* Add markers for countries with data */}
        {showMarkers && deduplicatedData.map(({ country, value }) => {
          const coords = COUNTRY_COORDINATES[country];
          if (!coords) return null;
          
          return (
            <Marker key={country} coordinates={coords}>
              <circle
                r={Math.sqrt(value / maxValue) * 15 + 5}
                fill={colorScheme.markerColor}
                fillOpacity={0.7}
                stroke={colorScheme.strokeColor}
                strokeWidth={2}
              />
              <text
                textAnchor="middle"
                y={-20}
                fontSize={12}
                fill="#374151"
                fontWeight="bold"
              >
                {value.toLocaleString()}
              </text>
            </Marker>
          );
        })}
      </ComposableMap>
      
      {/* Legend */}
      {showLegend && (
      <div className="mt-4 flex flex-wrap justify-center gap-4 text-sm">
        <div className="flex items-center gap-2">
            <div 
              className="w-4 h-4" 
              style={{ backgroundColor: colorScheme.baseColor }}
            ></div>
            <span>{legendLabels.highVolume}</span>
        </div>
          <div className="flex items-center gap-2">
            <div 
              className="w-4 h-4" 
              style={{ backgroundColor: getCountryColor('', 0.5) }}
            ></div>
            <span>{legendLabels.mediumVolume}</span>
          </div>
        <div className="flex items-center gap-2">
            <div 
              className="w-4 h-4" 
              style={{ backgroundColor: colorScheme.noDataColor }}
            ></div>
            <span>{legendLabels.noData}</span>
        </div>
          {showMarkers && (
        <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: colorScheme.markerColor }}
              ></div>
              <span>{legendLabels.dataPoints}</span>
            </div>
          )}
        </div>
      )}
      
      {/* Data table */}
      {showTable && (
      <div className="mt-6 overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Country</th>
                <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">{legendLabels.valueLabel}</th>
            </tr>
          </thead>
          <tbody>
            {deduplicatedData
              .sort((a, b) => b.value - a.value)
              .map(({ country, value }) => (
                <tr key={country} className="border-t">
                  <td className="px-4 py-2 text-sm text-gray-900">
                    {COUNTRY_NAMES[country] || country}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-900 text-right font-mono">
                    {value.toLocaleString()}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      )}
    </div>
  );
}

// Comprehensive country names mapping
const COUNTRY_NAMES: Record<string, string> = {
  'AD': 'Andorra', 'AE': 'United Arab Emirates', 'AF': 'Afghanistan', 'AG': 'Antigua and Barbuda',
  'AI': 'Anguilla', 'AL': 'Albania', 'AM': 'Armenia', 'AO': 'Angola', 'AQ': 'Antarctica',
  'AR': 'Argentina', 'AS': 'American Samoa', 'AT': 'Austria', 'AU': 'Australia', 'AW': 'Aruba',
  'AX': 'Åland Islands', 'AZ': 'Azerbaijan', 'BA': 'Bosnia and Herzegovina', 'BB': 'Barbados',
  'BD': 'Bangladesh', 'BE': 'Belgium', 'BF': 'Burkina Faso', 'BG': 'Bulgaria', 'BH': 'Bahrain',
  'BI': 'Burundi', 'BJ': 'Benin', 'BL': 'Saint Barthélemy', 'BM': 'Bermuda', 'BN': 'Brunei',
  'BO': 'Bolivia', 'BQ': 'Caribbean Netherlands', 'BR': 'Brazil', 'BS': 'Bahamas', 'BT': 'Bhutan',
  'BV': 'Bouvet Island', 'BW': 'Botswana', 'BY': 'Belarus', 'BZ': 'Belize', 'CA': 'Canada',
  'CC': 'Cocos Islands', 'CD': 'Democratic Republic of the Congo', 'CF': 'Central African Republic',
  'CG': 'Republic of the Congo', 'CH': 'Switzerland', 'CI': 'Côte d\'Ivoire', 'CK': 'Cook Islands',
  'CL': 'Chile', 'CM': 'Cameroon', 'CN': 'China', 'CO': 'Colombia', 'CR': 'Costa Rica', 'CU': 'Cuba',
  'CV': 'Cape Verde', 'CW': 'Curaçao', 'CX': 'Christmas Island', 'CY': 'Cyprus', 'CZ': 'Czech Republic',
  'DE': 'Germany', 'DJ': 'Djibouti', 'DK': 'Denmark', 'DM': 'Dominica', 'DO': 'Dominican Republic',
  'DZ': 'Algeria', 'EC': 'Ecuador', 'EE': 'Estonia', 'EG': 'Egypt', 'EH': 'Western Sahara',
  'ER': 'Eritrea', 'ES': 'Spain', 'ET': 'Ethiopia', 'FI': 'Finland', 'FJ': 'Fiji',
  'FK': 'Falkland Islands', 'FM': 'Micronesia', 'FO': 'Faroe Islands', 'FR': 'France',
  'GA': 'Gabon', 'GB': 'United Kingdom', 'GD': 'Grenada', 'GE': 'Georgia', 'GF': 'French Guiana',
  'GG': 'Guernsey', 'GH': 'Ghana', 'GI': 'Gibraltar', 'GL': 'Greenland', 'GM': 'Gambia',
  'GN': 'Guinea', 'GP': 'Guadeloupe', 'GQ': 'Equatorial Guinea', 'GR': 'Greece',
  'GS': 'South Georgia and the South Sandwich Islands', 'GT': 'Guatemala', 'GU': 'Guam',
  'GW': 'Guinea-Bissau', 'GY': 'Guyana', 'HK': 'Hong Kong', 'HM': 'Heard Island and McDonald Islands',
  'HN': 'Honduras', 'HR': 'Croatia', 'HT': 'Haiti', 'HU': 'Hungary', 'ID': 'Indonesia',
  'IE': 'Ireland', 'IL': 'Israel', 'IM': 'Isle of Man', 'IN': 'India', 'IO': 'British Indian Ocean Territory',
  'IQ': 'Iraq', 'IR': 'Iran', 'IS': 'Iceland', 'IT': 'Italy', 'JE': 'Jersey', 'JM': 'Jamaica',
  'JO': 'Jordan', 'JP': 'Japan', 'KE': 'Kenya', 'KG': 'Kyrgyzstan', 'KH': 'Cambodia',
  'KI': 'Kiribati', 'KM': 'Comoros', 'KN': 'Saint Kitts and Nevis', 'KP': 'North Korea',
  'KR': 'South Korea', 'KW': 'Kuwait', 'KY': 'Cayman Islands', 'KZ': 'Kazakhstan', 'LA': 'Laos',
  'LB': 'Lebanon', 'LC': 'Saint Lucia', 'LI': 'Liechtenstein', 'LK': 'Sri Lanka', 'LR': 'Liberia',
  'LS': 'Lesotho', 'LT': 'Lithuania', 'LU': 'Luxembourg', 'LV': 'Latvia', 'LY': 'Libya',
  'MA': 'Morocco', 'MC': 'Monaco', 'MD': 'Moldova', 'ME': 'Montenegro', 'MF': 'Saint Martin',
  'MG': 'Madagascar', 'MH': 'Marshall Islands', 'MK': 'North Macedonia', 'ML': 'Mali',
  'MM': 'Myanmar', 'MN': 'Mongolia', 'MO': 'Macao', 'MP': 'Northern Mariana Islands',
  'MQ': 'Martinique', 'MR': 'Mauritania', 'MS': 'Montserrat', 'MT': 'Malta', 'MU': 'Mauritius',
  'MV': 'Maldives', 'MW': 'Malawi', 'MX': 'Mexico', 'MY': 'Malaysia', 'MZ': 'Mozambique',
  'NA': 'Namibia', 'NC': 'New Caledonia', 'NE': 'Niger', 'NF': 'Norfolk Island', 'NG': 'Nigeria',
  'NI': 'Nicaragua', 'NL': 'Netherlands', 'NO': 'Norway', 'NP': 'Nepal', 'NR': 'Nauru',
  'NU': 'Niue', 'NZ': 'New Zealand', 'OM': 'Oman', 'PA': 'Panama', 'PE': 'Peru',
  'PF': 'French Polynesia', 'PG': 'Papua New Guinea', 'PH': 'Philippines', 'PK': 'Pakistan',
  'PL': 'Poland', 'PM': 'Saint Pierre and Miquelon', 'PN': 'Pitcairn', 'PR': 'Puerto Rico',
  'PS': 'Palestine', 'PT': 'Portugal', 'PW': 'Palau', 'PY': 'Paraguay', 'QA': 'Qatar',
  'RE': 'Réunion', 'RO': 'Romania', 'RS': 'Serbia', 'RU': 'Russia', 'RW': 'Rwanda',
  'SA': 'Saudi Arabia', 'SB': 'Solomon Islands', 'SC': 'Seychelles', 'SD': 'Sudan',
  'SE': 'Sweden', 'SG': 'Singapore', 'SH': 'Saint Helena', 'SI': 'Slovenia', 'SJ': 'Svalbard and Jan Mayen',
  'SK': 'Slovakia', 'SL': 'Sierra Leone', 'SM': 'San Marino', 'SN': 'Senegal', 'SO': 'Somalia',
  'SR': 'Suriname', 'SS': 'South Sudan', 'ST': 'São Tomé and Príncipe', 'SV': 'El Salvador',
  'SX': 'Sint Maarten', 'SY': 'Syria', 'SZ': 'Eswatini', 'TC': 'Turks and Caicos Islands',
  'TD': 'Chad', 'TF': 'French Southern Territories', 'TG': 'Togo', 'TH': 'Thailand',
  'TJ': 'Tajikistan', 'TK': 'Tokelau', 'TL': 'Timor-Leste', 'TM': 'Turkmenistan', 'TN': 'Tunisia',
  'TO': 'Tonga', 'TR': 'Turkey', 'TT': 'Trinidad and Tobago', 'TV': 'Tuvalu', 'TW': 'Taiwan',
  'TZ': 'Tanzania', 'UA': 'Ukraine', 'UG': 'Uganda', 'UM': 'United States Minor Outlying Islands',
  'US': 'United States', 'UY': 'Uruguay', 'UZ': 'Uzbekistan', 'VA': 'Vatican City',
  'VC': 'Saint Vincent and the Grenadines', 'VE': 'Venezuela', 'VG': 'British Virgin Islands',
  'VI': 'U.S. Virgin Islands', 'VN': 'Vietnam', 'VU': 'Vanuatu', 'WF': 'Wallis and Futuna',
  'WS': 'Samoa', 'XK': 'Kosovo', 'YE': 'Yemen', 'YT': 'Mayotte', 'ZA': 'South Africa',
  'ZM': 'Zambia', 'ZW': 'Zimbabwe',
  // Common aliases
  'UK': 'United Kingdom',
};
