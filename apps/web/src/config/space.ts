export function getRuntimeConfig() {
  return {
    deploymentTarget: "Hugging Face Docker Space",
    version: "0.5.0",
    apiMode: import.meta.env.VITE_API_BASE_URL ? "API externa" : "API same-origin /api",
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL || null,
  };
}
