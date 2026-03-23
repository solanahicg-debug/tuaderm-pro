import { supabase } from '../api/supabase';

export type PlanEmpresa = 'demo' | 'basico' | 'premium' | 'pro' | 'estandar' | string;

export type Empresa = {
  id: string;
  nombre?: string | null;
  plan?: PlanEmpresa | null;
  fecha_vencimiento?: string | null;
  activa?: boolean | null;
};

export const obtenerEmpresaPorId = async (
  empresaId: string
): Promise<Empresa | null> => {
  const { data, error } = await supabase
    .from('empresas')
    .select('*')
    .eq('id', empresaId)
    .maybeSingle();

  if (error) throw error;

  return data;
};

export const obtenerEmpresaUsuario = async (): Promise<Empresa | null> => {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) return null;

  const { data: perfil, error: errorPerfil } = await supabase
    .from('perfiles')
    .select('empresa_id')
    .eq('id', user.id)
    .maybeSingle();

  if (errorPerfil || !perfil?.empresa_id) return null;

  return await obtenerEmpresaPorId(perfil.empresa_id);
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

export const empresaEstaVencida = (empresa: Empresa | null) => {
  if (!empresa) return false;
  if (empresa.activa === false) return true;
  if (!empresa.fecha_vencimiento) return false;

  const dias = calcularDiasRestantes(empresa.fecha_vencimiento);
  return dias !== null && dias <= 0;
};

export const normalizarPlan = (plan?: string | null) => {
  return (plan || '').trim().toLowerCase();
};

export const empresaEsDemo = (empresa: Empresa | null) => {
  if (!empresa) return false;
  return normalizarPlan(empresa.plan) === 'demo';
};

export const empresaEsPremium = (empresa: Empresa | null) => {
  if (!empresa) return false;

  const plan = normalizarPlan(empresa.plan);
  return plan === 'premium' || plan === 'pro';
};

export const empresaEsBasica = (empresa: Empresa | null) => {
  if (!empresa) return false;

  const plan = normalizarPlan(empresa.plan);
  return plan === 'basico' || plan === 'básico' || plan === 'estandar' || plan === 'estándar';
};

export const obtenerNombrePlan = (plan?: string | null) => {
  const limpio = normalizarPlan(plan);

  if (!limpio) return 'Sin plan';
  if (limpio === 'demo') return 'Demo';
  if (limpio === 'basico' || limpio === 'básico') return 'Básico';
  if (limpio === 'premium') return 'Premium';
  if (limpio === 'pro') return 'Pro';
  if (limpio === 'estandar' || limpio === 'estándar') return 'Estándar';

  return plan || 'Sin plan';
};