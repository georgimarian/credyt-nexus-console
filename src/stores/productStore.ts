import { create } from "zustand";
import { Product, Price } from "@/data/types";
import { products as initialProducts } from "@/data/products";

interface ProductStore {
  products: Product[];
  addProduct: (product: Product) => void;
  addPriceToProduct: (productId: string, price: Price) => void;
}

export const useProductStore = create<ProductStore>((set) => ({
  products: [...initialProducts],
  addProduct: (product) =>
    set((state) => ({ products: [product, ...state.products] })),
  addPriceToProduct: (productId, price) =>
    set((state) => ({
      products: state.products.map((p) =>
        p.id === productId ? { ...p, prices: [...p.prices, price] } : p
      ),
    })),
}));
