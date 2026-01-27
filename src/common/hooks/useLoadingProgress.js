import { useState, useEffect } from "react";

export default function useLoadingProgress() {
    const [ progress, setProgress ] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setProgress((oldProgress) => Math.min(oldProgress + 15, 100));
        }, 100);

        return () => clearInterval(timer);
    }, []);

    return progress;
}
