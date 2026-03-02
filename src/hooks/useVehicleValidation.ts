import { useState } from "react";
import { validateVehicleOffline } from "@/data/vehicles";

export interface VehicleValidationResult {
  isNational: boolean;
  brand: string;
  model: string;
  year: string;
  confidence: number;
  message: string;
}

export const useVehicleValidation = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateVehicle = async (
    vehicleInput: string
  ): Promise<VehicleValidationResult | null> => {
    if (!vehicleInput.trim()) {
      setError("Por favor, insira um veículo");
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

      if (!apiKey) {
        setError("Chave de API não configurada. Adicione VITE_GEMINI_API_KEY no .env");
        console.error("API Key não encontrada");
        return null;
      }

      console.log("🤖 Validando com IA:", vehicleInput);

      // Tenta apenas modelo mais novo
      const model = "gemini-2.0-flash";
      console.log(`Tentando modelo: ${model}`);

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `Você é um especialista em veículos brasileiros. Analise este nome de carro e classifique como NACIONAL ou IMPORTADO. Responda APENAS em JSON.

Veículo: "${vehicleInput}"

Responda em JSON:
{
  "brand": "marca",
  "model": "modelo",
  "year": "ano ou 'desconhecido'",
  "isNational": true/false,
  "confidence": 0.0-1.0,
  "message": "explicação"
}

NACIONAIS: Fiat, VW, Chevrolet, Hyundai, Renault, Peugeot, Citroën, Chery, JAC, Toyota (Etios, Yaris, Hilux, SW4)
IMPORTADOS: Honda, Nissan, Toyota (Corolla, Camry), Mitsubishi, Suzuki, Kia, BMW, Mercedes, Audi, Porsche, Lamborghini, Ferrari, Lexus, Infiniti, Jeep, Ram, Subaru, Mazda, Volvo, Jaguar, Rolls-Royce, Bentley, Maserati, Alfa Romeo

Seja rigoroso: se não conhecer com certeza, marque como IMPORTADO (mais seguro).`,
                  },
                ],
              },
            ],
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        const msg = errorData.error?.message || `Erro ${response.status}`;
        console.error("Erro da API:", msg);
        throw new Error(msg);
      }

      const data = await response.json();
      const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!responseText) {
        throw new Error("Resposta vazia da IA");
      }

      console.log("Resposta bruta:", responseText);

      // Extrair JSON
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("Resposta não contém JSON");
      }

      const result = JSON.parse(jsonMatch[0]) as VehicleValidationResult;
      console.log("✅ IA respondeu:", result);
      return result;
    } catch (err: any) {
      const errorMessage = err.message || "Erro ao validar veículo";
      console.error("❌ Erro na IA:", errorMessage);

      // FALLBACK: Se IA falhar (quota, timeout, etc), usa validação offline
      if (errorMessage.includes("429") || errorMessage.includes("quota") || errorMessage.includes("timeout")) {
        console.log("⚠️ IA indisponível, usando validação local...");
        try {
          const offlineResult = validateVehicleOffline(vehicleInput);
          console.log("✅ Validação local concluída:", offlineResult);
          return offlineResult;
        } catch (offlineErr: any) {
          setError("Erro ao validar veículo");
          return null;
        }
      }

      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { validateVehicle, loading, error };
};
