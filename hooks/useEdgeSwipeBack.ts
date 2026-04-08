import { useMemo } from "react";
import { PanResponder, type GestureResponderEvent } from "react-native";

type Options = {
  /** Called when swipe-back should trigger. */
  onBack: () => void;
  /** Only begin gesture if started within this many px from left edge. */
  edgeWidth?: number;
  /** Min horizontal distance (px) to trigger back. */
  dxThreshold?: number;
  /** Min horizontal velocity to trigger back. */
  vxThreshold?: number;
  /** If true, disables the responder (returns empty handlers). */
  disabled?: boolean;
  /** Optional guard to prevent double-dismiss. */
  canGoBack?: () => boolean;
};

export function useEdgeSwipeBack({
  onBack,
  edgeWidth = 60,
  dxThreshold = 80,
  vxThreshold = 0.2,
  disabled = false,
  canGoBack,
}: Options) {
  return useMemo(() => {
    if (disabled) return { panHandlers: {} as const };

    return PanResponder.create({
      onMoveShouldSetPanResponder: (
        evt: GestureResponderEvent,
        gesture,
      ): boolean => {
        // Only allow "back swipe" from the left edge.
        const startX = evt.nativeEvent.pageX;
        if (startX > edgeWidth) return false;

        const dx = gesture.dx;
        const dy = gesture.dy;
        // Horizontal intent only.
        if (Math.abs(dx) < 10) return false;
        if (Math.abs(dy) > Math.abs(dx)) return false;
        return dx > 0;
      },
      onPanResponderRelease: (_evt, gesture) => {
        if (canGoBack && !canGoBack()) return;
        if (gesture.dx > dxThreshold && gesture.vx > vxThreshold) onBack();
      },
    });
  }, [canGoBack, disabled, dxThreshold, edgeWidth, onBack, vxThreshold]);
}

