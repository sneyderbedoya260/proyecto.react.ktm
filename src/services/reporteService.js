import { apiRequest, apiDescargar } from './apiClient';

export const reporteDiario = (fecha) => apiRequest(`/reportes/ventas-diario?fecha=${fecha}`);
export const descargarReportePdf = (fecha) => apiDescargar(`/reportes/ventas-diario/pdf?fecha=${fecha}`, `reporte-${fecha}.pdf`);
export const descargarReporteExcel = (fecha) => apiDescargar(`/reportes/ventas-diario/excel?fecha=${fecha}`, `reporte-${fecha}.xlsx`);
