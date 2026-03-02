import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { action, email, password, full_name, user_id, status, role } = await req.json();

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No auth' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'seed-master') {
      // Special action - only works if no admin exists yet
      const { data: existingAdmins } = await supabaseAdmin
        .from('user_roles')
        .select('id')
        .eq('role', 'admin');

      if (existingAdmins && existingAdmins.length > 0) {
        return new Response(JSON.stringify({ error: 'Admin already exists' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // Create master user
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name },
      });

      if (createError) throw createError;

      // Set as approved
      await supabaseAdmin
        .from('profiles')
        .update({ status: 'approved', full_name })
        .eq('user_id', newUser.user.id);

      // Assign admin role
      await supabaseAdmin
        .from('user_roles')
        .insert({ user_id: newUser.user.id, role: 'admin' });

      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // All other actions require admin
    const token = authHeader.replace('Bearer ', '');
    const { data: { user: caller } } = await supabaseAdmin.auth.getUser(token);
    if (!caller) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { data: callerRole } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', caller.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (!callerRole) {
      return new Response(JSON.stringify({ error: 'Not admin' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'update-status') {
      const { error } = await supabaseAdmin
        .from('profiles')
        .update({ status })
        .eq('user_id', user_id);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'list-users') {
      const { data: profiles, error } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;

      // Get roles
      const { data: roles } = await supabaseAdmin
        .from('user_roles')
        .select('user_id, role');

      // Get emails from auth
      const { data: { users: authUsers } } = await supabaseAdmin.auth.admin.listUsers();

      const enriched = profiles?.map(p => {
        const authUser = authUsers?.find(u => u.id === p.user_id);
        const userRoles = roles?.filter(r => r.user_id === p.user_id).map(r => r.role) || [];
        return {
          ...p,
          email: authUser?.email || '',
          roles: userRoles,
        };
      });

      return new Response(JSON.stringify(enriched), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'set-role') {
      if (role === 'admin') {
        await supabaseAdmin.from('user_roles').upsert({ user_id, role: 'admin' }, { onConflict: 'user_id,role' });
      } else {
        await supabaseAdmin.from('user_roles').delete().eq('user_id', user_id).eq('role', 'admin');
      }
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
