import { BackButton } from "@/components/common_components/BackButton";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Animated, Image, StyleSheet, View } from "react-native";

export function BelongingHeroHeader({
  topInset,
  height,
  photoUri,
  blurOpacity,
  onBack,
}: {
  topInset: number;
  height: number;
  photoUri: string;
  blurOpacity: Animated.AnimatedInterpolation<string | number>;
  onBack: () => void;
}) {
  return (
    <>
      <View style={[styles.heroBg, { top: -topInset, height: height + topInset }]}>
        {photoUri ? (
          <Image
            source={{ uri: photoUri }}
            style={[styles.heroImage, { height: height + topInset }]}
          />
        ) : (
          <View style={[styles.heroPlaceholder, { height: height + topInset }]}>
            <Ionicons
              name="image-outline"
              size={34}
              color="rgba(255,255,255,0.25)"
            />
          </View>
        )}

        <Animated.View style={[styles.heroBlur, { opacity: blurOpacity }]}>
          <BlurView
            intensity={42}
            tint="dark"
            style={StyleSheet.absoluteFillObject}
          />
        </Animated.View>

        <LinearGradient
          colors={["rgba(0,0,0,0.00)", "rgba(0,0,0,0.80)"]}
          locations={[0.2, 1]}
          style={styles.heroFade}
        />
      </View>

      <View style={styles.heroTopLeft}>
        <BackButton onPress={onBack} topInset={topInset + 8} />
      </View>
    </>
  );
}

const CARD_BG = "rgba(255,255,255,0.06)";

const styles = StyleSheet.create({
  heroBg: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    overflow: "hidden",
    backgroundColor: CARD_BG,
  },
  heroImage: { width: "100%", height: "100%", resizeMode: "cover" },
  heroPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: CARD_BG,
  },
  heroBlur: {
    ...StyleSheet.absoluteFillObject,
  },
  heroFade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 220,
  },
  heroTopLeft: {
    position: "absolute",
    top: 0,
    left: 16,
    zIndex: 10,
  },
});

