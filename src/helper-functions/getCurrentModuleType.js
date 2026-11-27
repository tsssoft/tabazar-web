import { safeGetItem } from "../utils/safeStorage";

export const getCurrentModuleType = () => {
  if (typeof window === "undefined") return "grocery";
  const mod = safeGetItem("module");
  return mod?.module_type || "grocery";
};

export const getCurrentModuleId = () => {
  if (typeof window === "undefined") return 2;
  const mod = safeGetItem("module");
  return mod?.id || 2;
};
