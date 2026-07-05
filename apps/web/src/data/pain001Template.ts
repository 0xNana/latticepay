export type Pain001SampleFile = {
  label: string;
  fileName: string;
};

export const pain001SampleFiles: Pain001SampleFile[] = [
  {
    label: "Lattice Pay DAO (10)",
    fileName: "pain001-lattice-pay-dao-10-employees-usd-2026-03.xml"
  },
  {
    label: "FHEVM DAO (15)",
    fileName: "pain001-fhevm-gmbh-15-employees-usd-2026-03.xml"
  }
];

export function downloadPain001SampleFile(fileName: string) {
  const anchor = document.createElement("a");
  anchor.href = `/pain001-samples/${fileName}`;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}
