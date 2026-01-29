import { useState, useEffect } from "react";

export default function useLoadingProgress({ ms = 100 } = {}) {
    const [ isProgressing, setIsProgressing ] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsProgressing(false);
        }, ms);

        return () => clearTimeout(timer);
    }, [ ms ]);

    return { isProgressing, isProgressed: !isProgressing };
}
