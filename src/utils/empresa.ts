import { supabase } from '../api/supabase';

export const obtenerEmpresaUsuario = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: perfil, error: errorPerfil } = await supabase
    .from('perfiles')
    .select('empresa_id')
    .eq('id', user.id)
    .single();

  if (errorPerfil || !perfil) return null;

  const { data: empresa, error: errorEmpresa } = await supabase
    .from('empresas')
    .select('*')
    .eq('id', perfil.empresa_id)
    .single();

  if (errorEmpresa) return null;

  return empresa;
};

export const calcularDiasRestantes = (fechaVencimiento: string | null) => {
  if (!fechaVencimiento) return null;

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const venc = new Date(fechaVencimiento);
  venc.setHours(0, 0, 0, 0);

  const diff = venc.getTime() - hoy.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};