import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface DeleteEmployeeRequest {
  email: string;
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
    // Check authorization header exists
    const authHeader = req.headers.get("Authorization");
    
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized - No token provided" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { email } = (await req.json()) as DeleteEmployeeRequest;

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email é obrigatório" }),
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

    if (!user) {
      // Usuário não existe em auth, mas tudo bem - continuamos
      return new Response(
        JSON.stringify({ success: true, message: "Usuário não encontrado em auth, continuando" }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Deletar o usuário
    const deleteResult = await supabaseAdmin.auth.admin.deleteUser(user.id);

    if (deleteResult.error) {
      throw deleteResult.error;
    }

    return new Response(
      JSON.stringify({ success: true, message: "Usuário deletado com sucesso" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Erro:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erro ao deletar usuário" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
