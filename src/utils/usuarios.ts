import type { RolApp, PerfilUsuario } from './perfil'
import { supabase } from '../api/supabase'

export type CrearUsuarioPayload = {
  email: string
  password: string
  nombre: string
  rol: RolApp
  empresa_id: string
}

export const crearUsuarioConPerfil = async (payload: CrearUsuarioPayload) => {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession()

  if (sessionError) {
    throw new Error(sessionError.message)
  }

  if (!session?.access_token) {
    throw new Error('No se encontró una sesión activa')
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Faltan variables de entorno de Supabase')
  }

  const response = await fetch(`${supabaseUrl}/functions/v1/create-user`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(payload),
  })

  const raw = await response.text()
  console.log('RAW create-user response:', raw)

  let parsed: any = null
  try {
    parsed = raw ? JSON.parse(raw) : null
  } catch {
    parsed = null
  }

  if (!response.ok) {
    throw new Error(parsed?.error || raw || `Error HTTP ${response.status}`)
  }

  if (parsed?.error) {
    throw new Error(parsed.error)
  }

  return parsed as {
    ok: true
    user_id: string
    perfil?: PerfilUsuario
    message?: string
  }
}