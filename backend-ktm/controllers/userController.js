import pool from '../db/connection.js';

export async function listarUsuarios(req, res) {
  const [usuarios] = await pool.query(`SELECT u.id, u.nombre, u.apellido, u.correo, u.telefono, u.estado, r.nombre AS rol
     FROM usuarios u JOIN roles r ON u.rol_id = r.id ORDER BY u.id DESC`);
  res.json(usuarios);
}

export async function obtenerUsuario(req, res) {
  const [filas] = await pool.query(`SELECT u.id, u.nombre, u.apellido, u.tipo_documento, u.numero_documento, u.direccion, u.telefono, u.correo, u.estado, r.nombre AS rol
     FROM usuarios u JOIN roles r ON u.rol_id = r.id WHERE u.id = ?`, [req.params.id]);
  if (filas.length === 0) return res.status(404).json({ mensaje: 'Usuario no encontrado.' });
  res.json(filas[0]);
}

export async function actualizarUsuario(req, res) {
  const { nombre, apellido, direccion, telefono, rol_id } = req.body;
  await pool.query('UPDATE usuarios SET nombre = ?, apellido = ?, direccion = ?, telefono = ?, rol_id = ? WHERE id = ?', [nombre, apellido, direccion, telefono, rol_id, req.params.id]);
  res.json({ mensaje: 'Usuario actualizado.' });
}

export async function cambiarEstado(req, res) {
  const { estado } = req.body;
  if (!['Activo', 'Inactivo'].includes(estado)) return res.status(400).json({ mensaje: 'Estado inválido.' });
  await pool.query('UPDATE usuarios SET estado = ? WHERE id = ?', [estado, req.params.id]);
  res.json({ mensaje: `Usuario marcado como ${estado}.` });
}

export async function eliminarUsuario(req, res) {
  await pool.query('DELETE FROM usuarios WHERE id = ?', [req.params.id]);
  res.json({ mensaje: 'Usuario eliminado.' });
}
