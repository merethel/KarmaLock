import { useEffect, useState } from "react";

/**
 * While `active`, counts down from `startFrom` to 0 on a 1s interval.
 * Resets when `active` becomes true again.
 */
export function useCountdown(active: boolean, startFrom: number): number {
  const [left, setLeft] = useState(startFrom);

  useEffect(() => {
    if (!active) {
      setLeft(startFrom);
      return;
    }
    setLeft(startFrom);
    let n = startFrom;
    const id = setInterval(() => {
      n -= 1;
      setLeft(Math.max(0, n));
      if (n <= 0) clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
  }, [active, startFrom]);

  return left;
}
