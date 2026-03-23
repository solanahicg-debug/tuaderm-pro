import React, { useState } from 'react';
import { supabase } from '../api/supabase';

type Props = {
  onLoginSuccess?: () => void;
};

const Login: React.FC<Props> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState('');

  const iniciarSesion = async () => {
    if (!email || !password) {
      setMensaje('Completa email y contraseña.');
      return;
    }

    setLoading(true);
    setMensaje('');

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setMensaje(error.message);
      return;
    }

    onLoginSuccess?.();
  };

  return (
    <div className="ficha-container" style={{ maxWidth: 420, marginTop: 60 }}>
      <div className="ficha-header">
        <div className="ficha-title">INICIAR SESIÓN</div>
      </div>

      <div className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
        <div className="form-row">
          <label>Email</label>
          <input
            className="excel-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="correo@ejemplo.com"
          />
        </div>

        <div className="form-row">
          <label>Contraseña</label>
          <input
            type="password"
            className="excel-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="********"
          />
        </div>

        {mensaje && (
          <div className="toast-inline error" style={{ margin: 0 }}>
            {mensaje}
          </div>
        )}
      </div>

      <div className="btn-group">
        <button
          type="button"
          onClick={iniciarSesion}
          disabled={loading}
          className="btn btn-save"
        >
          {loading ? 'Ingresando...' : 'Ingresar'}
        </button>
      </div>
    </div>
  );
};

export default Login;