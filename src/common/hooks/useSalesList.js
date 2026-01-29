import { useEffect, useState } from "react";
import { useNetwork } from "@mantine/hooks";
import { useGetSalesQuery } from "@services/sales";

function filterSalesByTab(activeTab, salesResponse) {
  if (!salesResponse?.data?.length) {
    return salesResponse ? { ...salesResponse, data: [] } : salesResponse;
  }

  const salesItems = salesResponse.data;
  const currentDate = new Date();

  if (activeTab === "today") {
    const todaysSales = salesItems.filter((salesItem) => {
      if (!salesItem.created) return false;
      const [ day, month, year ] = salesItem.created.split("-");
      const itemDate = new Date(Number(year), Number(month) - 1, Number(day));
      return (
        itemDate.getDate() === currentDate.getDate() &&
        itemDate.getMonth() === currentDate.getMonth() &&
        itemDate.getFullYear() === currentDate.getFullYear()
      );
    });

    return {
      ...salesResponse,
      total: todaysSales.length,
      data: todaysSales,
    };
  }

  if (activeTab === "week") {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    return {
      ...salesResponse,
      data: salesItems.filter((salesItem) => {
        if (!salesItem.created) return false;
        const [ day, month, year ] = salesItem.created.split("-");
        const itemDate = new Date(Number(year), Number(month) - 1, Number(day));
        return itemDate >= startOfWeek && itemDate <= endOfWeek;
      }),
    };
  }

  if (activeTab === "month") {
    return {
      ...salesResponse,
      data: salesItems.filter((salesItem) => {
        if (!salesItem.created) return false;
        const [ day, month, year ] = salesItem.created.split("-");
        const itemDate = new Date(Number(year), Number(month) - 1, Number(day));
        return (
          itemDate.getMonth() === currentDate.getMonth() &&
          itemDate.getFullYear() === currentDate.getFullYear()
        );
      }),
    };
  }

  if (activeTab === "cash") {
    return {
      ...salesResponse,
      data: salesItems.filter((salesItem) => salesItem.mode_name?.toLowerCase() === "cash"),
    };
  }

  if (activeTab === "discount_type") {
    return {
      ...salesResponse,
      data: salesItems.filter(
        (salesItem) => salesItem.discount_type?.toLowerCase() === "flat"
      ),
    };
  }

  // default: all, but ensure we always return the same shape
  return {
    ...salesResponse,
    data: salesItems,
  };
}

export default function useSalesList({ params, offlineFetch = false, activeTab } = {}) {
  const networkStatus = useNetwork();
  const shouldUseOffline = offlineFetch || !networkStatus.online;

  // =============== online query hook ================
  const {
    data: onlineSalesResponse,
    isLoading: isOnlineLoading,
    isFetching: isOnlineFetching,
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

    const filteredOfflineSalesResponse = filterSalesByTab(activeTab, offlineSalesResponse);

    return {
      sales: filteredOfflineSalesResponse,
      isLoading: isLocalLoading,
      error: localError,
    };
  }

  const filteredOnlineSalesResponse = filterSalesByTab(activeTab, onlineSalesResponse);

  return {
    sales: filteredOnlineSalesResponse,
    isLoading: isOnlineLoading || isOnlineFetching,
    error: onlineError,
  };
}
