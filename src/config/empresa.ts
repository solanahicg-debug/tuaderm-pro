let empresaIdActual = '2edf9e2b-2226-43d6-9f87-0ebb4cdba9a4';

export const setEmpresaId = (empresaId: string) => {
  empresaIdActual = empresaId;
};

export const getEmpresaId = () => {
  return empresaIdActual;
};