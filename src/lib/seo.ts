export const KNOWN_STORES = [
  "Apotek Hjärtat SE",
  "Diamond Smile SE",
  "Dyson SE",
  "Homeroom SE",
  "Jotex SE",
  "Nelly SE",
  "NLY Man SE",
  "Outnorth SE",
  "Padel Market",
  "SharkNinja SE",
  "Rugvista SE",
  "Samsung SE",
  "Xiaomi SE",
];

export const STORE_SLUGS: Record<string, string> = {
  "Apotek Hjärtat SE": "apotek-hjartat",
  "Diamond Smile SE": "diamond-smile",
  "Dyson SE": "dyson",
  "Homeroom SE": "homeroom",
  "Jotex SE": "jotex",
  "Nelly SE": "nelly",
  "NLY Man SE": "nly-man",
  "Outnorth SE": "outnorth",
  "Padel Market": "padel-market",
  "SharkNinja SE": "sharkninja",
  "Rugvista SE": "rugvista",
  "Samsung SE": "samsung",
  "Xiaomi SE": "xiaomi",
};

export const SLUG_TO_STORE: Record<string, string> = Object.fromEntries(
  Object.entries(STORE_SLUGS).map(([store, slug]) => [slug, store])
);

export function slugifyCategory(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, " och ")
    .replace(/[^a-z0-9åäö]+/gi, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function formatStoreName(store: string): string {
  return store.replace(/\s+SE$/i, "").replace(/\s+EU$/i, "");
}
