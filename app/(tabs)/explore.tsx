import { ScrollView, Text } from "react-native";

export default function ExploreScreen() {
  return (
    <ScrollView className="flex-1 bg-white dark:bg-zinc-900 px-6 py-8">
      <Text className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
        Explore
      </Text>
      <Text className="text-lg text-zinc-600 dark:text-zinc-400">
        Discover more features and content here.
      </Text>
    </ScrollView>
  );
}
