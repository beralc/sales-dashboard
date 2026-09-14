import { useState, useEffect } from 'react'
import axios from 'axios'

/**
 * Fetch data for a panel, tracking loading and error state.
 *
 * Two things this exists to prevent, both of which showed up across every
 * panel that fetched on its own:
 *
 *  - A failed request used to be swallowed by `console.error`, leaving state
 *    null, which rendered identically to a genuine empty result. A panel could
 *    assert "no schools were lost" when in fact the request had failed.
 *
 *  - Nothing ignored superseded responses. Switching product A -> B -> A while
 *    a slow request was in flight could land B's data under A's heading, with
 *    loading already cleared.
 *
 * `params` is compared by value, so callers can pass an object literal without
 * re-fetching on every render.
 */
export function useApiData(url, params) {
  // `key` identifies the request these results belong to. Loading is derived
  // from it rather than set at the top of the effect, which keeps the effect
  // free of a synchronous setState and its extra render.
  const key = JSON.stringify({ url, params })
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState({ key: null, data: null, error: null })

  useEffect(() => {
    let cancelled = false
    const { url: reqUrl, params: reqParams } = JSON.parse(key)

    axios
      .get(reqUrl, { params: reqParams })
      .then((response) => {
        if (!cancelled) setResult({ key, data: response.data, error: null })
      })
      .catch((error) => {
        if (cancelled) return
        console.error(`Error fetching ${reqUrl}:`, error)
        setResult({ key, data: null, error })
      })

    return () => {
      cancelled = true
    }
  }, [key, attempt])

  const settled = result.key === key

  return {
    data: settled ? result.data : null,
    error: settled ? result.error : null,
    loading: !settled,
    retry: () => setAttempt((n) => n + 1)
  }
}
