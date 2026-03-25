/**
 * In-progress order draft — shared between new-delivery steps and sub-modals.
 */
import { create } from "zustand";
import type { Customer, Rider } from "./dataStore";

interface OrderDraft {
  item: string;
  deliveryFee: string;
  notes: string;
  photoUris: string[];
  customer: Customer | null;
  rider: Rider | null;
  directPhone: string;
}

interface OrderStoreState {
  draft: OrderDraft;
  setItem: (v: string) => void;
  setDeliveryFee: (v: string) => void;
  setNotes: (v: string) => void;
  addPhotoUri: (v: string) => void;
  removePhotoUri: (uri: string) => void;
  setCustomer: (v: Customer | null) => void;
  setRider: (v: Rider | null) => void;
  setDirectPhone: (v: string) => void;
  reset: () => void;
}

const EMPTY: OrderDraft = {
  item: "", deliveryFee: "", notes: "",
  photoUris: [], customer: null, rider: null, directPhone: "",
};

export const useOrderStore = create<OrderStoreState>((set) => ({
  draft: EMPTY,
  setItem:         (item)        => set((s) => ({ draft: { ...s.draft, item } })),
  setDeliveryFee:  (deliveryFee) => set((s) => ({ draft: { ...s.draft, deliveryFee } })),
  setNotes:        (notes)       => set((s) => ({ draft: { ...s.draft, notes } })),
  addPhotoUri:     (uri)         => set((s) => ({ draft: { ...s.draft, photoUris: [...s.draft.photoUris, uri] } })),
  removePhotoUri:  (uri)         => set((s) => ({ draft: { ...s.draft, photoUris: s.draft.photoUris.filter((u) => u !== uri) } })),
  setCustomer:     (customer)    => set((s) => ({ draft: { ...s.draft, customer } })),
  setRider:        (rider)       => set((s) => ({ draft: { ...s.draft, rider, directPhone: rider ? "" : s.draft.directPhone } })),
  setDirectPhone:  (directPhone) => set((s) => ({ draft: { ...s.draft, directPhone, rider: directPhone ? null : s.draft.rider } })),
  reset:           ()            => set({ draft: EMPTY }),
}));
