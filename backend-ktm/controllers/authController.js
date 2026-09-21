import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import pool from '../db/connection.js';
import { enviarCorreoRecuperacion } from '../utils/mailer.js';

const correoValido = /^\S+@\S+\.\S+$/;

export async function registrar(req, res) {
  try {
    const { nombre, apellido, tipoDocumento, numeroDocumento, direccion, telefono, email, password } = req.body;
    if (!nombre || !apellido || !tipoDocumento || !numeroDocumento || !direccion || !telefono || !email || !password) return res.status(400).json({ mensaje: 'Todos los campos son obligatorios.' });
    if (!correoValido.test(email)) return res.status(400).json({ mensaje: 'Correo electrónico inválido.' });
    if (password.length < 8 || password.length > 20) return res.status(400).json({ mensaje: 'La contraseña debe tener entre 8 y 20 caracteres.' });
    if (!/^[0-9]{6,12}$/.test(numeroDocumento)) return res.status(400).json({ mensaje: 'Número de documento inválido.' });
    if (!/^[0-9]{7,10}$/.test(telefono)) return res.status(400).json({ mensaje: 'Teléfono inválido.' });

    const [existentes] = await pool.query('SELECT id FROM usuarios WHERE correo = ?', [email]);
    if (existentes.length > 0) return res.status(409).json({ mensaje: 'Este correo ya está registrado.' });
    const passwordHash = await bcrypt.hash(password, 10);
    await pool.query(`INSERT INTO usuarios (nombre, apellido, tipo_documento, numero_documento, direccion, telefono, correo, password_hash, rol_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 3)`, [nombre, apellido, tipoDocumento, numeroDocumento, direccion, telefono, email, passwordHash]);
    return res.status(201).json({ mensaje: 'Registro exitoso.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensaje: 'Error del servidor al registrar.' });
  }
}

export async function iniciarSesion(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ mensaje: 'Correo y contraseña son obligatorios.' });
    const [filas] = await pool.query(`SELECT u.id, u.nombre, u.apellido, u.correo, u.password_hash, u.estado, r.nombre AS rolNombre, u.rol_id
       FROM usuarios u JOIN roles r ON u.rol_id = r.id WHERE u.correo = ?`, [email]);
    if (filas.length === 0) return res.status(401).json({ mensaje: 'Credenciales incorrectas.' });
    const usuario = filas[0];
    if (usuario.estado === 'Inactivo') return res.status(403).json({ mensaje: 'Tu cuenta está inactiva. Contacta al administrador.' });
    const coincide = await bcrypt.compare(password, usuario.password_hash);
    if (!coincide) return res.status(401).json({ mensaje: 'Credenciales incorrectas.' });
    const token = jwt.sign({ id: usuario.id, rol_id: usuario.rol_id, rolNombre: usuario.rolNombre }, process.env.JWT_SECRET, { expiresIn: '8h' });
    return res.json({ token, usuario: { id: usuario.id, nombre: usuario.nombre, apellido: usuario.apellido, correo: usuario.correo, rol: usuario.rolNombre } });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensaje: 'Error del servidor al iniciar sesión.' });
  }
}

export async function recuperarPassword(req, res) {
  const { email } = req.body;
  if (!email || !correoValido.test(email)) return res.status(400).json({ mensaje: 'Correo inválido.' });

  try {
    const [filas] = await pool.query('SELECT id FROM usuarios WHERE correo = ?', [email]);
    if (filas.length > 0) {
      const token = crypto.randomBytes(32).toString('hex');
      const expira = new Date(Date.now() + 60 * 60 * 1000); // 1 hora
      await pool.query('UPDATE usuarios SET reset_token = ?, reset_token_expira = ? WHERE id = ?', [token, expira, filas[0].id]);

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const enlace = `${frontendUrl}/restablecer-contrasena?token=${token}`;
      await enviarCorreoRecuperacion(email, enlace);
    }
    return res.json({ mensaje: 'Si el correo existe, recibirás instrucciones de recuperación.' });
  } catch (error) {
    console.error('--- ERROR en recuperarPassword ---');
    console.error(error.message);
    console.error(error);
    return res.status(500).json({ mensaje: 'No fue posible procesar la solicitud en este momento.' });
  }
}

export async function restablecerPassword(req, res) {
  const { token, password } = req.body;
  if (!token || !password) return res.status(400).json({ mensaje: 'Token y nueva contraseña son obligatorios.' });
  if (password.length < 8 || password.length > 20) return res.status(400).json({ mensaje: 'La contraseña debe tener entre 8 y 20 caracteres.' });

  try {
    const [filas] = await pool.query('SELECT id FROM usuarios WHERE reset_token = ? AND reset_token_expira > NOW()', [token]);
    if (filas.length === 0) return res.status(400).json({ mensaje: 'El enlace es inválido o ya venció. Solicita uno nuevo.' });

    const passwordHash = await bcrypt.hash(password, 10);
    await pool.query('UPDATE usuarios SET password_hash = ?, reset_token = NULL, reset_token_expira = NULL WHERE id = ?', [passwordHash, filas[0].id]);
    return res.json({ mensaje: 'Contraseña actualizada correctamente. Ya puedes iniciar sesión.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensaje: 'No fue posible restablecer la contraseña.' });
  }
}
