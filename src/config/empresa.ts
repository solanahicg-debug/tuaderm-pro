let empresaIdActual: string | null = null;

export const setEmpresaId = (empresaId: string | null) => {
  empresaIdActual = empresaId;
};

export const getEmpresaId = () => {
  return empresaIdActual;
};

export const clearEmpresaId = () => {
  empresaIdActual = null;
};