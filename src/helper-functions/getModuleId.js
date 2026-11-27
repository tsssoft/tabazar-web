import { safeGetItem } from "../utils/safeStorage";

export const getModuleId = () => {
  if (typeof window === "undefined") return 2;
  const mod = safeGetItem("module");
  return mod?.id || 2;
};
