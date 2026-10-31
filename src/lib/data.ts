import eventsData from "@/data/events.json";
import countriesData from "@/data/countries.json";
import assetCategoriesData from "@/data/asset-categories.json";
import metaData from "@/data/meta.json";
import type {
  AssetCategory,
  Country,
  DataMeta,
  EventCategory,
  StockEvent,
} from "@/types/event";

export const EVENTS = eventsData as StockEvent[];
export const COUNTRIES = countriesData as Country[];
export const ASSET_CATEGORIES = assetCategoriesData as AssetCategory[];
export const META = metaData as DataMeta;

export const countryByCode: Record<string, Country> = Object.fromEntries(
  COUNTRIES.map((c) => [c.code, c])
);

export const eventById: Record<string, StockEvent> = Object.fromEntries(
  EVENTS.map((e) => [e.id, e])
);

export const assetCategoryById: Record<string, AssetCategory> = Object.fromEntries(
  ASSET_CATEGORIES.map((a) => [a.id, a])
);

export const REGIONS: string[] = [...new Set(COUNTRIES.map((c) => c.region))];

export const CATEGORY_LABEL: Record<EventCategory, string> = {
  "seasonal-holiday": "Seasonal Holiday",
  shopping: "Shopping Event",
  cultural: "Cultural Occasion",
  religious: "Religious Occasion",
  awareness: "Awareness Day",
  education: "Education",
  business: "Business",
  celebration: "Celebration",
  sports: "Sports Event",
};

export const CATEGORY_COLOR: Record<EventCategory, string> = {
  "seasonal-holiday": "#2F9E6E",
  shopping: "#D6A84F",
  cultural: "#7B6FD0",
  religious: "#4D8DCE",
  awareness: "#E06FA8",
  education: "#3AA7A3",
  business: "#8B95AB",
  celebration: "#E07856",
  sports: "#5B8DEF",
};

export const CONTACT = {
  name: "Md Sonet Mia",
  whatsappDisplay: "01797953059",
  whatsappLink: "https://wa.me/8801797953059",
};
