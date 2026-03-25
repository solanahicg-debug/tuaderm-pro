import { FunctionsHttpError } from '@supabase/supabase-js'
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
  try {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError) throw new Error(sessionError.message)
    if (!session?.access_token) throw new Error('No se encontró una sesión activa')

    const { data, error } = await supabase.functions.invoke('create-user', {
      body: payload,
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    })

    if (error) throw error
    if (data?.error) throw new Error(data.error)

    return data as {
      ok: true
      user_id: string
      perfil: PerfilUsuario
    }
  } catch (error: unknown) {
    if (error instanceof FunctionsHttpError) {
      try {
        const raw = await error.context.text()
        const parsed = JSON.parse(raw)
        throw new Error(parsed?.error || raw || 'Error en la Edge Function')
      } catch {
        throw new Error('La Edge Function devolvió un error sin detalle')
      }
    }

    if (error instanceof Error) throw error
    throw new Error('Error desconocido al crear usuario')
  }
}