import React, { useEffect } from "react";
import Router from "next/router";
import { checkMaintenanceMode } from "../src/utils/serverSidePropsHelper";
import { getApiContent } from "../src/api-manage/getApiContent";
import { ensureDefaultLocationAndModule } from "../src/utils/defaultLocation";

const Root = () => {
  useEffect(() => {
    ensureDefaultLocationAndModule();
    const storedMod =
      (typeof window !== "undefined" &&
        (localStorage.getItem("selectedModuleIdentifier") ||
          JSON.parse(localStorage.getItem("module") || "null")?.slug)) ||
      "grocery";
    Router.replace(`/home?module=${storedMod}`);
  }, []);

  return null;
};

export default Root;

export const getServerSideProps = async (context) => {
  const { req } = context;
  const language = req.cookies.languageSetting;
  const selectedModule = req.cookies.selectedModule || "grocery";

  try {
    const configRes = await fetch(
      `${(process.env.NEXT_PUBLIC_BASE_URL || "").replace(/\/+$/, "")}/api/v1/config`,
      {
        method: "GET",
        headers: {
          "X-software-id": 33571750,
          "X-server": "server",
          "X-localization": language,
          origin: process.env.NEXT_CLIENT_HOST_URL,
        },
      },
    );
    const config = getApiContent(await configRes.json());

    if (checkMaintenanceMode(config)) {
      return {
        redirect: {
          destination: "/maintainance",
          permanent: false,
        },
      };
    }
  } catch (e) {
    // Fall through to redirect
  }

  return {
    redirect: {
      destination: `/home?module=${selectedModule}`,
      permanent: false,
    },
  };
};
