import { safeGetItem } from "../utils/safeStorage";

export const getLanguage = () => {
  if (typeof window === "undefined") return "ltr";
  const settings = safeGetItem("settings");
  return settings?.direction || "ltr";
};

export const getModule = () => {
  if (typeof window === "undefined") return null;
  return safeGetItem("module");
};
