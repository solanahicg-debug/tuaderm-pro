import { supabase } from '../api/supabase'
import type { RolApp, PerfilUsuario } from './perfil'

export type CrearUsuarioPayload = {
  email: string
  password: string
  nombre: string
  rol: RolApp
  empresa_id: string
}

export const crearUsuarioConPerfil = async (payload: CrearUsuarioPayload) => {
  const { data, error } = await supabase.functions.invoke('create-user', {
    body: payload,
  })

  if (error) {
    throw error
  }

  if (data?.error) {
    throw new Error(data.error)
  }

  return data as {
    ok: true
    user_id: string
    perfil: PerfilUsuario
  }
}