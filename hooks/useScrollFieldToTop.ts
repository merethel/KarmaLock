import { useCallback } from "react";
import { UIManager } from "react-native";
import type { ScrollView } from "react-native";

type Options = {
  scrollRef: React.RefObject<ScrollView | null>;
  /** Current ScrollView scrollY (contentOffset.y). */
  getScrollY: () => number;
  /** Desired Y position on screen for focused field. */
  getTopY: () => number;
};

/**
 * Scrolls the focused TextInput into view near the top of the ScrollView.
 */
export function useScrollFieldToTop({ scrollRef, getScrollY, getTopY }: Options) {
  return useCallback(
    (e: { target?: number } | unknown) => {
      const sv = scrollRef.current;
      if (!sv) return;

      const target =
        (e as any)?.nativeEvent?.target ??
        (e as any)?.target;
      const inputHandle = typeof target === "number" ? target : null;
      if (!inputHandle) return;

      // Measure on screen; then scroll by the delta so field lands at getTopY().
      UIManager.measureInWindow(inputHandle, (_x, y) => {
        const scrollY = Math.max(0, getScrollY());
        const topY = getTopY();
        const delta = y - topY;
        if (!Number.isFinite(delta)) return;
        sv.scrollTo({ y: Math.max(0, scrollY + delta), animated: true });
      });
    },
    [getScrollY, getTopY, scrollRef],
  );
}

