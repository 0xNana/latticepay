const toIsoDate = (value: string) => `${value}T09:00:00Z`;

const amountValue = (formattedUsd: string) => formattedUsd.replace("$", "").replace(/,/g, "");

export type Pain001Payment = {
  id: string;
  role: string;
  name: string;
  recipient: string;
  amount: string;
};

export type Pain001BuildInput = {
  companyName: string;
  runId: string;
  executionDate: string;
  payments: Pain001Payment[];
};

export type Pain001SampleFile = {
  label: string;
  fileName: string;
};

export const pain001SampleFiles: Pain001SampleFile[] = [
  {
    label: "Seismic DAO (5)",
    fileName: "pain001-seismic-labs-llc-05-employees-usd-2026-03.xml"
  },
  {
    label: "FHEVM DAO (10)",
    fileName: "pain001-fhevm-gmbh-10-employees-usd-2026-03.xml"
  },
  {
    label: "FHEVM DAO (15)",
    fileName: "pain001-fhevm-gmbh-15-employees-usd-2026-03.xml"
  }
];

const demoRecipients = [
  "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
  "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
  ,"0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"
  ,"0x90F79bf6EB2c4f870365E785982E1f101E93b906"
  ,"0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65"
  ,"0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc"
  ,"0x976EA74026E726554dB657fA54763abd0C3a0aa9"
  ,"0x14dC79964da2C08b23698B3D3cc7Ca32193d9955"
  ,"0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f"
  ,"0xa0Ee7A142d267C1f36714E4a8F75612F20a79720"
  ,"0xBcd4042DE499D14e55001CcbB24a551F3b954096"
  ,"0x71bE63f3384f5fb98995898A86B02Fb2426c5788"
  ,"0xFABB0ac9d68B0B445fB7357272Ff202C5651694a"
  ,"0x1CBd3b2770909D4e10f157cABC84C7264073C9Ec"
  ,"0xdF3e18d64BC6A983f673Ab319CCaE4f1a57C7097"
  ,"0xcd3B766CCDd6AE721141F452C550Ca635964ce71"
  ,"0x2546BcD3c84621e976D8185a91A922aE77ECEc30"
  ,"0xbDA5747bFD65F08deb54cb465eB87D40e51B197E"
  ,"0xdD2FD4581271e230360230F9337D5c0430Bf44C0"
  ,"0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199"
] as const;

const demoPayments: Pain001Payment[] = [
  { id: "CNT-001", role: "CEO", name: "Ada Keller", recipient: demoRecipients[0], amount: "$15000" },
  { id: "CNT-002", role: "CTO", name: "Noah Braun", recipient: demoRecipients[1], amount: "$13500" },
  { id: "CNT-003", role: "COO", name: "Mila Vogt", recipient: demoRecipients[2], amount: "$11000" },
  { id: "CNT-004", role: "Head of Engineering", name: "Liam Kurz", recipient: demoRecipients[3], amount: "$10000" },
  { id: "CNT-005", role: "Senior Backend Engineer", name: "Emma Hahn", recipient: demoRecipients[4], amount: "$9000" },
  { id: "CNT-006", role: "Senior Frontend Engineer", name: "Paul Weiss", recipient: demoRecipients[5], amount: "$8800" },
  { id: "CNT-007", role: "Product Manager", name: "Sofia Lang", recipient: demoRecipients[6], amount: "$8400" },
  { id: "CNT-008", role: "DevOps Engineer", name: "Jonas Kruger", recipient: demoRecipients[7], amount: "$8200" },
  { id: "CNT-009", role: "QA Lead", name: "Lena Koch", recipient: demoRecipients[8], amount: "$7600" },
  { id: "CNT-010", role: "Finance Operations", name: "Max Otto", recipient: demoRecipients[9], amount: "$7400" },
  { id: "CNT-011", role: "Security Engineer", name: "Iris Beck", recipient: demoRecipients[10], amount: "$7200" },
  { id: "CNT-012", role: "Data Engineer", name: "Elias Stern", recipient: demoRecipients[11], amount: "$7000" },
  { id: "CNT-013", role: "Mobile Engineer", name: "Mara Feld", recipient: demoRecipients[12], amount: "$6800" },
  { id: "CNT-014", role: "Designer", name: "Nina Graf", recipient: demoRecipients[13], amount: "$6600" },
  { id: "CNT-015", role: "Contributor Ops", name: "Tom Reich", recipient: demoRecipients[14], amount: "$6400" },
  { id: "CNT-016", role: "Support Lead", name: "Lea Blum", recipient: demoRecipients[15], amount: "$6200" },
  { id: "CNT-017", role: "Technical Writer", name: "Jan Wolf", recipient: demoRecipients[16], amount: "$6000" },
  { id: "CNT-018", role: "Cloud Engineer", name: "Mia Frank", recipient: demoRecipients[17], amount: "$5800" },
  { id: "CNT-019", role: "Research Engineer", name: "Kai Peters", recipient: demoRecipients[18], amount: "$5600" },
  { id: "CNT-020", role: "Operations Analyst", name: "Eva Schmid", recipient: demoRecipients[19], amount: "$5400" }
];

export function buildPain001Xml(input: Pain001BuildInput) {
  const totalUsd = input.payments.reduce((sum, payment) => sum + Number(amountValue(payment.amount) || "0"), 0);
  return `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pain.001.001.09">
  <CstmrCdtTrfInitn>
    <GrpHdr>
      <MsgId>${input.runId}</MsgId>
      <CreDtTm>${toIsoDate(input.executionDate)}</CreDtTm>
      <NbOfTxs>${input.payments.length}</NbOfTxs>
      <CtrlSum>${totalUsd.toFixed(2)}</CtrlSum>
      <InitgPty>
        <Nm>${input.companyName}</Nm>
      </InitgPty>
    </GrpHdr>
    <PmtInf>
      <PmtInfId>${input.runId}-P1</PmtInfId>
      <PmtMtd>TRF</PmtMtd>
      <ReqdExctnDt>${input.executionDate}</ReqdExctnDt>
      <Dbtr>
        <Nm>${input.companyName}</Nm>
      </Dbtr>
      <DbtrAcct>
        <Id>
          <IBAN>DEMO_COMPANY_IBAN</IBAN>
        </Id>
      </DbtrAcct>
      <DbtrAgt>
        <FinInstnId>
          <BICFI>DEMOUS33XXX</BICFI>
        </FinInstnId>
      </DbtrAgt>
      <ChrgBr>SLEV</ChrgBr>
${input.payments
  .map(
    (payment) => `      <CdtTrfTxInf>
        <PmtId>
          <EndToEndId>${payment.id}</EndToEndId>
        </PmtId>
        <Amt>
          <InstdAmt Ccy="USD">${amountValue(payment.amount)}</InstdAmt>
        </Amt>
        <Cdtr>
          <Nm>${payment.name} (${payment.role})</Nm>
        </Cdtr>
        <CdtrAcct>
          <Id>
            <Othr>
              <Id>${payment.recipient}</Id>
            </Othr>
          </Id>
        </CdtrAcct>
      </CdtTrfTxInf>`
  )
  .join("\n")}
    </PmtInf>
  </CstmrCdtTrfInitn>
</Document>
`;
}

export const demoPain001Xml = buildPain001Xml({
  companyName: "FHEVM DAO",
  runId: "FHEVM-APR-2026-001",
  executionDate: "2026-03-31",
  payments: demoPayments
});

const knownAddressPayments: Pain001Payment[] = [
  { id: "CNT-KNOWN-001", role: "Engineering", name: "Known Wallet 1", recipient: "0x08f8EaeC894Fdb6F2e6D8526dB2bf543DAcc9a41", amount: "$5555" },
  { id: "CNT-KNOWN-002", role: "Engineering", name: "Known Wallet 2", recipient: "0x134B68ff311DC9e0c7108F3aE690B913dC03dD5B", amount: "$5555" },
  { id: "CNT-KNOWN-003", role: "Engineering", name: "Known Wallet 3", recipient: "0xcDB2796aB24E3980Ef25344Ce331b932c03baBe3", amount: "$5555" },
  { id: "CNT-KNOWN-004", role: "Engineering", name: "Known Wallet 4", recipient: "0x141A175B5F443a0D7057B13E50f1DaEC15223180", amount: "$5555" },
  { id: "CNT-KNOWN-005", role: "Engineering", name: "Known Wallet 5", recipient: "0x63e1Ed4075AfDB5c9B59b4Fa2A242bBF99543C5B", amount: "$5555" }
];

export const knownAddressesPain001Xml = buildPain001Xml({
  companyName: "FHEVM DAO",
  runId: "FHEVM-KNOWN-ADDR-2026-001",
  executionDate: "2026-03-31",
  payments: knownAddressPayments
});

export function downloadDemoPain001Template() {
  const blob = new Blob([demoPain001Xml], { type: "application/xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "fhevm-dao-private-payroll.pain.001.xml";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function downloadKnownAddressesPain001Template() {
  const blob = new Blob([knownAddressesPain001Xml], { type: "application/xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "fhevm-dao-known-addresses-5555-sample.pain.001.xml";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function downloadPain001Template(xml: string, fileName = "cpay-payroll.pain.001.xml") {
  const blob = new Blob([xml], { type: "application/xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function downloadPain001SampleFile(fileName: string) {
  const anchor = document.createElement("a");
  anchor.href = `/pain001-samples/${fileName}`;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}
