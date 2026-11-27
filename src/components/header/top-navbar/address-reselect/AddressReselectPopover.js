import React, { useEffect, useState } from "react";
import {Button, CircularProgress, Popover, Stack, Typography, useTheme} from "@mui/material";
import toast from "react-hot-toast";

import SimpleBar from "simplebar-react";
import "simplebar-react/dist/simplebar.min.css";
import CustomAlert from "../../../alert/CustomAlert";
import { CustomButtonPrimary } from "styled-components/CustomButtons.style";
import DeliveryAddress from "../../../checkout/delivery-address";
import { useGeolocated } from "react-geolocated";
import ControlPointOutlinedIcon from "@mui/icons-material/ControlPointOutlined";
import useGetGeoCode from "../../../../api-manage/hooks/react-query/google-api/useGetGeoCode";
import useGetZoneId from "../../../../api-manage/hooks/react-query/google-api/useGetZone";
import dynamic from "next/dynamic";
const MapModal = dynamic(() => import("../../../Map/MapModal"));
const AddressReselectPopover = (props) => {
  const { anchorEl, onClose, open, t, address, setAddress, token, currentLatLngForMar, ...other } =
    props;
  const theme = useTheme();
  const [openMapModal, setOpenMapModal] = useState(false);
  const [location, setLocation] = useState(undefined);
  const [currentLocation, setCurrentLocation] = useState(undefined);
  const [showCurrentLocation, setShowCurrentLocation] = useState(false);
  const [geoLocationEnable, setGeoLocationEnable] = useState(false);
  const [zoneIdEnabled, setZoneIdEnabled] = useState(false);
  const { coords } = useGeolocated({
    positionOptions: {
      enableHighAccuracy: false,
    },
    userDecisionTimeout: 5000,
    isGeolocationEnabled: true,
  });

  const [loadingCurrentLocation, setLoadingCurrentLocation] = useState(false);

  const handleAgreeLocation = async () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      toast.error(t("Geolocation is not supported by your browser"));
      return;
    }

    setLoadingCurrentLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const newLatLng = { lat, lng };

          // 1. Query zone for these coordinates directly from backend API
          const zoneRes = await fetch(
            `${(process.env.NEXT_PUBLIC_BASE_URL || "").replace(/\/+$/, "")}/api/v1/config/get-zone-id?lat=${lat}&lng=${lng}`
          );
          const zoneJson = await zoneRes.json();
          const zoneContent = zoneJson?.content;

          if (!zoneContent?.zone_id) {
            toast.error(t("Sorry, we are not available in this area yet."));
            setLoadingCurrentLocation(false);
            return;
          }

          const zoneName =
            zoneContent?.zone_data?.[0]?.display_name ||
            zoneContent?.zone_data?.[0]?.name ||
            "Selected Location";

          // 2. Try to get formatted address from geocode API (if available)
          let resolvedAddress = zoneName;
          try {
            const geoRes = await fetch(
              `${(process.env.NEXT_PUBLIC_BASE_URL || "").replace(/\/+$/, "")}/api/v1/config/geocode-api?lat=${lat}&lng=${lng}`
            );
            const geoJson = await geoRes.json();
            const formatted = geoJson?.content?.results?.[0]?.formatted_address;
            if (formatted) {
              resolvedAddress = formatted;
            }
          } catch (e) {
            // Fallback to zoneName
          }

          // 3. Save to localStorage
          localStorage.setItem("zoneid", zoneContent.zone_id);
          localStorage.setItem("currentLatLng", JSON.stringify(newLatLng));
          localStorage.setItem("location", resolvedAddress);

          toast.success(t(`Location set to ${resolvedAddress}`));
          setLoadingCurrentLocation(false);
          onClose?.();
          window.location.reload();
        } catch (err) {
          console.error("Error setting current location:", err);
          toast.error(t("Failed to detect location. Please try again."));
          setLoadingCurrentLocation(false);
        }
      },
      (err) => {
        console.error("Geolocation error:", err);
        toast.error(t("Please allow location access in your browser"));
        setLoadingCurrentLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };
  const { data: geoCodeResults, isLoading: isLoadingGeoCode } = useGetGeoCode(
    location,
    geoLocationEnable
  );

  useEffect(() => {
    handleSetLocation();
  }, [currentLocation, location,address?.address]);
  useEffect(() => {
    if (geoCodeResults?.results && showCurrentLocation) {
      setCurrentLocation(geoCodeResults?.results?.[0]?.formatted_address);
    }
  }, [geoCodeResults, location]);

  const { data: zoneData } = useGetZoneId(location, zoneIdEnabled);

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (zoneData) {
        localStorage.setItem("zoneid", zoneData?.zone_id);
      }
    }
  }, [zoneData]);
  const handleCloseMapModal = () => {
    setOpenMapModal(false);
    onClose();
  };
  const popOverHeightHandler = () => {
    if (token) {
      return "475px";
    } else {
      return "150px";
    }
  };
  return (
    <>
      <Popover
        disableScrollLock={true}
        anchorEl={anchorEl}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
        keepMounted
        onClose={onClose}
        open={open}
        PaperProps={{
          sx: { width: { xs: 300, sm: 320, md: 350 }, p: "1rem" },
        }}
        transitionDuration={2}
        {...other}
      >
        <Stack justifyContent="center" textAlign="center" spacing={2}>
          <SimpleBar
            className="custom-scrollbar"
            style={{
              maxHeight: popOverHeightHandler(),
              paddingRight: "5px",
            }}
          >
            <Stack width="100%" alignItems="center">
              {token ? (
                open && (
                  <Stack
                    pt="15px"
                    gap={{ xs: "0px", sm: "15px" }}
                    paddingRight="5px"
                  >
                    <Typography
                      fontSize="16px"
                      fontWeight={500}
                      textAlign="left"
                    >
                      {t("Select from saved addresses or pick from map")}
                    </Typography>
                    <DeliveryAddress
                      setAddress={setAddress}
                      address={address}
                      hideAddressSelectionField="true"
                      renderOnNavbar="true"
                    />
                  </Stack>
                )
              ) : (
                <CustomAlert
                  type="info"
                  text={t(
                    "To select from saved addresses, you need to sign in."
                  )}
                />
              )}
            </Stack>
          </SimpleBar>
          <Button
            fullWidth
            disabled={loadingCurrentLocation}
            onClick={handleAgreeLocation}
            startIcon={
              loadingCurrentLocation ? (
                <CircularProgress size={18} sx={{ color: theme.palette.primary.main }} />
              ) : (
                <ControlPointOutlinedIcon sx={{ color: theme.palette.primary.main }} />
              )
            }
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 600,
              color: theme.palette.primary.main,
            }}
          >
            {loadingCurrentLocation ? t("Detecting location...") : t("Use Current Location")}
          </Button>
          <Stack width="100%" justifyContent="center" alignItems="center">
            <CustomButtonPrimary onClick={() => setOpenMapModal(true)}>
              {t("Pick from map")}
            </CustomButtonPrimary>
          </Stack>
        </Stack>
      </Popover>
      {openMapModal && (
        <MapModal open={openMapModal} handleClose={handleCloseMapModal}  selectedLocation={currentLatLngForMar}/>
      )}
    </>
  );
};

AddressReselectPopover.propTypes = {};

export default AddressReselectPopover;
