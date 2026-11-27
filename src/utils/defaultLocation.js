import { saveModuleParam } from "./moduleParamManager";

export const DEFAULT_ZONE_ID = "[2]";
export const DEFAULT_LOCATION_NAME = "Mirpur Zone, Dhaka";
export const DEFAULT_LAT_LNG = {
  lat: 23.94,
  lng: 89.0,
};
export const DEFAULT_MODULE = {
  id: 2,
  module_name: "grocery",
  module_type: "grocery",
  slug: "grocery",
};

/**
 * Initializes default location and module if not already set.
 * Behaves like Chaldal.com: users can browse all products immediately
 * under the default zone and location without an upfront location modal.
 */
export const ensureDefaultLocationAndModule = () => {
  if (typeof window === "undefined") return;

  try {
    // 1. Zone ID
    const zoneid = localStorage.getItem("zoneid");
    let hasValidZone = false;
    if (zoneid && zoneid !== "undefined" && zoneid !== "null") {
      try {
        const parsed = JSON.parse(zoneid);
        if (
          Array.isArray(parsed) &&
          parsed.length > 0 &&
          parsed.every((id) => !Number.isNaN(Number(id)))
        ) {
          hasValidZone = true;
        }
      } catch {
        hasValidZone = false;
      }
    }
    if (!hasValidZone) {
      localStorage.setItem("zoneid", DEFAULT_ZONE_ID);
    }

    // 2. Location name string
    const loc = localStorage.getItem("location");
    if (!loc || loc === "undefined" || loc === "null" || loc.trim() === "") {
      localStorage.setItem("location", DEFAULT_LOCATION_NAME);
    }

    // 3. Current Lat Lng
    const latLng = localStorage.getItem("currentLatLng");
    let hasValidLatLng = false;
    if (latLng && latLng !== "undefined" && latLng !== "null") {
      try {
        const parsedLatLng = JSON.parse(latLng);
        if (parsedLatLng?.lat && parsedLatLng?.lng) {
          hasValidLatLng = true;
        }
      } catch {
        hasValidLatLng = false;
      }
    }
    if (!hasValidLatLng) {
      localStorage.setItem("currentLatLng", JSON.stringify(DEFAULT_LAT_LNG));
    }

    // 4. Module
    const storedMod = localStorage.getItem("module");
    let hasValidModule = false;
    if (storedMod && storedMod !== "undefined" && storedMod !== "null") {
      try {
        const parsedMod = JSON.parse(storedMod);
        if (parsedMod && (parsedMod.slug || parsedMod.id)) {
          hasValidModule = true;
        }
      } catch {
        hasValidModule = false;
      }
    }
    if (!hasValidModule) {
      localStorage.setItem("module", JSON.stringify(DEFAULT_MODULE));
      saveModuleParam(DEFAULT_MODULE.id, DEFAULT_MODULE.slug);
    }
  } catch (err) {
    console.error("Error ensuring default location and module:", err);
  }
};
