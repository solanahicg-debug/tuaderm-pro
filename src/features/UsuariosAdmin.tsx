import { useEffect, useState } from 'react';
import {
  listarPerfilesPorEmpresa,
  actualizarPerfilUsuario,
  type PerfilUsuario,
  type RolApp,
} from '../utils/perfil';

type Props = {
  empresaId: string;
  esAdmin: boolean;
};

const rolesDisponibles: RolApp[] = [
  'admin',
  'recepcion',
  'doctor',
  'demo',
  'usuario',
];

export default function UsuariosAdmin({ empresaId, esAdmin }: Props) {
  const [usuarios, setUsuarios] = useState<PerfilUsuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [guardandoId, setGuardandoId] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState('');

  const cargarUsuarios = async () => {
    if (!empresaId) return;

    try {
      setLoading(true);
      setMensaje('');
      const data = await listarPerfilesPorEmpresa(empresaId);
      setUsuarios(data);
    } catch (error) {
      console.error('Error cargando usuarios:', error);
      setMensaje('No se pudieron cargar los usuarios.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarUsuarios();
  }, [empresaId]);

  const cambiarCampo = (
    id: string,
    campo: keyof Pick<PerfilUsuario, 'nombre' | 'rol'>,
    valor: string
  ) => {
    setUsuarios((prev) =>
      prev.map((user) =>
        user.id === id ? { ...user, [campo]: valor } : user
      )
    );
  };

  const guardarUsuario = async (usuario: PerfilUsuario) => {
    try {
      setGuardandoId(usuario.id);
      setMensaje('');

      await actualizarPerfilUsuario(usuario.id, {
        nombre: usuario.nombre || '',
        rol: usuario.rol || 'usuario',
      });

      setMensaje('Usuario actualizado correctamente.');
    } catch (error) {
      console.error('Error guardando usuario:', error);
      setMensaje('No se pudo guardar el usuario.');
    } finally {
      setGuardandoId(null);
    }
  };

  if (!esAdmin) {
    return (
      <div className="ficha-container" style={{ maxWidth: 900 }}>
        <div className="ficha-header">
          <div className="ficha-title">Acceso restringido</div>
        </div>
        <div style={{ padding: '12px 0' }}>
          Solo el administrador puede gestionar usuarios.
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="ficha-container" style={{ maxWidth: 900 }}>
        <div className="ficha-header">
          <div className="ficha-title">Usuarios</div>
        </div>
        <div style={{ padding: '12px 0' }}>Cargando usuarios...</div>
      </div>
    );
  }

  return (
    <div className="ficha-container" style={{ maxWidth: 1000 }}>
      <div className="ficha-header">
        <div className="ficha-title">Gestión de usuarios</div>
      </div>

      {mensaje && (
        <div
          className={mensaje.includes('correctamente') ? 'toast-inline success' : 'toast-inline error'}
          style={{ marginBottom: 12 }}
        >
          {mensaje}
        </div>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table className="excel-table" style={{ width: '100%' }}>
          <thead>
            <tr>
              <th style={{ minWidth: 220 }}>ID</th>
              <th style={{ minWidth: 220 }}>Nombre</th>
              <th style={{ minWidth: 180 }}>Rol</th>
              <th style={{ minWidth: 140 }}>Acción</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: 16, textAlign: 'center' }}>
                  No hay usuarios en esta empresa.
                </td>
              </tr>
            ) : (
              usuarios.map((usuario) => (
                <tr key={usuario.id}>
                  <td>{usuario.id}</td>
                  <td>
                    <input
                      className="excel-input"
                      value={usuario.nombre || ''}
                      onChange={(e) =>
                        cambiarCampo(usuario.id, 'nombre', e.target.value)
                      }
                      placeholder="Nombre del usuario"
                    />
                  </td>
                  <td>
                    <select
                      className="excel-input"
                      value={usuario.rol || 'usuario'}
                      onChange={(e) =>
                        cambiarCampo(usuario.id, 'rol', e.target.value)
                      }
                    >
                      {rolesDisponibles.map((rol) => (
                        <option key={rol} value={rol}>
                          {rol}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-save"
                      onClick={() => guardarUsuario(usuario)}
                      disabled={guardandoId === usuario.id}
                    >
                      {guardandoId === usuario.id ? 'Guardando...' : 'Guardar'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}