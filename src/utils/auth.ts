import { supabase } from '../api/supabase';

export const obtenerUsuarioActual = async () => {
  const { data } = await supabase.auth.getUser();
  return data.user;
};

export const cerrarSesionAuth = async () => {
  await supabase.auth.signOut();
};