import React, { forwardRef } from "react";
import {
  StyleSheet,
  TextInput,
  type TextInputProps,
  View,
} from "react-native";

import { Text } from "./Text";

/** Brighter auth/form fields — border, fill, label, and input text read clearly on dark bg. */
const C = {
  label: "rgba(255,255,255,0.88)",
  inputText: "rgba(255,255,255,0.98)",
  placeholder: "rgba(255,255,255,0.55)",
  border: "rgba(255,255,255,0.38)",
  fill: "rgba(255,255,255,0.10)",
};

export type LabeledTextFieldProps = {
  label: string;
} & TextInputProps;

export const LabeledTextField = forwardRef<TextInput, LabeledTextFieldProps>(
  function LabeledTextField(
    { label, style, placeholderTextColor, ...rest },
    ref,
  ) {
    return (
      <View style={styles.wrap}>
        <Text mono style={styles.label}>
          {label}
        </Text>
        <TextInput
          ref={ref}
          {...rest}
          placeholderTextColor={placeholderTextColor ?? C.placeholder}
          selectionColor="rgba(255,45,170,0.9)"
          style={[styles.input, style]}
        />
      </View>
    );
  },
);

const styles = StyleSheet.create({
  wrap: {
    gap: 10,
  },
  label: {
    letterSpacing: 2,
    fontSize: 12,
    color: C.label,
  },
  input: {
    height: 54,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.fill,
    paddingHorizontal: 16,
    color: C.inputText,
    fontSize: 17,
  },
});
