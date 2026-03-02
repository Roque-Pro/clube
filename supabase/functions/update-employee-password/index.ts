import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface UpdatePasswordRequest {
  email: string;
  password: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Validar método
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    // Just check that authorization header exists (client is authenticated)
    const authHeader = req.headers.get("Authorization");
    
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized - No token provided" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { email, password } = (await req.json()) as UpdatePasswordRequest;

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: "Email e senha são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (password.length < 6) {
      return new Response(
        JSON.stringify({ error: "Senha deve ter no mínimo 6 caracteres" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Criar cliente admin com SERVICE_ROLE_KEY
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );

    // Listar usuários e encontrar pelo email (case-insensitive)
    const listResult = await supabaseAdmin.auth.admin.listUsers();
    const emailLower = email.toLowerCase();
    const user = listResult.data?.users?.find((u) => u.email?.toLowerCase() === emailLower);

    console.log("Procurando email:", emailLower);
    console.log("Usuários disponíveis:", listResult.data?.users?.map(u => u.email));
    console.log("Usuário encontrado:", user?.id);

    if (!user) {
      return new Response(
        JSON.stringify({ error: "Usuário não encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Atualizar a senha
    const updateResult = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { password }
    );

    if (updateResult.error) {
      throw updateResult.error;
    }

    return new Response(
      JSON.stringify({ success: true, message: "Senha atualizada com sucesso" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Erro:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erro ao atualizar senha" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
