/**
 * In-progress order draft — shared between new-delivery steps and sub-modals.
 */
import { create } from "zustand";
import type {
  Customer,
  CustomerAddress,
  Product,
  Rider,
} from "@/src/lib/supabaseQueries";

export interface SelectedOrderProduct {
  product_id: string;
  name: string;
  quantity: number;
  unit_price: number;
  unit: Product["unit"];
}

interface OrderDraft {
  item: string;
  deliveryFee: string;
  notes: string;
  photoUris: string[];
  customer: Customer | null;
  selectedAddress: CustomerAddress | null;
  addressInput: string;
  cityInput: string;
  rider: Rider | null;
  directPhone: string;
  products: SelectedOrderProduct[];
}

interface OrderStoreState {
  draft: OrderDraft;
  setItem: (v: string) => void;
  setDeliveryFee: (v: string) => void;
  setNotes: (v: string) => void;
  addPhotoUri: (v: string) => void;
  removePhotoUri: (uri: string) => void;
  setCustomer: (v: Customer | null) => void;
  setSelectedAddress: (v: CustomerAddress | null) => void;
  setAddressInput: (v: string) => void;
  setCityInput: (v: string) => void;
  setRider: (v: Rider | null) => void;
  setDirectPhone: (v: string) => void;
  upsertProduct: (product: Product, quantity: number) => void;
  updateProductQuantity: (productId: string, quantity: number) => void;
  removeProduct: (productId: string) => void;
  clearProducts: () => void;
  reset: () => void;
}

const EMPTY: OrderDraft = {
  item: "", deliveryFee: "", notes: "",
  photoUris: [],
  customer: null,
  selectedAddress: null,
  addressInput: "",
  cityInput: "",
  rider: null,
  directPhone: "",
  products: [],
};

export const useOrderStore = create<OrderStoreState>((set) => ({
  draft: EMPTY,
  setItem:         (item)        => set((s) => ({ draft: { ...s.draft, item } })),
  setDeliveryFee:  (deliveryFee) => set((s) => ({ draft: { ...s.draft, deliveryFee } })),
  setNotes:        (notes)       => set((s) => ({ draft: { ...s.draft, notes } })),
  addPhotoUri:     (uri)         => set((s) => ({ draft: { ...s.draft, photoUris: [...s.draft.photoUris, uri] } })),
  removePhotoUri:  (uri)         => set((s) => ({ draft: { ...s.draft, photoUris: s.draft.photoUris.filter((u) => u !== uri) } })),
  setCustomer:     (customer)    => set((s) => ({
    draft: {
      ...s.draft,
      customer,
      selectedAddress: null,
      addressInput: "",
      cityInput: "",
    },
  })),
  setSelectedAddress: (selectedAddress) => set((s) => ({
    draft: {
      ...s.draft,
      selectedAddress,
      addressInput: selectedAddress?.address ?? s.draft.addressInput,
      cityInput: selectedAddress?.city ?? s.draft.cityInput,
    },
  })),
  setAddressInput: (addressInput) => set((s) => ({ draft: { ...s.draft, addressInput, selectedAddress: null } })),
  setCityInput: (cityInput) => set((s) => ({ draft: { ...s.draft, cityInput, selectedAddress: null } })),
  setRider:        (rider)       => set((s) => ({ draft: { ...s.draft, rider, directPhone: rider ? "" : s.draft.directPhone } })),
  setDirectPhone:  (directPhone) => set((s) => ({ draft: { ...s.draft, directPhone, rider: directPhone ? null : s.draft.rider } })),
  upsertProduct: (product, quantity) =>
    set((s) => {
      const existing = s.draft.products.find((entry) => entry.product_id === product.id);
      const nextProducts =
        quantity <= 0
          ? s.draft.products.filter((entry) => entry.product_id !== product.id)
          : existing
            ? s.draft.products.map((entry) =>
                entry.product_id === product.id
                  ? { ...entry, quantity }
                  : entry,
              )
            : [
                ...s.draft.products,
                {
                  product_id: product.id,
                  name: product.name,
                  quantity,
                  unit_price: product.price,
                  unit: product.unit,
                },
              ];

      return { draft: { ...s.draft, products: nextProducts } };
    }),
  updateProductQuantity: (productId, quantity) =>
    set((s) => ({
      draft: {
        ...s.draft,
        products:
          quantity <= 0
            ? s.draft.products.filter((entry) => entry.product_id !== productId)
            : s.draft.products.map((entry) =>
                entry.product_id === productId
                  ? { ...entry, quantity }
                  : entry,
              ),
      },
    })),
  removeProduct: (productId) =>
    set((s) => ({
      draft: {
        ...s.draft,
        products: s.draft.products.filter((entry) => entry.product_id !== productId),
      },
    })),
  clearProducts: () => set((s) => ({ draft: { ...s.draft, products: [] } })),
  reset:           ()            => set({ draft: EMPTY }),
}));
