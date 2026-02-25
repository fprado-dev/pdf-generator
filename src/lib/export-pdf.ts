import html2canvas from "html2canvas-pro";
import { jsPDF } from "jspdf";

const A4_W = 210; // mm
const A4_H = 297; // mm

export async function exportToPDF(
  canvasElement: HTMLElement,
  filename = "relatorio.pdf"
) {
  canvasElement.classList.add("export-mode");

  await new Promise((r) => setTimeout(r, 150));

  const canvas = await html2canvas(canvasElement, {
    scale: 1.5,
    useCORS: true,
    backgroundColor: "#ffffff",
    logging: false,
    removeContainer: true,
  });

  canvasElement.classList.remove("export-mode");

  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const imgData = canvas.toDataURL("image/jpeg", 0.92);
  const ratio = A4_W / canvas.width;
  const scaledH = canvas.height * ratio;

  if (scaledH <= A4_H) {
    pdf.addImage(imgData, "JPEG", 0, 0, A4_W, scaledH);
  } else {
    let y = 0;
    while (y < scaledH) {
      if (y > 0) pdf.addPage();
      pdf.addImage(imgData, "JPEG", 0, -y, A4_W, scaledH);
      y += A4_H;
    }
  }

  pdf.save(filename);
}
