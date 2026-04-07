import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import Feather from "@expo/vector-icons/Feather";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Icon, Label, NativeTabs, VectorIcon } from "expo-router/unstable-native-tabs";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { font, gradients, shadowsLight, shadowsDark } from "@/src/constants/tokens";
import { useTheme } from "@/src/stores/themeStore";

const isIOS = process.env.EXPO_OS === "ios";
const isAndroid = process.env.EXPO_OS === "android";

// Native tab bar height in points (iOS 49, Android ~56)
const TAB_BAR_HEIGHT = isIOS ? 49 : 56;

export default function TabsLayout() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const fabShadow = isDark ? shadowsDark.fab : shadowsLight.fab;

  // Position FAB above the tab bar
  const fabBottom = TAB_BAR_HEIGHT + insets.bottom + 14;

  return (
    <View style={{ flex: 1 }}>
      <NativeTabs
        backBehavior="history"
        tintColor={colors.primary}
        iconColor={{ default: colors.textMuted, selected: colors.primary }}
        labelStyle={{
          default: {
            color: colors.textMuted,
            fontFamily: font.sans.regular,
            fontSize: 11,
            fontWeight: "400",
          },
          selected: {
            color: colors.primary,
            fontFamily: font.sans.semiBold,
            fontSize: 11,
            fontWeight: "600",
          },
        }}
        backgroundColor={isAndroid ? colors.surface : undefined}
        blurEffect={
          isIOS
            ? isDark
              ? "systemChromeMaterialDark"
              : "systemChromeMaterialLight"
            : undefined
        }
        shadowColor={isIOS ? colors.border : undefined}
        disableTransparentOnScrollEdge
        minimizeBehavior={isIOS ? "onScrollDown" : undefined}
        titlePositionAdjustment={isIOS ? { vertical: 2 } : undefined}
        rippleColor={isAndroid ? colors.primarySoft : undefined}
      >
        <NativeTabs.Trigger name="index">
          <Label>Home</Label>
          <Icon
            sf={{ default: "house", selected: "house.fill" }}
            androidSrc={{
              default: <VectorIcon family={MaterialCommunityIcons} name="home-outline" />,
              selected: <VectorIcon family={MaterialCommunityIcons} name="home" />,
            }}
          />
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="orders">
          <Label>Orders</Label>
          <Icon
            sf={{ default: "shippingbox", selected: "shippingbox.fill" }}
            androidSrc={{
              default: <VectorIcon family={MaterialCommunityIcons} name="package-variant-closed" />,
              selected: <VectorIcon family={MaterialCommunityIcons} name="package-variant" />,
            }}
          />
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="riders">
          <Label>Riders</Label>
          <Icon
            sf={{ default: "person.2", selected: "person.2.fill" }}
            androidSrc={{
              default: <VectorIcon family={MaterialCommunityIcons} name="account-group-outline" />,
              selected: <VectorIcon family={MaterialCommunityIcons} name="account-group" />,
            }}
          />
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="settings">
          <Label>Settings</Label>
          <Icon
            sf={{ default: "gearshape", selected: "gearshape.fill" }}
            androidSrc={{
              default: <VectorIcon family={MaterialCommunityIcons} name="cog-outline" />,
              selected: <VectorIcon family={MaterialCommunityIcons} name="cog" />,
            }}
          />
        </NativeTabs.Trigger>
      </NativeTabs>

      {/* New delivery FAB — floats above the native tab bar */}
      <View
        pointerEvents="box-none"
        style={[styles.fabWrap, { bottom: fabBottom }]}
      >
        <View
          style={[
            styles.fabShadow,
            {
              shadowColor:   fabShadow.shadowColor,
              shadowOffset:  fabShadow.shadowOffset,
              shadowOpacity: fabShadow.shadowOpacity,
              shadowRadius:  fabShadow.shadowRadius,
              elevation:     fabShadow.elevation,
            },
          ]}
        >
          <Pressable
            onPress={() => router.push("/(modals)/new-delivery")}
            android_ripple={{ color: "rgba(255,255,255,0.25)", borderless: false }}
            style={styles.fabPressable}
          >
            <LinearGradient
              colors={gradients.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.fab}
            >
              <Feather name="plus" size={22} color="#FFFFFF" />
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fabWrap: {
    position:   "absolute",
    alignSelf:  "center",
    pointerEvents: "box-none",
  },
  fabShadow: {
    borderRadius: 18,
  },
  fabPressable: {
    borderRadius: 18,
    overflow:     "hidden",
  },
  fab: {
    width:          52,
    height:         52,
    borderRadius:   18,
    alignItems:     "center",
    justifyContent: "center",
  },
});
