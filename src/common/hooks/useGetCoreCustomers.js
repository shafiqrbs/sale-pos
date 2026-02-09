import { useState, useEffect } from "react";

export default function useGetCoreCustomers() {
  const [ customers, setCustomers ] = useState([]);
  const [ isLoading, setIsLoading ] = useState(false);
  const [ error, setError ] = useState(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const customers = await window.dbAPI.getDataFromTable("core-customers");
      setCustomers(customers);
    } catch (error) {
      setError(error);
    } finally {
      setIsLoading(false);
    }
  };

  return { coreCustomers: customers, isLoading, error };
}
