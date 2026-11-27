/**
 * Safe localStorage reader with JSON parsing and fallback support.
 * Prevents "Application error: a client-side exception has occurred"
 * caused by SyntaxError on undefined, null, or corrupted localStorage values.
 */

export const safeParseJson = (value, fallback = null) => {
  if (value == null) return fallback;
  const str = String(value).trim();
  if (!str || str === "undefined" || str === "null" || str === "NaN") {
    return fallback;
  }
  try {
    const parsed = JSON.parse(str);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
};

export const safeGetItem = (key, fallback = null) => {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return safeParseJson(raw, fallback);
  } catch {
    return fallback;
  }
};

export const safeGetModule = () => {
  return safeGetItem("module", {
    id: 2,
    module_name: "grocery",
    module_type: "grocery",
    slug: "grocery",
  });
};

export const safeGetLatLng = () => {
  return safeGetItem("currentLatLng", {
    lat: 23.94,
    lng: 89.0,
  });
};

export const safeGetZoneId = () => {
  const parsed = safeGetItem("zoneid", [2]);
  if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  if (typeof parsed === "number") return [parsed];
  return [2];
};
