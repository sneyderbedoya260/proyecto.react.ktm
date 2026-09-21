import { Router } from 'express';
import { verificarToken } from '../middleware/verificarToken.js';
import { verificarRol } from '../middleware/verificarRol.js';
import { listarProductos, obtenerProducto, crearProducto, actualizarProducto, eliminarProducto } from '../controllers/productController.js';

const router = Router();

router.get('/', listarProductos);
router.get('/:id', obtenerProducto);
router.post('/', verificarToken, verificarRol('Administrador', 'Empleado'), crearProducto);
router.put('/:id', verificarToken, verificarRol('Administrador', 'Empleado'), actualizarProducto);
router.delete('/:id', verificarToken, verificarRol('Administrador'), eliminarProducto);

export default router;
