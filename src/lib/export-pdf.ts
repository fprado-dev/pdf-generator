import html2canvas from "html2canvas-pro";
import { jsPDF } from "jspdf";

const A4_W = 210; // mm
const A4_H = 297; // mm

export async function exportToPDF(
  canvasElement: HTMLElement,
  filename = "relatorio.pdf"
) {
  canvasElement.classList.add("export-mode");

  await new Promise((r) => setTimeout(r, 100));

  const canvas = await html2canvas(canvasElement, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
    logging: false,
  });

  canvasElement.classList.remove("export-mode");

  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const imgData = canvas.toDataURL("image/png");
  const ratio = A4_W / canvas.width;
  const scaledH = canvas.height * ratio;

  if (scaledH <= A4_H) {
    pdf.addImage(imgData, "PNG", 0, 0, A4_W, scaledH);
  } else {
    let y = 0;
    while (y < scaledH) {
      if (y > 0) pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, -y, A4_W, scaledH);
      y += A4_H;
    }
  }

  pdf.save(filename);
}
