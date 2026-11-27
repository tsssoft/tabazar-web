import React, { useEffect } from "react";
import { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import { setSelectedModule } from "redux/slices/utils";
import useGetModule from "api-manage/hooks/react-query/useGetModule";
import toast from "react-hot-toast";
import { setModules } from "redux/slices/configData";
import { getSavedModuleIdentifier, saveModuleParam } from "../../utils/moduleParamManager";
import { safeGetItem, safeParseJson } from "../../utils/safeStorage";

// Whether the module currently in localStorage IS the one the URL asks for
// (matched loosely by slug/module_type/id, same as the resolver below).
const storedModuleMatchesUrl = (identifier, storedModule) => {
  if (!storedModule) return false;
  const idStr = String(identifier).toLowerCase();
  return (
    String(storedModule?.slug || "").toLowerCase() === idStr ||
    String(storedModule?.module_type || "").toLowerCase() === idStr ||
    String(storedModule?.id || "") === idStr
  );
};

const ModuleChecker = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const { data, refetch } = useGetModule();
  const selectedModuleInRedux = useSelector(
    (state) => state.utilsData?.selectedModule
  );

  // Sync Storage -> URL (keep module param on every route)
  useEffect(() => {
    if (!router.isReady || typeof window === "undefined") return;

    const moduleFromUrl = router.query.module;
    const legacyModuleId = router.query.module_id;

    const storedModule = safeGetItem("module");
    const storedIdentifier =
      getSavedModuleIdentifier() ||
      storedModule?.slug ||
      storedModule?.id;

    const identifierToUse = moduleFromUrl || legacyModuleId || storedIdentifier;

    if (!identifierToUse) return;

    // Hydrate redux if missing
    if (!selectedModuleInRedux && storedModule) {
      dispatch(setSelectedModule(storedModule));
    }

    // Add module if missing, and/or remove legacy module_id
    if (!moduleFromUrl || legacyModuleId) {
      const { module_id: _legacy, ...restQuery } = router.query;
      router.replace(
        {
          pathname: router.pathname,
          query: { ...restQuery, module: String(identifierToUse) },
        },
        undefined,
        { shallow: true, scroll: false }
      );
    }
  }, [router.isReady, router.asPath]);

  // Sync URL -> Storage
  useEffect(() => {
    const moduleIdFromUrl = router.query.module || router.query.module_id;
    if (!moduleIdFromUrl) return;

    const storedModule = safeGetItem("module");
    if (!storedModuleMatchesUrl(moduleIdFromUrl, storedModule)) {
      refetch();
    }
  }, [router.query.module, router.query.module_id, refetch]);

  useEffect(() => {
    const moduleIdFromUrl = router.query.module || router.query.module_id;
    const storedModule = safeGetItem("module");
    const alreadyMatches = storedModuleMatchesUrl(moduleIdFromUrl, storedModule);

    if (data && moduleIdFromUrl && !alreadyMatches) {
      const moduleIdStr = String(moduleIdFromUrl).toLowerCase();
      const selectedModule = data.find(
        (item) =>
          String(item?.slug || "").toLowerCase() === moduleIdStr ||
          String(item?.module_type || "").toLowerCase() === moduleIdStr ||
          String(item?.id || "") === moduleIdStr
      );
      if (selectedModule) {
        localStorage.setItem("module", JSON.stringify(selectedModule));
        saveModuleParam(selectedModule?.id, selectedModule?.slug);
        dispatch(setSelectedModule(selectedModule));
      } else {
        // Fallback gracefully to grocery or first available module
        const fallbackModule =
          data.find((m) => m?.slug === "grocery" || m?.module_type === "grocery") ||
          data[0];
        if (fallbackModule) {
          localStorage.setItem("module", JSON.stringify(fallbackModule));
          saveModuleParam(fallbackModule?.id, fallbackModule?.slug);
          dispatch(setSelectedModule(fallbackModule));
        }
        router.replace(
          { pathname: "/home", query: { module: fallbackModule?.slug || "grocery" } },
          undefined,
          { shallow: true }
        );
      }
    } else if (alreadyMatches && !selectedModuleInRedux && storedModule) {
      dispatch(setSelectedModule(storedModule));
    }
  }, [data, router.query.module, router.query.module_id, selectedModuleInRedux, dispatch]);

  return null;
};

export default ModuleChecker;
