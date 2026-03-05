// @ts-nocheck
import React from "react";
import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

export interface ReportTemplateData {
  archetypeId: string;
  title: string;
  innerVoiceQuote: string;
  animalDescription: string;
  aboutChild: string;
  hiddenSuperpower: string;
  brainSections: Array<{
    title: string;
    content: string;
  }>;
  dayInLife: {
    morning: string;
    school: string;
    afterSchool: string;
    bedtime: string;
  };
  drains: string[];
  fuels: string[];
  overwhelm: string;
  affirmations: string[];
  doNotSay: Array<{
    insteadOf: string;
    tryThis: string;
  }>;
  closingLine: string;
}

interface ReportDocumentProps {
  report: ReportTemplateData;
  childName: string;
}

const colors = {
  bg: "#F7F5F2",
  text: "#24323A",
  muted: "#4F6D7A",
  card: "#FFFFFF",
  border: "#D8D5CF",
  accent: "#4F6D7A",
  softAccent: "#E9F4F1",
  dangerSoft: "#FEF2F2",
  successSoft: "#F0F9F6",
};

const styles = StyleSheet.create({
  page: {
    backgroundColor: colors.bg,
    paddingTop: 38,
    paddingBottom: 38,
    paddingHorizontal: 40,
    color: colors.text,
    fontSize: 10.6,
    lineHeight: 1.5,
  },
  pageLabel: {
    fontSize: 9,
    color: colors.muted,
    marginBottom: 14,
  },
  hero: {
    marginBottom: 14,
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    textTransform: "uppercase",
    marginBottom: 10,
    color: colors.accent,
  },
  centeredQuote: {
    fontSize: 11,
    fontStyle: "italic",
    textAlign: "center",
    marginBottom: 10,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomStyle: "solid",
    borderBottomColor: colors.accent,
    marginBottom: 12,
  },
  section: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 13.5,
    fontWeight: 700,
    marginBottom: 4,
    color: colors.accent,
  },
  paragraph: {
    fontSize: 10.6,
    lineHeight: 1.5,
  },
  dayBlock: {
    marginBottom: 8,
  },
  dayTitle: {
    fontSize: 11.2,
    fontWeight: 700,
    marginBottom: 2,
    color: colors.accent,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.accent,
    borderBottomStyle: "solid",
    paddingBottom: 4,
    marginBottom: 4,
  },
  tableHeaderCell: {
    flex: 1,
    fontSize: 10,
    fontWeight: 700,
    textAlign: "center",
  },
  twoColRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  twoColCellLeft: {
    flex: 1,
    paddingRight: 6,
  },
  twoColCellRight: {
    flex: 1,
    paddingLeft: 6,
  },
  rowText: {
    fontSize: 10.4,
    lineHeight: 1.4,
  },
  listItem: {
    flexDirection: "row",
    marginBottom: 2,
  },
  bullet: {
    width: 9,
    fontSize: 11,
  },
  listText: {
    flex: 1,
    fontSize: 10.5,
    lineHeight: 1.4,
    fontStyle: "italic",
  },
  sayTableHeader: {
    flexDirection: "row",
    marginBottom: 4,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: colors.accent,
    backgroundColor: colors.softAccent,
  },
  sayHeaderCell: {
    flex: 1,
    paddingVertical: 5,
    textAlign: "center",
    fontSize: 10,
    fontWeight: 700,
  },
  sayRow: {
    flexDirection: "row",
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderStyle: "solid",
    borderColor: colors.border,
  },
  sayCell: {
    flex: 1,
    paddingVertical: 5,
    paddingHorizontal: 7,
    fontSize: 10.4,
  },
  closing: {
    marginTop: 8,
    fontSize: 11,
    fontStyle: "italic",
  },
});

function BulletList({ items }: { items: string[] }) {
  return (
    <View>
      {items.map((item, index) => (
        <View key={`${item}-${index}`} style={styles.listItem}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.listText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

export function ReportDocument({ report, childName }: ReportDocumentProps) {
  return (
    <Document title={`${childName} - ${report.title}`}>
      <Page size="A4" style={styles.page}>
        <Text style={styles.pageLabel}>PAGE 1</Text>
        <View style={styles.hero}>
          <Text style={styles.title}>{report.title}</Text>
          <Text style={styles.centeredQuote}>
            "{report.innerVoiceQuote}" - {childName}
          </Text>
        </View>
        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>The Animal</Text>
          <Text style={styles.paragraph}>{report.animalDescription}</Text>
        </View>
        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About {childName}</Text>
          <Text style={styles.paragraph}>{report.aboutChild}</Text>
        </View>
        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{childName}'s Hidden Superpower</Text>
          <Text style={styles.paragraph}>{report.hiddenSuperpower}</Text>
        </View>
      </Page>

      <Page size="A4" style={styles.page}>
        <Text style={styles.pageLabel}>PAGE 2</Text>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Understanding {childName}'s Brain</Text>
          {report.brainSections.map((brainSection) => (
            <View key={brainSection.title} style={styles.dayBlock}>
              <Text style={styles.dayTitle}>{brainSection.title}</Text>
              <Text style={styles.paragraph}>{brainSection.content}</Text>
            </View>
          ))}
        </View>
        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>A Day in {childName}'s Life</Text>
          <View style={styles.dayBlock}>
            <Text style={styles.dayTitle}>Morning</Text>
            <Text style={styles.paragraph}>{report.dayInLife.morning}</Text>
          </View>
          <View style={styles.dayBlock}>
            <Text style={styles.dayTitle}>School</Text>
            <Text style={styles.paragraph}>{report.dayInLife.school}</Text>
          </View>
          <View style={styles.dayBlock}>
            <Text style={styles.dayTitle}>After School</Text>
            <Text style={styles.paragraph}>{report.dayInLife.afterSchool}</Text>
          </View>
          <View style={styles.dayBlock}>
            <Text style={styles.dayTitle}>Bedtime</Text>
            <Text style={styles.paragraph}>{report.dayInLife.bedtime}</Text>
          </View>
        </View>
      </Page>

      <Page size="A4" style={styles.page}>
        <Text style={styles.pageLabel}>PAGE 3</Text>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            What Drains {childName} - and What Fuels Them
          </Text>
          <View style={styles.tableHeader}>
            <Text style={styles.tableHeaderCell}>Drains</Text>
            <Text style={styles.tableHeaderCell}>Fuels</Text>
          </View>
          {Array.from({
            length: Math.max(report.drains.length, report.fuels.length),
          }).map((_, index) => (
            <View key={`row-${index}`} style={styles.twoColRow}>
              <View style={styles.twoColCellLeft}>
                <Text style={styles.rowText}>{report.drains[index] ?? ""}</Text>
              </View>
              <View style={styles.twoColCellRight}>
                <Text style={styles.rowText}>{report.fuels[index] ?? ""}</Text>
              </View>
            </View>
          ))}
        </View>
        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>When {childName} Gets Overwhelmed</Text>
          <Text style={styles.paragraph}>{report.overwhelm}</Text>
        </View>
        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What {childName} Needs to Hear Most</Text>
          <BulletList items={report.affirmations} />
        </View>
        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            What NOT to Say - and What to Say Instead
          </Text>
          <View style={styles.sayTableHeader}>
            <Text style={styles.sayHeaderCell}>Instead of...</Text>
            <Text style={styles.sayHeaderCell}>Try...</Text>
          </View>
          {report.doNotSay.map((pair, index) => (
            <View key={`say-${index}`} style={styles.sayRow}>
              <Text style={styles.sayCell}>{pair.insteadOf}</Text>
              <Text style={styles.sayCell}>{pair.tryThis}</Text>
            </View>
          ))}
        </View>
        <View style={styles.divider} />

        <Text style={styles.closing}>{report.closingLine}</Text>
      </Page>
    </Document>
  );
}

export default ReportDocument;
