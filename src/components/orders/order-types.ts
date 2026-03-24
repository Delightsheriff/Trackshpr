import { OrderStatus } from "@/src/components/home/home-types";

export type FilterKey = "all" | OrderStatus;

export const FILTER_TABS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "in_transit", label: "In Transit" },
  { key: "delivered", label: "Delivered" },
  { key: "failed", label: "Failed" },
];

export const DUMMY_ORDERS_FULL: {
  id: string;
  item: string;
  customer: string;
  area: string;
  status: OrderStatus;
  time: string;
}[] = [
  { id: "1", item: "Adire Maxi Dress × 2", customer: "Amara Obi", area: "Lekki", status: "in_transit", time: "12m" },
  { id: "2", item: "Ankara Tote Bag", customer: "Tunde Bello", area: "Yaba", status: "pending", time: "34m" },
  { id: "3", item: "Beaded Necklace Set", customer: "Chisom Eze", area: "Surulere", status: "delivered", time: "1h" },
  { id: "4", item: "Silk Scarf (Red)", customer: "Bisi Adeyemi", area: "Ikeja", status: "failed", time: "3h" },
  { id: "5", item: "Kente Wrap Skirt", customer: "Ngozi Obi", area: "VI", status: "delivered", time: "4h" },
];

export const DUMMY_ORDERS_DETAIL = [
  {
    id: "1",
    orderId: "TRK-2847",
    item: "Adire Maxi Dress × 2",
    customer: "Amara Obi",
    customerPhone: "0801 234 5678",
    address: "14 Admiralty Way, Lekki Phase 1",
    rider: "Kunle Adeyemi",
    riderPhone: "0803 456 7890",
    amount: 35000,
    status: "in_transit" as OrderStatus,
    riderToken: "a1b2c3d4",
    customerToken: "e5f6g7h8",
    createdAt: "10:58 AM",
    pickedUpAt: "11:34 AM",
    pickedUpLocation: "Yaba, Lagos",
    failureReason: null as string | null,
    deliveredAt: null as string | null,
    failedAt: null as string | null,
    elapsedLabel: "12m ago",
  },
  {
    id: "2",
    orderId: "TRK-2831",
    item: "Beaded Necklace Set",
    customer: "Chisom Eze",
    customerPhone: "0812 111 2233",
    address: "5 Bode Thomas, Surulere",
    rider: "Emeka Musa",
    riderPhone: "0812 345 6789",
    amount: 18500,
    status: "delivered" as OrderStatus,
    riderToken: "b2c3d4e5",
    customerToken: "f6g7h8i9",
    createdAt: "10:48 AM",
    pickedUpAt: "11:02 AM",
    deliveredAt: "12:26 PM",
    failureReason: null,
    failedAt: null,
    pickedUpLocation: "Yaba, Lagos",
    elapsedLabel: "1h 24m total",
  },
  {
    id: "3",
    orderId: "TRK-2819",
    item: "Silk Scarf (Red)",
    customer: "Bisi Adeyemi",
    customerPhone: "0705 432 1098",
    address: "10 Allen Ave, Ikeja",
    rider: "Taiwo James",
    riderPhone: "0701 234 5678",
    amount: 22000,
    status: "failed" as OrderStatus,
    riderToken: "c3d4e5f6",
    customerToken: "g7h8i9j0",
    createdAt: "9:14 AM",
    pickedUpAt: "9:48 AM",
    failedAt: "10:55 AM",
    failureReason: "Customer not available",
    deliveredAt: null,
    pickedUpLocation: "Yaba, Lagos",
    elapsedLabel: "3h ago",
  },
];

export type Order = (typeof DUMMY_ORDERS_DETAIL)[0];
