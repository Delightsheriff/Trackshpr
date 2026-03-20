/**
 * In-progress order draft — shared between new-delivery steps and sub-modals.
 */
import { create } from "zustand";
import type { Customer, Rider } from "./dataStore";

interface OrderDraft {
  item: string;
  deliveryFee: string;
  notes: string;
  photoUri: string | null;
  customer: Customer | null;
  rider: Rider | null;
  directPhone: string;
}

interface OrderStoreState {
  draft: OrderDraft;
  setItem: (v: string) => void;
  setDeliveryFee: (v: string) => void;
  setNotes: (v: string) => void;
  setPhotoUri: (v: string | null) => void;
  setCustomer: (v: Customer | null) => void;
  setRider: (v: Rider | null) => void;
  setDirectPhone: (v: string) => void;
  reset: () => void;
}

const EMPTY: OrderDraft = {
  item: "", deliveryFee: "", notes: "",
  photoUri: null, customer: null, rider: null, directPhone: "",
};

export const useOrderStore = create<OrderStoreState>((set) => ({
  draft: EMPTY,
  setItem:         (item)        => set((s) => ({ draft: { ...s.draft, item } })),
  setDeliveryFee:  (deliveryFee) => set((s) => ({ draft: { ...s.draft, deliveryFee } })),
  setNotes:        (notes)       => set((s) => ({ draft: { ...s.draft, notes } })),
  setPhotoUri:     (photoUri)    => set((s) => ({ draft: { ...s.draft, photoUri } })),
  setCustomer:     (customer)    => set((s) => ({ draft: { ...s.draft, customer } })),
  setRider:        (rider)       => set((s) => ({ draft: { ...s.draft, rider, directPhone: rider ? "" : s.draft.directPhone } })),
  setDirectPhone:  (directPhone) => set((s) => ({ draft: { ...s.draft, directPhone, rider: directPhone ? null : s.draft.rider } })),
  reset:           ()            => set({ draft: EMPTY }),
}));
