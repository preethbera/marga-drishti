import { useState, useEffect } from 'react';
import { useUiStore } from '@core/store/useUiStore';

export function useAnalyticsQuery(queryFn, dependencies = [], options = { useGlobalLoader: false }) {
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const setGlobalLoading = useUiStore(state => state.setIsLoading);

    useEffect(() => {
        let isMounted = true;
        
        async function load() {
            try {
                setIsLoading(true);
                if (options.useGlobalLoader) setGlobalLoading(true);
                
                const result = await queryFn();
                
                if (isMounted) {
                    setData(result);
                    setError(null);
                }
            } catch (err) {
                if (isMounted) setError(err);
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                    if (options.useGlobalLoader) setGlobalLoading(false);
                }
            }
        }
        
        load();
        
        return () => { 
            isMounted = false; 
            if (options.useGlobalLoader) setGlobalLoading(false);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, dependencies);

    return { data, isLoading, error };
}
