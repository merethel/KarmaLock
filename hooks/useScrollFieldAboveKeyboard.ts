import { useCallback } from "react";
import { Dimensions, UIManager } from "react-native";
import type { ScrollView } from "react-native";

type Options = {
  scrollRef: React.RefObject<ScrollView | null>;
  /** Current ScrollView scrollY (contentOffset.y). */
  getScrollY: () => number;
  /** Keyboard height (0 when hidden). */
  keyboardHeight: number;
  /** Extra space between field and keyboard. */
  gap?: number;
};

/**
 * On focus, scrolls just enough so the focused field sits above the keyboard.
 * (Does not force the field to the top.)
 */
export function useScrollFieldAboveKeyboard({
  scrollRef,
  getScrollY,
  keyboardHeight,
  gap = 14,
}: Options) {
  return useCallback(
    (e: unknown) => {
      const sv = scrollRef.current;
      if (!sv) return;

      const target = (e as any)?.nativeEvent?.target ?? (e as any)?.target;
      const inputHandle = typeof target === "number" ? target : null;
      if (!inputHandle) return;

      // If keyboard isn't visible, no-op.
      if (!keyboardHeight) return;

      const screenH = Dimensions.get("window").height;
      const keyboardTop = screenH - keyboardHeight;

      UIManager.measureInWindow(inputHandle, (_x, y, _w, h) => {
        const bottom = y + h;
        const desiredBottom = keyboardTop - gap;

        // Already fully visible above keyboard.
        if (bottom <= desiredBottom) return;

        const delta = bottom - desiredBottom;
        const scrollY = Math.max(0, getScrollY());
        sv.scrollTo({ y: Math.max(0, scrollY + delta), animated: true });
      });
    },
    [gap, getScrollY, keyboardHeight, scrollRef],
  );
}

