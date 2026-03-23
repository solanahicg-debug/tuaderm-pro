import React from 'react';

type Props = {
  empresaNombre?: string | null;
  fechaVencimiento?: string | null;
};

const BloqueoDemo: React.FC<Props> = ({ empresaNombre, fechaVencimiento }) => {
  const fechaTexto = fechaVencimiento
    ? new Date(fechaVencimiento).toLocaleDateString('es-BO')
    : '—';

  return (
    <div className="app-shell" style={{ background: 'var(--background)' }}>
      <div className="app-main">
        <main className="app-content">
          <div className="ficha-container" style={{ maxWidth: 560, marginTop: 40 }}>
            <div className="ficha-header">
              <div className="ficha-title">ACCESO BLOQUEADO</div>
            </div>

            <div className="p-6" style={{ padding: 24 }}>
              <div className="mini-card" style={{ marginBottom: 16 }}>
                <div className="mini-card-title">Empresa</div>
                <div className="mini-card-sub">{empresaNombre || 'Empresa'}</div>
              </div>

              <div className="mini-card" style={{ marginBottom: 16 }}>
                <div className="mini-card-title">Estado del demo</div>
                <div className="mini-card-sub">
                  El periodo de prueba ha vencido.
                </div>
              </div>

              <div className="mini-card">
                <div className="mini-card-title">Fecha de vencimiento</div>
                <div className="mini-card-sub">{fechaTexto}</div>
              </div>
            </div>

            <div className="btn-group">
              <button type="button" className="btn btn-save" disabled>
                Renovación pendiente
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default BloqueoDemo;