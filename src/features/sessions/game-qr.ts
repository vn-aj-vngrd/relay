/** Local, lazy QR generation shared by game sharing and Story. Branding stays outside. */
export async function drawGameQr(
  canvas: HTMLCanvasElement,
  absoluteUrl: string
) {
  const { toCanvas } = await import("qrcode");
  await toCanvas(canvas, absoluteUrl, {
    width: 1024,
    margin: 4,
    errorCorrectionLevel: "M",
    color: { dark: "#111827", light: "#ffffff" },
  });
}
