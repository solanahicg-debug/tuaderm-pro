import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type RolApp = "admin" | "recepcion" | "doctor" | "usuario";

Deno.serve(async (req) => {
  try {
    const authHeader = req.headers.get("Authorization");

    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Falta Authorization" }), {
        status: 401,
      });
    }

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 🔹 Obtener usuario autenticado
    const {
      data: { user },
      error: userError,
    } = await supabaseUser.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Usuario no autenticado" }), {
        status: 401,
      });
    }

    // 🔹 Obtener perfil del usuario actual (con admin)
    const { data: perfil, error: perfilError } = await supabaseAdmin
      .from("perfiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (perfilError || !perfil) {
      return new Response(JSON.stringify({ error: "Perfil no encontrado" }), {
        status: 400,
      });
    }

    if (perfil.rol !== "admin") {
      return new Response(JSON.stringify({ error: "No eres admin" }), {
        status: 403,
      });
    }

    // 🔹 Obtener datos del body
    const body = await req.json();
    const { email, password, nombre, rol, empresa_id } = body;

    const rolesValidos: RolApp[] = ["admin", "recepcion", "doctor", "usuario"];

    if (!rolesValidos.includes(rol)) {
      return new Response(JSON.stringify({ error: "Rol inválido" }), {
        status: 400,
      });
    }

    // 🔹 Crear usuario en auth
    const { data: newUser, error: createError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

    if (createError) {
      return new Response(JSON.stringify({ error: createError.message }), {
        status: 400,
      });
    }

    // 🔹 Crear perfil
    const { error: perfilCreateError } = await supabaseAdmin
      .from("perfiles")
      .insert({
        id: newUser.user.id,
        nombre,
        rol,
        empresa_id,
      });

    if (perfilCreateError) {
      return new Response(
        JSON.stringify({ error: perfilCreateError.message }),
        { status: 400 }
      );
    }

    return new Response(
      JSON.stringify({
        ok: true,
        user_id: newUser.user.id,
      }),
      { status: 200 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Error desconocido",
      }),
      { status: 500 }
    );
  }
});