import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface SaleProductEmployee {
  id: string;
  sale_id: string;
  product_id: string;
  employee_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  created_at: string;
  employee_name?: string;
  product_name?: string;
}

export const useSaleProductsEmployees = () => {
  const [data, setData] = useState<SaleProductEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = async () => {
    try {
      setLoading(true);
      const { data, error: err } = await supabase
        .from("sale_products_employees")
        .select("*")
        .order("created_at", { ascending: false });

      if (err) throw err;
      setData(data || []);
      setError(null);
    } catch (err: any) {
      setError(err);
      console.error("Erro ao carregar sale_products_employees:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch();
  }, []);

  return { data, loading, error, refetch: fetch };
};
