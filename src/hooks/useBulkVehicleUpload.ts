import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "./use-toast";

interface VehicleRow {
  vehicle: string;
  plate: string;
}

export const useBulkVehicleUpload = () => {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);

  const parseCSV = (content: string): VehicleRow[] => {
    const lines = content.trim().split("\n");
    if (lines.length < 2) {
      throw new Error("O arquivo deve conter cabeçalho e pelo menos uma linha de dados");
    }

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const vehicleIndex = headers.indexOf("vehicle");
    const plateIndex = headers.indexOf("plate");

    if (vehicleIndex === -1 || plateIndex === -1) {
      throw new Error("O CSV deve conter as colunas 'vehicle' e 'plate'");
    }

    const vehicles: VehicleRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = line.split(",").map((v) => v.trim());
      vehicles.push({
        vehicle: values[vehicleIndex] || "",
        plate: values[plateIndex] || "",
      });
    }

    if (vehicles.length === 0) {
      throw new Error("Nenhum veículo encontrado no arquivo");
    }

    return vehicles;
  };

  const uploadVehicles = async (clientId: string, file: File): Promise<number> => {
    setUploading(true);
    try {
      const content = await file.text();
      const vehicles = parseCSV(content);

      // Validar dados
      const invalidVehicles = vehicles.filter((v) => !v.vehicle.trim() || !v.plate.trim());
      if (invalidVehicles.length > 0) {
        throw new Error(
          `${invalidVehicles.length} linha(s) com dados incompletos. Verifique veículo e placa.`
        );
      }

      // Deletar veículos antigos do cliente (atualizar lista)
      const { error: deleteError } = await supabase
        .from("client_vehicles")
        .delete()
        .eq("client_id", clientId);

      if (deleteError) throw deleteError;

      // Inserir novos veículos
      const vehiclesToInsert = vehicles.map((v, idx) => ({
        client_id: clientId,
        vehicle: v.vehicle,
        plate: v.plate.toUpperCase(),
        is_national: true,
        is_primary: idx === 0, // Primeiro veículo é primário
      }));

      const { error: insertError, data } = await supabase
        .from("client_vehicles")
        .insert(vehiclesToInsert)
        .select();

      if (insertError) throw insertError;

      return data?.length || 0;
    } catch (error: any) {
      console.error("Erro ao fazer upload em massa:", error);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  return {
    uploadVehicles,
    uploading,
  };
};
