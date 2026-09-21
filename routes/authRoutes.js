import { Router } from 'express';
import { registrar, iniciarSesion, recuperarPassword } from '../controllers/authController.js';

const router = Router();
router.post('/register', registrar);
router.post('/login', iniciarSesion);
router.post('/recover-password', recuperarPassword);

export default router;
