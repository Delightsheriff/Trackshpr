import { OrderStatus } from "@/src/components/home/home-types";

export type FilterKey = "all" | OrderStatus;

export const FILTER_TABS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "in_transit", label: "In Transit" },
  { key: "delivered", label: "Delivered" },
  { key: "failed", label: "Failed" },
];

export interface Order {
  id: string;
  orderId: string;
  item: string;
  customer: string;
  customerPhone: string;
  address: string;
  rider: string;
  riderPhone: string;
  amount: number;
  status: OrderStatus;
  riderToken: string;
  customerToken: string;
  createdAt: string;
  pickedUpAt: string | null;
  deliveredAt: string | null;
  failedAt: string | null;
  failureReason: string | null;
  pickedUpLocation: string | null;
  elapsedLabel: string;
}
