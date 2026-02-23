import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Product, Transaction } from "@/types/data";
import * as dataApi from "@/lib/dataApi";

const ONBOARDED_KEY = "catatjualan_onboarded";

const PRODUCTS_QUERY_KEY = ["products"];
const TRANSACTIONS_QUERY_KEY = ["transactions"];

export function useProducts() {
  const queryClient = useQueryClient();
  const { data: products = [], isLoading } = useQuery({
    queryKey: PRODUCTS_QUERY_KEY,
    queryFn: dataApi.fetchProducts,
  });

  const addProductMutation = useMutation({
    mutationFn: ({
      name,
      emoji,
      price,
      stock,
    }: { name: string; emoji: string; price: number; stock?: number | null }) =>
      dataApi.createProduct({ name, emoji, price, stock }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY }),
  });

  const deleteProductMutation = useMutation({
    mutationFn: dataApi.deleteProduct,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY }),
  });

  const updateProductMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Parameters<typeof dataApi.updateProduct>[1] }) =>
      dataApi.updateProduct(id, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY }),
  });

  const reduceStock = useCallback(
    async (productId: string, qty: number) => {
      const product = products.find((p) => p.id === productId);
      if (!product || product.stock === null || product.stock === undefined) return;
      await updateProductMutation.mutateAsync({
        id: productId,
        updates: { stock: Math.max(0, product.stock - qty) },
      });
    },
    [products, updateProductMutation]
  );

  const resetStock = useCallback(() => {
    // No-op when using API; optional bulk endpoint could be added later.
  }, []);

  const addProduct = useCallback(
    async (name: string, emoji: string, price: number, stock: number | null) => {
      await addProductMutation.mutateAsync({
        name: name.trim().slice(0, 50),
        emoji,
        price,
        stock: stock === 0 ? null : stock,
      });
    },
    [addProductMutation]
  );

  const deleteProduct = useCallback(
    async (productId: string) => {
      await deleteProductMutation.mutateAsync(productId);
    },
    [deleteProductMutation]
  );

  return {
    products,
    isLoading,
    setProducts: () => {},
    reduceStock,
    resetStock,
    addProduct,
    deleteProduct,
  };
}

export function useTransactions() {
  const queryClient = useQueryClient();
  const { data: transactions = [], isLoading } = useQuery({
    queryKey: TRANSACTIONS_QUERY_KEY,
    queryFn: dataApi.fetchTransactions,
  });

  const addTransactionMutation = useMutation({
    mutationFn: (tx: Omit<Transaction, "id" | "timestamp" | "date">) => dataApi.createTransaction(tx),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: TRANSACTIONS_QUERY_KEY }),
  });

  const today = new Date().toISOString().split("T")[0];
  const todayTransactions = transactions.filter((t) => t.date === today);
  const todaySales = todayTransactions.filter((t) => t.type === "sale").reduce((sum, t) => sum + t.amount, 0);
  const todayExpenses = todayTransactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);

  const addTransaction = useCallback(
    async (tx: Omit<Transaction, "id" | "timestamp" | "date">) => {
      await addTransactionMutation.mutateAsync(tx);
    },
    [addTransactionMutation]
  );

  return {
    transactions,
    todayTransactions,
    todaySales,
    todayExpenses,
    addTransaction,
    isLoading,
  };
}

export function useOnboarding() {
  const [done, setDone] = useState(
    () => typeof localStorage !== "undefined" && localStorage.getItem(ONBOARDED_KEY) === "true"
  );

  const complete = useCallback(() => {
    localStorage.setItem(ONBOARDED_KEY, "true");
    setDone(true);
  }, []);

  return { onboarded: done, completeOnboarding: complete };
}
