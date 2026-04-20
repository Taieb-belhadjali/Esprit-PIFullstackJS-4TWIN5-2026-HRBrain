import { useState, useEffect, useCallback, useRef } from 'react';
import API from '../../api/api';

/**
 * Generic data-fetching hook — eliminates duplicated loading/error/data state
 * across every view component.
 *
 * Features:
 * - Automatic fetch on mount (or when deps change)
 * - Deduplication: ignores stale responses when the component unmounts or deps change
 * - Manual refetch via the returned `refetch` function
 * - Consistent loading / error states
 *
 * Usage:
 *   const { data, loading, error, refetch } = useApi<Employee[]>('/users');
 *   const { data } = useApi<Skill[]>('/skills', { skip: !isReady });
 */
interface UseApiOptions {
  /** Set to true to skip the initial fetch (e.g. waiting for a required param) */
  skip?: boolean;
  /** Extra dependencies that trigger a re-fetch when they change */
  deps?: unknown[];
}

interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  /** Manually trigger a re-fetch */
  refetch: () => void;
}

export function useApi<T>(url: string, options: UseApiOptions = {}): UseApiResult<T> {
  const { skip = false, deps = [] } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(!skip);
  const [error, setError] = useState<string | null>(null);
  // Increment to trigger manual refetch
  const [tick, setTick] = useState(0);
  // Abort stale requests when url/deps change or component unmounts
  const abortRef = useRef<AbortController | null>(null);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (skip) {
      setLoading(false);
      return;
    }

    // Cancel any in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    API.get<T>(url, { signal: controller.signal })
      .then((res) => {
        if (!controller.signal.aborted) {
          setData(res.data);
          setError(null);
        }
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          setError(err?.response?.data?.message ?? err.message ?? 'Erreur réseau');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, skip, tick, ...deps]);

  return { data, loading, error, refetch };
}

/**
 * Parallel fetch hook — fires multiple GET requests simultaneously and
 * resolves when ALL complete. Reduces N sequential round-trips to 1 parallel batch.
 *
 * Usage:
 *   const { results, loading } = useApiParallel(['/skills', '/departments']);
 *   const [skills, departments] = results;
 */
interface UseApiParallelResult<T extends unknown[]> {
  results: { [K in keyof T]: T[K] | null };
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useApiParallel<T extends unknown[]>(
  urls: string[],
  options: UseApiOptions = {},
): UseApiParallelResult<T> {
  const { skip = false, deps = [] } = options;
  const [results, setResults] = useState<(unknown | null)[]>(urls.map(() => null));
  const [loading, setLoading] = useState(!skip);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (skip) { setLoading(false); return; }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    // Fire all requests in parallel — total time = slowest request, not sum of all
    Promise.all(
      urls.map((url) => API.get(url, { signal: controller.signal }).then((r) => r.data)),
    )
      .then((data) => {
        if (!controller.signal.aborted) {
          setResults(data);
          setError(null);
        }
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          setError(err?.response?.data?.message ?? err.message ?? 'Erreur réseau');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skip, tick, ...deps, urls.join(',')]);

  return {
    results: results as { [K in keyof T]: T[K] | null },
    loading,
    error,
    refetch,
  };
}
