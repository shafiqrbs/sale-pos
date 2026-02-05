import { useEffect, useState } from "react";
import { useNetwork } from "@mantine/hooks";
import { useGetSalesQuery } from "@services/sales";

export default function useSalesList({ params, offlineFetch = false } = {}) {
  const networkStatus = useNetwork();
  const shouldUseOffline = offlineFetch || !networkStatus.online;

  const {
    data: salesResponse,
    isLoading: isOnlineLoading,
    isFetching: isOnlineFetching,
    error: onlineError,
  } = useGetSalesQuery(params, {
    skip: shouldUseOffline
  });

  const [ localSales, setLocalSales ] = useState(null);
  const [ isLocalLoading, setIsLocalLoading ] = useState(false);
  const [ localError, setLocalError ] = useState(null);

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
    sales: salesResponse,
    isLoading: isOnlineLoading || isOnlineFetching,
    error: onlineError,
  };
}
