import { Linking, Share } from "react-native";

export function callPhone(phone: string) {
  Linking.openURL("tel:" + phone.replace(/\s/g, ""));
}

export function copyLink(url: string) {
  Share.share({ message: url });
}

export function formatAmount(n: number) {
  return "₦" + n.toLocaleString("en-NG");
}

export function formatRelativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}
