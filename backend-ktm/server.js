import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import productRoutes from './routes/productRoutes.js';

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());
app.use('/images', express.static('public/images'));

app.get('/', (req, res) => res.json({ mensaje: 'Backend KTM activo.' }));
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', userRoutes);
app.use('/api/productos', productRoutes);
app.use((req, res) => res.status(404).json({ mensaje: 'Recurso no encontrado.' }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ mensaje: 'Error interno del servidor.' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Servidor backend en http://localhost:${PORT}`));
