import { useState, useEffect } from "react";

export default function useTransactionMode() {
    const [ transactionMode, setTransactionMode ] = useState([]);
    const [ isLoading, setIsLoading ] = useState(false);
    const [ error, setError ] = useState(null);

    useEffect(() => {
        fetchTransactionMode();
    }, []);

    const fetchTransactionMode = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await window.dbAPI.getDataFromTable("accounting_transaction_mode");
            setTransactionMode(data);
        } catch (error) {
            setError(error);
        } finally {
            setIsLoading(false);
        }
    };

    return { transactionMode, isLoading, error };
}