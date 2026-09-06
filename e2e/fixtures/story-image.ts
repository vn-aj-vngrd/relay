// Standalone esbuild needs Next's named browser implementation rather than
// the framework-managed next/image CommonJS default interop. No image mock.
export { Image as default } from "next/dist/client/image-component";
