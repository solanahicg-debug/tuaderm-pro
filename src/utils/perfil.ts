import { supabase } from '../api/supabase';

export type RolApp = 'admin' | 'recepcion' | 'doctor' | 'demo' | 'usuario';

export type PerfilUsuario = {
  id: string;
  empresa_id: string;
  nombre?: string | null;
  rol?: RolApp | string | null;
};

export const obtenerPerfilUsuario = async (
  userId: string
): Promise<PerfilUsuario | null> => {
  const { data, error } = await supabase
    .from('perfiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;

  return data;
};

export const listarPerfilesPorEmpresa = async (
  empresaId: string
): Promise<PerfilUsuario[]> => {
  const { data, error } = await supabase
    .from('perfiles')
    .select('*')
    .eq('empresa_id', empresaId)
    .order('nombre', { ascending: true });

  if (error) throw error;

  return data || [];
};

export const actualizarPerfilUsuario = async (
  userId: string,
  payload: Partial<Omit<PerfilUsuario, 'id'>>
): Promise<PerfilUsuario> => {
  const { data, error } = await supabase
    .from('perfiles')
    .update(payload)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;

  return data;
};