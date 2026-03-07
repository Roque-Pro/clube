import { useState } from "react";
import { Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { logAction } from "@/lib/auditLog";

interface Product {
    id: string;
    name: string;
    store?: string;
    quantity: number;
}

interface RearrangeProductModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    product: Product | null;
    stores: string[];
    onSuccess?: () => void;
}

const STORES = ["Loja 1", "Loja 2", "Loja 3"];

export const RearrangeProductModal = ({
    open,
    onOpenChange,
    product,
    stores = STORES,
    onSuccess,
}: RearrangeProductModalProps) => {
    const [fromStore, setFromStore] = useState<string>("");
    const [toStore, setToStore] = useState<string>("");
    const [quantity, setQuantity] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    // Reset form quando modal abre
    const handleOpenChange = (newOpen: boolean) => {
        if (!newOpen) {
            setFromStore("");
            setToStore("");
            setQuantity("");
        }
        onOpenChange(newOpen);
    };

    // Inicializar fromStore com a loja atual do produto
    const handleOpen = () => {
        if (product?.store) {
            setFromStore(product.store);
        }
    };

    // Validar quantidade disponível
    const getAvailableQuantity = () => {
        if (!fromStore || !product) return 0;
        if (fromStore === product.store) {
            return product.quantity;
        }
        return 0;
    };

    // Handle rearrange
    const handleRearrange = async () => {
        if (!product) return;

        // Validações
        if (!fromStore) {
            toast({
                title: "Erro",
                description: "Selecione a loja de origem",
                variant: "destructive",
            });
            return;
        }

        if (!toStore) {
            toast({
                title: "Erro",
                description: "Selecione a loja de destino",
                variant: "destructive",
            });
            return;
        }

        if (fromStore === toStore) {
            toast({
                title: "Erro",
                description: "A loja de origem não pode ser igual à de destino",
                variant: "destructive",
            });
            return;
        }

        const qtyToMove = parseInt(quantity);
        if (!quantity || qtyToMove <= 0) {
            toast({
                title: "Erro",
                description: "Digite uma quantidade válida",
                variant: "destructive",
            });
            return;
        }

        if (qtyToMove > product.quantity) {
            toast({
                title: "Erro",
                description: `Quantidade indisponível. Disponível: ${product.quantity} unidades`,
                variant: "destructive",
            });
            return;
        }

        try {
          setLoading(true);

          // 1. Decrementar quantidade na loja de origem
          const newQuantityFromStore = product.quantity - qtyToMove;
          const { error: decrementError } = await supabase
            .from("products")
            .update({
              quantity: newQuantityFromStore,
              updated_at: new Date().toISOString(),
            })
            .eq("id", product.id)
            .eq("store", fromStore);

          if (decrementError) throw decrementError;

          // 2. Verificar se produto existe na loja de destino
          const { data: existingProduct, error: checkError } = await supabase
            .from("products")
            .select("id, quantity")
            .eq("name", product.name)
            .eq("store", toStore)
            .maybeSingle(); // Pode retornar null ou um objeto

          if (checkError) {
            throw checkError;
          }

          // 3. Se existe: incrementar quantidade | Se não existe: criar novo
          if (existingProduct) {
            // Produto já existe na loja: somar quantidade
            const { error: incrementError } = await supabase
              .from("products")
              .update({
                quantity: existingProduct.quantity + qtyToMove,
                updated_at: new Date().toISOString(),
              })
              .eq("id", existingProduct.id);

            if (incrementError) throw incrementError;
          } else {
            // Produto não existe: criar novo com todas as informações
            const { error: createError } = await supabase
              .from("products")
              .insert([
                {
                  name: product.name,
                  category: product.category,
                  quantity: qtyToMove,
                  min_quantity: product.min_quantity || 0,
                  price: product.price,
                  supplier: product.supplier || "",
                  cost_price: product.cost_price || 0,
                  code: product.code || null,
                  description: product.description || null,
                  store: toStore,
                },
              ]);

            if (createError) {
              // Se der erro de duplicate, tenta incrementar (race condition)
              if (createError.code === "23505") {
                const { data: retryProduct } = await supabase
                  .from("products")
                  .select("id, quantity")
                  .eq("name", product.name)
                  .eq("store", toStore)
                  .maybeSingle();

                if (retryProduct) {
                  const { error: retryError } = await supabase
                    .from("products")
                    .update({
                      quantity: retryProduct.quantity + qtyToMove,
                      updated_at: new Date().toISOString(),
                    })
                    .eq("id", retryProduct.id);

                  if (retryError) throw retryError;
                } else {
                  throw createError;
                }
              } else {
                throw createError;
              }
            }
          }

          // 4. Registrar movimentação de saída na loja de origem
          const { error: movementOutError } = await supabase
            .from("product_movements")
            .insert([
              {
                product_id: product.id,
                movement_type: "saída",
                quantity: qtyToMove,
                reason: `Remanejar: ${fromStore} → ${toStore}`,
              },
            ]);

          if (movementOutError) throw movementOutError;

          // 5. Registrar movimentação de entrada na loja de destino
          const { error: movementInError } = await supabase
            .from("product_movements")
            .insert([
              {
                product_id: product.id,
                movement_type: "entrada",
                quantity: qtyToMove,
                reason: `Remanejar: ${fromStore} → ${toStore}`,
              },
            ]);

          if (movementInError) throw movementInError;

          // 6. Registrar no audit log
          await logAction(
            "update",
            "products",
            product.id,
            product.name,
            `Remanejar ${qtyToMove} un. de ${fromStore} para ${toStore}`
          );

          toast({
            title: "Sucesso",
            description: `${qtyToMove} unidade(s) movida(s) de ${fromStore} para ${toStore}`,
          });

          handleOpenChange(false);
          onSuccess?.();
        } catch (error: any) {
          console.error("Erro ao remanejar:", error);
          toast({
            title: "Erro ao remanejar",
            description: error.message,
            variant: "destructive",
          });
        } finally {
          setLoading(false);
        }
    };

    if (!product) return null;

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="bg-card border-border max-w-md">
                <DialogHeader>
                    <DialogTitle className="font-display">Remanejar Produto</DialogTitle>
                    <DialogDescription>
                        Mova {product.name} entre lojas
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Info do produto */}
                    <div className="p-4 bg-secondary/20 rounded-lg border border-border">
                        <p className="text-sm text-muted-foreground mb-1">Produto</p>
                        <p className="font-semibold text-foreground">{product.name}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                            Loja atual: <span className="font-bold text-primary">{product.store}</span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                            Quantidade em estoque: <span className="font-bold text-primary">{product.quantity}</span> un.
                        </p>
                    </div>

                    {/* Loja de origem */}
                    <div>
                        <Label htmlFor="from-store">Loja de Origem</Label>
                        <Select value={fromStore} onValueChange={setFromStore}>
                            <SelectTrigger id="from-store">
                                <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                            <SelectContent>
                                {stores.map((store) => (
                                    <SelectItem key={store} value={store}>
                                        {store}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {fromStore && (
                            <p className="text-xs text-muted-foreground mt-1">
                                Disponível: {getAvailableQuantity()} unidades
                            </p>
                        )}
                    </div>

                    {/* Quantidade */}
                    <div>
                        <Label htmlFor="quantity">Quantidade a Mover</Label>
                        <Input
                            id="quantity"
                            type="number"
                            min="1"
                            max={getAvailableQuantity()}
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            placeholder="Digite a quantidade"
                            disabled={!fromStore}
                        />
                        {quantity && (
                            <p className="text-xs text-muted-foreground mt-1">
                                {parseInt(quantity) > 0 && getAvailableQuantity() > 0
                                    ? `${getAvailableQuantity() - parseInt(quantity)} unidades restantes em ${fromStore}`
                                    : "Quantidade inválida"}
                            </p>
                        )}
                    </div>

                    {/* Seta visual */}
                    <div className="flex items-center justify-center gap-2 py-2">
                        <div className="text-center text-sm text-muted-foreground">
                            {fromStore || "Origem"}
                        </div>
                        <ArrowRight className="w-5 h-5 text-primary" />
                        <div className="text-center text-sm text-muted-foreground">
                            {toStore || "Destino"}
                        </div>
                    </div>

                    {/* Loja de destino */}
                    <div>
                        <Label htmlFor="to-store">Loja de Destino</Label>
                        <Select value={toStore} onValueChange={setToStore}>
                            <SelectTrigger id="to-store">
                                <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                            <SelectContent>
                                {stores.filter((store) => store !== fromStore).map((store) => (
                                    <SelectItem key={store} value={store}>
                                        {store}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Botões */}
                    <div className="flex gap-3">
                        <Button
                            onClick={() => handleOpenChange(false)}
                            variant="outline"
                            className="flex-1"
                            disabled={loading}
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleRearrange}
                            disabled={loading || !fromStore || !toStore || !quantity}
                            className="flex-1 gradient-primary text-primary-foreground font-semibold"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Processando...
                                </>
                            ) : (
                                <>
                                    <ArrowRight className="w-4 h-4 mr-2" />
                                    Remanejar
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
