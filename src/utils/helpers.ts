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
