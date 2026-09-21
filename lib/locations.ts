// lib/locations.ts
// Ported from the Next.js backend `app/lib/locations.ts` so the mobile app
// mirrors the same region/city list (11 European regions). City `id`s are the
// lowercase slugs stored in `Contractor.city` on the backend.

export interface City {
  id: string; // e.g., 'berlin'
  name: string; // e.g., 'Berlin'
}

export interface Region {
  id: string; // e.g., 'germany'
  name: string; // e.g., 'Germany'
  cities: City[];
}

export const europeanRegions: Region[] = [
  {
    id: "austria",
    name: "Austria",
    cities: [
      { id: "vienna", name: "Vienna" },
      { id: "graz", name: "Graz" },
    ],
  },
  {
    id: "poland",
    name: "Poland",
    cities: [
      { id: "warsaw", name: "Warsaw" },
      { id: "krakow", name: "Kraków" },
      { id: "wroclaw", name: "Wrocław" },
      { id: "poznan", name: "Poznań" },
      { id: "lodz", name: "Łódź" },
      { id: "gdansk", name: "Gdańsk" },
      { id: "szczecin", name: "Szczecin" },
      { id: "katowice", name: "Katowice" },
      { id: "lublin", name: "Lublin" },
      { id: "bialystok", name: "Białystok" },
    ],
  },
  {
    id: "australia",
    name: "Australia",
    cities: [
      { id: "sydney", name: "Sydney" },
      { id: "melbourne", name: "Melbourne" },
      { id: "brisbane", name: "Brisbane" },
      { id: "perth", name: "Perth" },
      { id: "adelaide", name: "Adelaide" },
      { id: "gold_coast", name: "Gold Coast" },
      { id: "canberra", name: "Canberra" },
      { id: "newcastle", name: "Newcastle" },
      { id: "wollongong", name: "Wollongong" },
      { id: "logan_city", name: "Logan City" },
    ],
  },
  {
    id: "canada",
    name: "Canada",
    cities: [
      { id: "toronto", name: "Toronto" },
      { id: "montreal", name: "Montreal" },
      { id: "calgary", name: "Calgary" },
      { id: "ottawa", name: "Ottawa" },
      { id: "edmonton", name: "Edmonton" },
      { id: "mississauga", name: "Mississauga" },
      { id: "winnipeg", name: "Winnipeg" },
      { id: "vancouver", name: "Vancouver" },
      { id: "brampton", name: "Brampton" },
      { id: "hamilton", name: "Hamilton" },
      { id: "quebec_city", name: "Quebec City" },
      { id: "surrey", name: "Surrey" },
      { id: "laval", name: "Laval" },
      { id: "halifax", name: "Halifax" },
    ],
  },
  {
    id: "slovenia",
    name: "Slovenia",
    cities: [
      { id: "ljubljana", name: "Ljubljana" },
      { id: "maribor", name: "Maribor" },
      { id: "koper", name: "Koper" },
    ],
  },
  {
    id: "ireland",
    name: "Ireland",
    cities: [
      { id: "dublin", name: "Dublin" },
      { id: "cork", name: "Cork" },
      { id: "limerick", name: "Limerick" },
      { id: "galway", name: "Galway" },
    ],
  },
  {
    id: "germany",
    name: "Germany",
    cities: [
      { id: "berlin", name: "Berlin" },
      { id: "hamburg", name: "Hamburg" },
      { id: "munich", name: "Munich" },
      { id: "cologne", name: "Cologne" },
      { id: "frankfurt", name: "Frankfurt" },
      { id: "stuttgart", name: "Stuttgart" },
      { id: "dusseldorf", name: "Düsseldorf" },
      { id: "leipzig", name: "Leipzig" },
      { id: "dortmund", name: "Dortmund" },
      { id: "essen", name: "Essen" },
      { id: "bremen", name: "Bremen" },
      { id: "dresden", name: "Dresden" },
      { id: "hannover", name: "Hannover" },
      { id: "nuremberg", name: "Nuremberg" },
      { id: "duisburg", name: "Duisburg" },
      { id: "bochum", name: "Bochum" },
      { id: "wuppertal", name: "Wuppertal" },
      { id: "bielefeld", name: "Bielefeld" },
      { id: "bonn", name: "Bonn" },
      { id: "munster", name: "Münster" },
      { id: "mannheim", name: "Mannheim" },
      { id: "karlsruhe", name: "Karlsruhe" },
      { id: "augsburg", name: "Augsburg" },
    ],
  },
  {
    id: "france",
    name: "France",
    cities: [
      { id: "paris", name: "Paris" },
      { id: "marseille", name: "Marseille" },
      { id: "lyon", name: "Lyon" },
      { id: "toulouse", name: "Toulouse" },
      { id: "nice", name: "Nice" },
      { id: "nantes", name: "Nantes" },
      { id: "strasbourg", name: "Strasbourg" },
      { id: "montpellier", name: "Montpellier" },
      { id: "bordeaux", name: "Bordeaux" },
      { id: "lille", name: "Lille" },
    ],
  },
  {
    id: "spain",
    name: "Spain",
    cities: [
      { id: "canary_islands", name: "Canary Islands" },
      { id: "gran_canaria", name: "Gran Canaria" },
      { id: "lanzarote", name: "Lanzarote" },
      { id: "madrid", name: "Madrid" },
      { id: "barcelona", name: "Barcelona" },
      { id: "valencia", name: "Valencia" },
      { id: "seville", name: "Seville" },
      { id: "zaragoza", name: "Zaragoza" },
      { id: "malaga", name: "Málaga" },
      { id: "murcia", name: "Murcia" },
      { id: "bilbao", name: "Bilbao" },
      { id: "alicante", name: "Alicante" },
      { id: "cordoba", name: "Córdoba" },
      { id: "valladolid", name: "Valladolid" },
      { id: "vigo", name: "Vigo" },
      { id: "gijon", name: "Gijón" },
    ],
  },
  {
    id: "italy",
    name: "Italy",
    cities: [
      { id: "trieste", name: "Trieste" },
      { id: "venice", name: "Venice" },
      { id: "bologna", name: "Bologna" },
      { id: "rome", name: "Rome" },
      { id: "milan", name: "Milan" },
      { id: "naples", name: "Naples" },
      { id: "turin", name: "Turin" },
      { id: "palermo", name: "Palermo" },
      { id: "genoa", name: "Genoa" },
      { id: "florence", name: "Florence" },
      { id: "bari", name: "Bari" },
      { id: "catania", name: "Catania" },
      { id: "verona", name: "Verona" },
      { id: "messina", name: "Messina" },
      { id: "padua", name: "Padua" },
      { id: "brescia", name: "Brescia" },
      { id: "parma", name: "Parma" },
      { id: "prato", name: "Prato" },
      { id: "taranto", name: "Taranto" },
      { id: "modena", name: "Modena" },
      { id: "reggio_calabria", name: "Reggio Calabria" },
      { id: "reggio_emilia", name: "Reggio Emilia" },
      { id: "perugia", name: "Perugia" },
      { id: "livorno", name: "Livorno" },
      { id: "ravenna", name: "Ravenna" },
      { id: "cagliari", name: "Cagliari" },
      { id: "foggia", name: "Foggia" },
      { id: "rimini", name: "Rimini" },
      { id: "salerno", name: "Salerno" },
      { id: "ferrara", name: "Ferrara" },
      { id: "sassari", name: "Sassari" },
      { id: "latina", name: "Latina" },
      { id: "giugliano_in_campania", name: "Giugliano in Campania" },
    ],
  },
  {
    id: "united_kingdom",
    name: "United Kingdom",
    cities: [
      { id: "london", name: "London" },
      { id: "liverpool", name: "Liverpool" },
      { id: "birmingham", name: "Birmingham" },
      { id: "leeds", name: "Leeds" },
      { id: "glasgow", name: "Glasgow" },
      { id: "sheffield", name: "Sheffield" },
      { id: "manchester", name: "Manchester" },
      { id: "edinburgh", name: "Edinburgh" },
      { id: "bristol", name: "Bristol" },
      { id: "leicester", name: "Leicester" },
      { id: "coventry", name: "Coventry" },
      { id: "bradford", name: "Bradford" },
    ],
  },
];

// Accent-insensitive, case-insensitive token normalisation (matches backend
// `actions/available-locations.ts` normalizeToken).
export function normalizeToken(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

export const getRegionById = (regionId: string) =>
  europeanRegions.find((region) => region.id === regionId);

export const getCityById = (regionId: string, cityId: string) =>
  getRegionById(regionId)?.cities.find((city) => city.id === cityId);

export const getRegionIdByCityId = (cityId: string) =>
  europeanRegions.find((region) =>
    region.cities.some((city) => city.id === cityId)
  )?.id;

export const getLocationLabel = (regionId: string, cityId?: string) => {
  const region = getRegionById(regionId);
  if (!region) return "";

  const city = cityId ? getCityById(regionId, cityId) : undefined;
  return city ? `${city.name}, ${region.name}` : region.name;
};

// Resolve a location identifier (city id, region id, or already-readable name)
// to a human-readable name, e.g. "rome" -> "Rome". Falls back to the input.
export const getLocationDisplayName = (id: string): string => {
  if (!id) return "";

  const regionById = europeanRegions.find((region) => region.id === id);
  if (regionById) return regionById.name;

  const cityById = europeanRegions
    .flatMap((region) => region.cities)
    .find((city) => city.id === id);
  if (cityById) return cityById.name;

  const lower = normalizeToken(id);
  const cityByName = europeanRegions
    .flatMap((region) => region.cities)
    .find((city) => normalizeToken(city.name) === lower);
  if (cityByName) return cityByName.name;

  const regionByName = europeanRegions.find(
    (region) => normalizeToken(region.name) === lower
  );
  if (regionByName) return regionByName.name;

  return id;
};

export const getAllRegionOptions = () =>
  europeanRegions.map((region) => ({ value: region.id, label: region.name }));

export const getCityOptionsByRegion = (regionId: string) => {
  const region = europeanRegions.find((r) => r.id === regionId);
  return region
    ? region.cities.map((city) => ({ value: city.id, label: city.name }))
    : [];
};
