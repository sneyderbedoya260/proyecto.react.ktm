export function verificarRol(...rolesPermitidos) {
  return (req, res, next) => {
    if (!req.usuario || !rolesPermitidos.includes(req.usuario.rolNombre)) {
      return res.status(403).json({ mensaje: 'No tienes permisos para acceder a este recurso.' });
    }
    next();
  };
}
