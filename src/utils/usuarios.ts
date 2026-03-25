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
  } catch (error: unknown) {
    console.error('Error completo create-user:', error)

    if (error instanceof FunctionsHttpError) {
      try {
        const json = await error.context.json()
        throw new Error(json?.error || 'Error en la Edge Function')
      } catch {
        try {
          const text = await error.context.text()
          throw new Error(text || 'Error en la Edge Function')
        } catch {
          throw new Error('La Edge Function devolvió un error')
        }
      }
    }

    if (error instanceof Error) {
      throw error
    }

    throw new Error('Error desconocido al crear usuario')
  }
}