import pool from '../db/connection.js';

export async function listarProductos(req, res) {
  const [productos] = await pool.query('SELECT * FROM productos ORDER BY id');
  res.json(productos);
}

export async function obtenerProducto(req, res) {
  const [filas] = await pool.query('SELECT * FROM productos WHERE id = ?', [req.params.id]);
  if (filas.length === 0) return res.status(404).json({ mensaje: 'Producto no encontrado.' });
  res.json(filas[0]);
}

export async function crearProducto(req, res) {
  const { titulo, descripcion, detalle, categoria, imagen_url, precio } = req.body;
  if (!titulo) return res.status(400).json({ mensaje: 'El título es obligatorio.' });
  const [resultado] = await pool.query(
    'INSERT INTO productos (titulo, descripcion, detalle, categoria, imagen_url, precio) VALUES (?, ?, ?, ?, ?, ?)',
    [titulo, descripcion, detalle, categoria, imagen_url, precio || 0]
  );
  res.status(201).json({ mensaje: 'Producto creado.', id: resultado.insertId });
}

export async function actualizarProducto(req, res) {
  const { titulo, descripcion, detalle, categoria, imagen_url, precio, estado } = req.body;
  await pool.query(
    'UPDATE productos SET titulo=?, descripcion=?, detalle=?, categoria=?, imagen_url=?, precio=?, estado=? WHERE id=?',
    [titulo, descripcion, detalle, categoria, imagen_url, precio, estado, req.params.id]
  );
  res.json({ mensaje: 'Producto actualizado.' });
}

export async function eliminarProducto(req, res) {
  await pool.query('DELETE FROM productos WHERE id = ?', [req.params.id]);
  res.json({ mensaje: 'Producto eliminado.' });
}
