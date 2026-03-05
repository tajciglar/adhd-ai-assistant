import React from "react";
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import ReportDocument, { type ReportTemplateData } from "./reportDocument.js";

interface ChildForReport {
  name: string;
}

export async function generateReportPdf(
  report: ReportTemplateData,
  child: ChildForReport,
): Promise<Buffer> {
  const document = React.createElement(ReportDocument, {
    report,
    childName: child.name,
  }) as unknown as React.ReactElement<DocumentProps>;

  return renderToBuffer(document);
}
