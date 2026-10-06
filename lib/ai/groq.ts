// Backward-compatible module path for integrations that still import ./groq.
// The application now uses NVIDIA NIM exclusively.
export { createProvider } from "./nvidia";
