import { supabase } from '../api/supabase';

export const obtenerPerfilUsuario = async (userId: string) => {
  const { data, error } = await supabase
    .from('perfiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw error;

  return data;
};