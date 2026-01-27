import { useEffect, useState } from "react";
import { useNetwork } from "@mantine/hooks";
import { useGetSalesQuery } from "@services/sales";

export default function useSalesList({ params, offlineFetch = false } = {}) {
  const networkStatus = useNetwork();
  const shouldUseOffline = offlineFetch || !networkStatus.online;

  // =============== online query hook ================
  const {
    data: onlineSalesResponse,
    isLoading: isOnlineLoading,
    error: onlineError,
  } = useGetSalesQuery(params, { skip: shouldUseOffline });

  // =============== offline local data state ================
  const [ localSales, setLocalSales ] = useState(null);
  const [ isLocalLoading, setIsLocalLoading ] = useState(false);
  const [ localError, setLocalError ] = useState(null);

  // =============== fetch local data when offline or preferredMode is offline ================
  useEffect(() => {
    if (shouldUseOffline) {
      const fetchLocalSales = async () => {
        setIsLocalLoading(true);
        setLocalError(null);
        try {
          const salesData = await window.dbAPI.getDataFromTable("sales");
          setLocalSales(salesData);
        } catch (error) {
          console.error("Error fetching local sales:", error);
          setLocalError(error);
        } finally {
          setIsLocalLoading(false);
        }
      };

      fetchLocalSales();
    }
  }, [ shouldUseOffline ]);

  if (shouldUseOffline) {
    const offlineSalesResponse = localSales
      ? {
        status: 200,
        total: Array.isArray(localSales) ? localSales.length : 0,
        data: localSales,
      }
      : null;

    return {
      sales: offlineSalesResponse,
      isLoading: isLocalLoading,
      error: localError,
    };
  }

  return {
    sales: onlineSalesResponse,
    isLoading: isOnlineLoading,
    error: onlineError,
  };
}
