import { useEffect, useState } from "react";
import { Keyboard, Platform } from "react-native";

/**
 * Returns the keyboard height (bottom inset) when visible, otherwise 0.
 * Useful for adding extra ScrollView padding so bottom content stays visible.
 */
export function useKeyboardBottomInset(): number {
  const [h, setH] = useState(0);

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const subShow = Keyboard.addListener(showEvent, (e) => {
      const height = e.endCoordinates?.height ?? 0;
      setH(height);
    });
    const subHide = Keyboard.addListener(hideEvent, () => setH(0));

    return () => {
      subShow.remove();
      subHide.remove();
    };
  }, []);

  return h;
}

