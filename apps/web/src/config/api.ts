// Configuración del cliente API.
// En Docker Space, el frontend y FastAPI viven en el mismo host, por eso el valor por defecto es "".
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";
