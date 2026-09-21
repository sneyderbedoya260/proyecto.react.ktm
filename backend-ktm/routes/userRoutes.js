import { Router } from 'express';
import { verificarToken } from '../middleware/verificarToken.js';
import { verificarRol } from '../middleware/verificarRol.js';
import { listarUsuarios, obtenerUsuario, actualizarUsuario, cambiarEstado, eliminarUsuario } from '../controllers/userController.js';

const router = Router();

router.use(verificarToken, verificarRol('Administrador'));
router.get('/', listarUsuarios);
router.get('/:id', obtenerUsuario);
router.put('/:id', actualizarUsuario);
router.patch('/:id/estado', cambiarEstado);
router.delete('/:id', eliminarUsuario);

export default router;
