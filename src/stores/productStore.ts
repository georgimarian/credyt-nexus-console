import { create } from "zustand";
import { Product } from "@/data/types";
import { products as initialProducts } from "@/data/products";

interface ProductStore {
  products: Product[];
  addProduct: (product: Product) => void;
}

export const useProductStore = create<ProductStore>((set) => ({
  products: [...initialProducts],
  addProduct: (product) =>
    set((state) => ({ products: [product, ...state.products] })),
}));
