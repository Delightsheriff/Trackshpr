import { Link } from "expo-router";
import { ScrollView, Text } from "react-native";

export default function HomeScreen() {
  return (
    <ScrollView className="flex-1 bg-white dark:bg-zinc-900 px-6 py-8">
      <Text className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
        Welcome!
      </Text>
      <Text className="text-lg text-zinc-600 dark:text-zinc-400">
        This is the home page. Start building your app here.
      </Text>
      <Link
        href="/(auth)/sign-in"
        className="mt-4 text-blue-500 dark:text-blue-400 font-medium"
      >
        Go to Profile
      </Link>
      <Link
        href="/(auth)/profile-setup"
        className="mt-4 text-blue-500 dark:text-blue-400 font-medium"
      >
        Go to Profile set up
      </Link>
    </ScrollView>
  );
}
