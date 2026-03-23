// @ts-nocheck
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

type RolApp = 'admin' | 'recepcion' | 'doctor' | 'demo' | 'usuario'

type CreateUserPayload = {
  email: string
  password: string
  nombre: string
  rol: RolApp
  empresa_id: string
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Método no permitido' }),
        {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Falta Authorization' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabaseUserClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    })

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey)

    const {
      data: { user: requester },
      error: requesterError,
    } = await supabaseUserClient.auth.getUser()

    if (requesterError || !requester) {
      return new Response(
        JSON.stringify({ error: 'No autorizado' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const { data: requesterPerfil, error: perfilError } = await supabaseAdmin
      .from('perfiles')
      .select('id, empresa_id, rol')
      .eq('id', requester.id)
      .maybeSingle()

    if (perfilError || !requesterPerfil) {
      return new Response(
        JSON.stringify({ error: 'No se encontró el perfil del usuario actual' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    if (requesterPerfil.rol !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Solo un admin puede crear usuarios' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const body = (await req.json()) as Partial<CreateUserPayload>

    const email = body.email?.trim().toLowerCase()
    const password = body.password?.trim()
    const nombre = body.nombre?.trim()
    const rol = body.rol?.trim() as RolApp | undefined
    const empresa_id = body.empresa_id?.trim()

    if (!email || !password || !nombre || !rol || !empresa_id) {
      return new Response(
        JSON.stringify({ error: 'Faltan datos obligatorios' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    if (empresa_id !== requesterPerfil.empresa_id) {
      return new Response(
        JSON.stringify({ error: 'No puedes crear usuarios para otra empresa' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const rolesValidos: RolApp[] = ['admin', 'recepcion', 'doctor', 'demo', 'usuario']
    if (!rolesValidos.includes(rol)) {
      return new Response(
        JSON.stringify({ error: 'Rol inválido' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const { data: createdUser, error: createUserError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          nombre,
          rol,
          empresa_id,
        },
      })

    if (createUserError || !createdUser.user) {
      return new Response(
        JSON.stringify({ error: createUserError?.message || 'No se pudo crear el usuario auth' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const { data: perfilCreado, error: perfilCreateError } = await supabaseAdmin
      .from('perfiles')
      .insert([
        {
          id: createdUser.user.id,
          empresa_id,
          nombre,
          rol,
        },
      ])
      .select()
      .single()

    if (perfilCreateError) {
      await supabaseAdmin.auth.admin.deleteUser(createdUser.user.id)

      return new Response(
        JSON.stringify({ error: perfilCreateError.message }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    return new Response(
      JSON.stringify({
        ok: true,
        user_id: createdUser.user.id,
        perfil: perfilCreado,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error inesperado'
    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})