import { Router } from 'express';
import { registrar, iniciarSesion, recuperarPassword, restablecerPassword } from '../controllers/authController.js';

const router = Router();
router.post('/register', registrar);
router.post('/login', iniciarSesion);
router.post('/recover-password', recuperarPassword);
router.post('/reset-password', restablecerPassword);

export default router;
