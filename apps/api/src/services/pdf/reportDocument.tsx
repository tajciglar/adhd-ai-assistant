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

interface ReportTheme {
  bg: string;
  text: "#24323A",
  muted: string;
  border: string;
  accent: string;
  softAccent: string;
  dangerSoft: string;
  successSoft: string;
}

const DEFAULT_THEME: ReportTheme = {
  bg: "#F7F5F2",
  text: "#24323A",
  muted: "#4F6D7A",
  border: "#D8D5CF",
  accent: "#4F6D7A",
  softAccent: "#E9F4F1",
  dangerSoft: "#FEF2F2",
  successSoft: "#F0F9F6",
};

const ARCTYPE_THEMES: Record<string, Partial<ReportTheme>> = {
  koala: {
    bg: "#F4F8F6",
    accent: "#5E7A73",
    muted: "#5B6F69",
    softAccent: "#E8F1ED",
  },
  hummingbird: {
    bg: "#FFF6F1",
    accent: "#D95F43",
    muted: "#8C5040",
    softAccent: "#FFE7DF",
  },
  tiger: {
    bg: "#FFF7EE",
    accent: "#C97316",
    muted: "#8A5A2F",
    softAccent: "#FFEFD9",
  },
  meerkat: {
    bg: "#FBF6EF",
    accent: "#A06A3C",
    muted: "#7B5C42",
    softAccent: "#F5E8DA",
  },
  stallion: {
    bg: "#F3F5FB",
    accent: "#4B5D8A",
    muted: "#4F5E7C",
    softAccent: "#E8ECF8",
  },
  fox: {
    bg: "#FFF4EE",
    accent: "#B65A2C",
    muted: "#7A4D37",
    softAccent: "#FBE6DC",
  },
  owl: {
    bg: "#F2F7FA",
    accent: "#3D5B73",
    muted: "#4A6072",
    softAccent: "#E5EEF4",
  },
};

function getTheme(archetypeId: string): ReportTheme {
  return {
    ...DEFAULT_THEME,
    ...(ARCTYPE_THEMES[archetypeId] ?? {}),
  };
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 38,
    paddingBottom: 38,
    paddingHorizontal: 40,
    fontSize: 10.6,
    lineHeight: 1.5,
  },
  pageLabel: {
    fontSize: 9,
    marginBottom: 14,
  },
  hero: {
    marginBottom: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: "solid",
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    textTransform: "uppercase",
    marginBottom: 10,
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
    marginBottom: 12,
  },
  section: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 13.5,
    fontWeight: 700,
    marginBottom: 4,
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
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomStyle: "solid",
    paddingBottom: 4,
    marginBottom: 4,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    paddingTop: 4,
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
  const theme = getTheme(report.archetypeId);

  return (
    <Document title={`${childName} - ${report.title}`}>
      <Page size="A4" style={[styles.page, { backgroundColor: theme.bg, color: theme.text }]}>
        <Text style={[styles.pageLabel, { color: theme.muted }]}>PAGE 1</Text>
        <View style={[styles.hero, { backgroundColor: theme.softAccent, borderColor: theme.border }]}>
          <Text style={[styles.title, { color: theme.accent }]}>{report.title}</Text>
          <Text style={[styles.centeredQuote, { color: theme.muted }]}>
            "{report.innerVoiceQuote}" - {childName}
          </Text>
        </View>
        <View style={[styles.divider, { borderBottomColor: theme.accent }]} />

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.accent }]}>The Animal</Text>
          <Text style={styles.paragraph}>{report.animalDescription}</Text>
        </View>
        <View style={[styles.divider, { borderBottomColor: theme.accent }]} />

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.accent }]}>About {childName}</Text>
          <Text style={styles.paragraph}>{report.aboutChild}</Text>
        </View>
        <View style={[styles.divider, { borderBottomColor: theme.accent }]} />

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.accent }]}>
            {childName}'s Hidden Superpower
          </Text>
          <Text style={styles.paragraph}>{report.hiddenSuperpower}</Text>
        </View>
      </Page>

      <Page size="A4" style={[styles.page, { backgroundColor: theme.bg, color: theme.text }]}>
        <Text style={[styles.pageLabel, { color: theme.muted }]}>PAGE 2</Text>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.accent }]}>
            Understanding {childName}'s Brain
          </Text>
          {report.brainSections.map((brainSection) => (
            <View key={brainSection.title} style={styles.dayBlock}>
              <Text style={[styles.dayTitle, { color: theme.accent }]}>{brainSection.title}</Text>
              <Text style={styles.paragraph}>{brainSection.content}</Text>
            </View>
          ))}
        </View>
        <View style={[styles.divider, { borderBottomColor: theme.accent }]} />

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.accent }]}>
            A Day in {childName}'s Life
          </Text>
          <View style={styles.dayBlock}>
            <Text style={[styles.dayTitle, { color: theme.accent }]}>Morning</Text>
            <Text style={styles.paragraph}>{report.dayInLife.morning}</Text>
          </View>
          <View style={styles.dayBlock}>
            <Text style={[styles.dayTitle, { color: theme.accent }]}>School</Text>
            <Text style={styles.paragraph}>{report.dayInLife.school}</Text>
          </View>
          <View style={styles.dayBlock}>
            <Text style={[styles.dayTitle, { color: theme.accent }]}>After School</Text>
            <Text style={styles.paragraph}>{report.dayInLife.afterSchool}</Text>
          </View>
          <View style={styles.dayBlock}>
            <Text style={[styles.dayTitle, { color: theme.accent }]}>Bedtime</Text>
            <Text style={styles.paragraph}>{report.dayInLife.bedtime}</Text>
          </View>
        </View>
      </Page>

      <Page size="A4" style={[styles.page, { backgroundColor: theme.bg, color: theme.text }]}>
        <Text style={[styles.pageLabel, { color: theme.muted }]}>PAGE 3</Text>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.accent }]}>
            What Drains {childName} - and What Fuels Them
          </Text>
          <View
            style={[
              styles.tableHeader,
              {
                borderBottomColor: theme.accent,
                backgroundColor: theme.softAccent,
              },
            ]}
          >
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
        <View style={[styles.divider, { borderBottomColor: theme.accent }]} />

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.accent }]}>
            When {childName} Gets Overwhelmed
          </Text>
          <Text style={styles.paragraph}>{report.overwhelm}</Text>
        </View>
        <View style={[styles.divider, { borderBottomColor: theme.accent }]} />

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.accent }]}>
            What {childName} Needs to Hear Most
          </Text>
          <BulletList items={report.affirmations} />
        </View>
        <View style={[styles.divider, { borderBottomColor: theme.accent }]} />

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.accent }]}>
            What NOT to Say - and What to Say Instead
          </Text>
          <View
            style={[
              styles.sayTableHeader,
              {
                borderColor: theme.accent,
                backgroundColor: theme.softAccent,
              },
            ]}
          >
            <Text style={styles.sayHeaderCell}>Instead of...</Text>
            <Text style={styles.sayHeaderCell}>Try...</Text>
          </View>
          {report.doNotSay.map((pair, index) => (
            <View key={`say-${index}`} style={[styles.sayRow, { borderColor: theme.border }]}>
              <Text style={styles.sayCell}>{pair.insteadOf}</Text>
              <Text style={styles.sayCell}>{pair.tryThis}</Text>
            </View>
          ))}
        </View>
        <View style={[styles.divider, { borderBottomColor: theme.accent }]} />

        <Text style={[styles.closing, { color: theme.accent }]}>{report.closingLine}</Text>
      </Page>
    </Document>
  );
}

export default ReportDocument;
