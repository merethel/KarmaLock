import { Button } from "@/components/common_components/Button";
import { Text } from "@/components/common_components/Text";
import Colors from "@/constants/Colors";
import { useI18n } from "@/src/i18n/context";
import type { TranslationKey } from "@/src/i18n/types";
import { setOnboardingComplete } from "@/src/onboarding/storage";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  useColorScheme,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const SLIDE_DEFS: readonly {
  icon: "lock" | "qrcode" | "shield" | "check-circle";
  title: TranslationKey;
  body: TranslationKey;
}[] = [
  {
    icon: "lock",
    title: "onboarding.protectTitle",
    body: "onboarding.protectBody",
  },
  {
    icon: "qrcode",
    title: "onboarding.scanTitle",
    body: "onboarding.scanBody",
  },
  {
    icon: "shield",
    title: "onboarding.verifyTitle",
    body: "onboarding.verifyBody",
  },
  {
    icon: "check-circle",
    title: "onboarding.readyTitle",
    body: "onboarding.readyBody",
  },
];

export default function OnboardingScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: windowHeight } = useWindowDimensions();
  const scheme = useColorScheme() ?? "dark";
  const theme = Colors[scheme];

  const scrollRef = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);
  /** Measured height of the flex middle (true center band between header + footer). */
  const [slideBandHeight, setSlideBandHeight] = useState(
    Math.max(360, Math.round(windowHeight * 0.52)),
  );

  const slides = useMemo(
    () =>
      SLIDE_DEFS.map((def) => ({
        ...def,
        titleText: t(def.title),
        bodyText: t(def.body),
      })),
    [t],
  );

  const textMaxWidth = Math.min(340, screenWidth - 48);

  const goToLogin = useCallback(async () => {
    await setOnboardingComplete();
    router.replace("/(auth)/login");
  }, [router]);

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const x = e.nativeEvent.contentOffset.x;
      const i = Math.round(x / screenWidth);
      if (i >= 0 && i < slides.length) setIndex(i);
    },
    [slides.length, screenWidth],
  );

  const goNext = () => {
    if (index < slides.length - 1) {
      scrollRef.current?.scrollTo({
        x: screenWidth * (index + 1),
        animated: true,
      });
    } else {
      void goToLogin();
    }
  };

  const isLast = index === slides.length - 1;

  const iconCardShadow =
    Platform.OS === "ios"
      ? {
          shadowColor: theme.tint,
          shadowOpacity: 0.4,
          shadowRadius: 28,
          shadowOffset: { width: 0, height: 10 },
        }
      : { elevation: 14 };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.background,
      }}
    >
      <View
        style={{
          paddingTop: insets.top + 8,
          paddingHorizontal: 20,
          paddingBottom: 8,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Text muted mono style={{ letterSpacing: 2, fontSize: 12 }}>
          {t("onboarding.brand")}
        </Text>
        <Pressable onPress={goToLogin} hitSlop={12}>
          <Text style={{ fontSize: 15, fontWeight: "700", color: theme.tint }}>
            {t("onboarding.skip")}
          </Text>
        </Pressable>
      </View>

      <View
        style={{ flex: 1 }}
        onLayout={(e) => {
          const h = Math.round(e.nativeEvent.layout.height);
          if (h > 0 && Math.abs(h - slideBandHeight) > 2) {
            setSlideBandHeight(h);
          }
        }}
      >
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
          decelerationRate="fast"
          keyboardShouldPersistTaps="handled"
          style={{ height: slideBandHeight }}
        >
          {slides.map((slide, i) => (
            <View
              key={i}
              style={{
                width: screenWidth,
                height: slideBandHeight,
                justifyContent: "center",
                alignItems: "center",
                paddingHorizontal: 28,
                overflow: "hidden",
              }}
            >
              <LinearGradient
                pointerEvents="none"
                colors={[
                  "rgba(255,45,170,0.14)",
                  "rgba(255,45,170,0.04)",
                  "transparent",
                ]}
                locations={[0, 0.35, 1]}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={StyleSheet.absoluteFill}
              />

              <View
                style={{
                  width: 104,
                  height: 104,
                  borderRadius: 34,
                  backgroundColor: "rgba(255,45,170,0.18)",
                  borderWidth: 1,
                  borderColor: "rgba(255,45,170,0.45)",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 28,
                  ...iconCardShadow,
                }}
              >
                <FontAwesome name={slide.icon} size={42} color={theme.tint} />
              </View>

              <View
                style={{
                  width: "100%",
                  maxWidth: textMaxWidth,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: 29,
                    fontWeight: "900",
                    letterSpacing: 0.2,
                    textAlign: "center",
                    lineHeight: 36,
                  }}
                >
                  {slide.titleText}
                </Text>

                <Text
                  dim
                  style={{
                    marginTop: 18,
                    fontSize: 17,
                    lineHeight: 26,
                    textAlign: "center",
                  }}
                >
                  {slide.bodyText}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>

      <View
        style={{
          paddingHorizontal: 24,
          paddingTop: 12,
          paddingBottom: insets.bottom + 16,
          gap: 14,
          borderTopWidth: 1,
          borderTopColor: "rgba(255,255,255,0.1)",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            gap: 8,
            marginBottom: 4,
          }}
        >
          {slides.map((_, i) => (
            <View
              key={i}
              style={{
                width: i === index ? 26 : 7,
                height: 7,
                borderRadius: 4,
                backgroundColor:
                  i === index ? theme.tint : "rgba(255,255,255,0.2)",
              }}
            />
          ))}
        </View>

        <Button
          title={isLast ? t("onboarding.getStarted") : t("onboarding.next")}
          onPress={goNext}
        />
      </View>
    </View>
  );
}
