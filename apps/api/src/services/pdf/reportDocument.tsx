// @ts-nocheck
import React from "react";
import { Document, Page, StyleSheet, Text, View, Svg, Circle, Path, Image, Font } from "@react-pdf/renderer";

Font.registerHyphenationCallback(word => [word]);
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ANIMAL_IMAGE: Record<string, string> = {
  koala: path.resolve(__dirname, "../../../../web/public/animals/koala.png"),
  hummingbird: path.resolve(__dirname, "../../../../web/public/animals/hummingbird.png"),
  tiger: path.resolve(__dirname, "../../../../web/public/animals/tiger.png"),
  meerkat: path.resolve(__dirname, "../../../../web/public/animals/meerkat.png"),
  stallion: path.resolve(__dirname, "../../../../web/public/animals/stallion.png"),
  fox: path.resolve(__dirname, "../../../../web/public/animals/fox.png"),
  rabbit: path.resolve(__dirname, "../../../../web/public/animals/rabbit.png"),
  elephant: path.resolve(__dirname, "../../../../web/public/animals/elephant.png"),
  dolphin: path.resolve(__dirname, "../../../../web/public/animals/dolphin.png"),
  hedgehog: path.resolve(__dirname, "../../../../web/public/animals/hedgehog.png"),
  bull: path.resolve(__dirname, "../../../../web/public/animals/bull.png"),
};

/* ─── Data Interfaces ─────────────────────────────────────────────────────── */

export interface ReportTemplateData {
  archetypeId: string;
  title: string;
  innerVoiceQuote: string;
  animalDescription: string;
  aboutChild: string;
  hiddenSuperpower: string;
  brainSections: Array<{ title: string; content: string }>;
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
  doNotSay: Array<{ insteadOf: string; tryThis: string }>;
  closingLine: string;
}

interface ReportDocumentProps {
  report: ReportTemplateData;
  childName: string;
}

/* ─── Theme ───────────────────────────────────────────────────────────────── */

interface ReportTheme {
  bg: string;
  text: string;
  muted: string;
  border: string;
  accent: string;
  accentDark: string;
  softAccent: string;
  dangerAccent: string;
  dangerSoft: string;
  successAccent: string;
  successSoft: string;
}

const DEFAULT_THEME: ReportTheme = {
  bg: "#FFFFFF",
  text: "#24323A",
  muted: "#6B7B86",
  border: "#D8DDE0",
  accent: "#7B2D8E",
  accentDark: "#5A1D6A",
  softAccent: "#F0E6F6",
  dangerAccent: "#C0392B",
  dangerSoft: "#FDEDEC",
  successAccent: "#27AE60",
  successSoft: "#E8F8F0",
};

const ARCHETYPE_THEMES: Record<string, Partial<ReportTheme>> = {
  koala: {
    accent: "#5E7A73",
    accentDark: "#3D5A53",
    softAccent: "#E8F1ED",
    muted: "#5B6F69",
  },
  hummingbird: {
    accent: "#D95F43",
    accentDark: "#B04530",
    softAccent: "#FFE7DF",
    muted: "#8C5040",
  },
  tiger: {
    accent: "#C97316",
    accentDark: "#A35D0F",
    softAccent: "#FFEFD9",
    muted: "#8A5A2F",
  },
  meerkat: {
    accent: "#A06A3C",
    accentDark: "#7C5028",
    softAccent: "#F5E8DA",
    muted: "#7B5C42",
  },
  stallion: {
    accent: "#4B5D8A",
    accentDark: "#354468",
    softAccent: "#E8ECF8",
    muted: "#4F5E7C",
  },
  fox: {
    accent: "#B65A2C",
    accentDark: "#8E4520",
    softAccent: "#FBE6DC",
    muted: "#7A4D37",
  },
  owl: {
    accent: "#3D5B73",
    accentDark: "#2A4052",
    softAccent: "#E5EEF4",
    muted: "#4A6072",
  },
};

function getTheme(archetypeId: string): ReportTheme {
  return { ...DEFAULT_THEME, ...(ARCHETYPE_THEMES[archetypeId] ?? {}) };
}

/* ─── Styles ──────────────────────────────────────────────────────────────── */

const s = StyleSheet.create({
  /* Page defaults */
  page: {
    paddingTop: 50,
    paddingBottom: 56,
    paddingHorizontal: 48,
    fontSize: 12,
    lineHeight: 1.6,
    fontFamily: "Helvetica",
  },
  coverPage: {
    paddingTop: 0,
    paddingBottom: 56,
    paddingHorizontal: 0,
    fontSize: 12,
    lineHeight: 1.6,
    fontFamily: "Helvetica",
  },

  /* ── Cover Hero ──────────────────────────── */
  heroSection: {
    paddingTop: 60,
    paddingBottom: 10,
    paddingHorizontal: 48,
    alignItems: "center",
  },
  heroBrandRow: {
    position: "absolute",
    top: 22,
    right: 48,
    alignItems: "flex-end",
  },
  heroBrand: {
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: 2.5,
    fontFamily: "Helvetica-Bold",
  },
  heroBrandSub: {
    fontSize: 7.5,
    marginTop: 1,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 700,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 2,
    marginBottom: 16,
    textAlign: "center",
  },
  heroLine: {
    height: 2,
    width: "100%",
    marginBottom: 20,
  },
  heroQuoteBox: {
    width: "100%",
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  heroQuoteImage: {
    width: 80,
    height: 80,
    marginRight: 14,
    objectFit: "contain",
  },
  heroQuoteRight: {
    flex: 1,
  },
  heroQuote: {
    fontSize: 13,
    fontStyle: "italic",
    textAlign: "left",
    lineHeight: 1.5,
  },
  heroAttribution: {
    fontSize: 11,
    marginTop: 8,
    textAlign: "left",
  },
  coverContent: {
    paddingHorizontal: 48,
    paddingTop: 24,
  },

  /* ── Header / Footer ─────────────────────── */
  header: {
    position: "absolute",
    top: 20,
    right: 48,
    alignItems: "flex-end",
  },
  headerBrand: {
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: 2.5,
    fontFamily: "Helvetica-Bold",
  },
  headerSub: {
    fontSize: 7.5,
    marginTop: 1,
  },
  footer: {
    position: "absolute",
    bottom: 22,
    left: 48,
    right: 48,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 0.5,
    borderTopStyle: "solid",
    paddingTop: 8,
  },
  footerText: {
    fontSize: 7.5,
    letterSpacing: 0.5,
  },
  footerPage: {
    fontSize: 8,
    fontWeight: 700,
    fontFamily: "Helvetica-Bold",
  },

  /* ── Section Labels ──────────────────────── */
  sectionLabel: {
    fontSize: 9.5,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 2,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
    marginTop: 24,
  },
  sectionLabelFirst: {
    marginTop: 0,
  },
  sectionUnderline: {
    height: 1.5,
    marginBottom: 12,
    width: 40,
  },

  /* ── Body Text ───────────────────────────── */
  paragraph: {
    fontSize: 11.5,
    lineHeight: 1.6,
  },
  paragraphSpaced: {
    fontSize: 11.5,
    lineHeight: 1.6,
    marginTop: 8,
  },

  /* ── Sub-section ─────────────────────────── */
  subSection: {
    marginBottom: 14,
  },
  subTitle: {
    fontSize: 12,
    fontWeight: 700,
    fontFamily: "Helvetica-Bold",
    marginBottom: 3,
  },

  /* ── Drains / Fuels ──────────────────────── */
  dfContainer: {
    flexDirection: "row",
  },
  dfColumn: {
    flex: 1,
  },
  dfHeader: {
    paddingVertical: 7,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  dfHeaderIcon: {
    fontSize: 11,
    fontWeight: 700,
    fontFamily: "Helvetica-Bold",
    marginRight: 6,
  },
  dfHeaderText: {
    fontSize: 8.5,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    fontFamily: "Helvetica-Bold",
  },
  dfItem: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    fontSize: 10.5,
    lineHeight: 1.45,
  },

  /* ── Affirmations ────────────────────────── */
  affirmationItem: {
    marginBottom: 5,
    paddingLeft: 4,
  },
  affirmationText: {
    fontSize: 11.5,
    lineHeight: 1.5,
    fontStyle: "italic",
  },

  /* ── "What Not to Say" Table ─────────────── */
  sayTable: {
    marginTop: 4,
  },
  sayHeaderRow: {
    flexDirection: "row",
  },
  sayHeaderCell: {
    flex: 1,
    paddingVertical: 7,
    paddingHorizontal: 10,
  },
  sayRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomStyle: "solid",
  },
  sayCell: {
    flex: 1,
    paddingVertical: 7,
    paddingHorizontal: 10,
    fontSize: 11,
    lineHeight: 1.45,
  },

  /* ── Closing ─────────────────────────────── */
  closingWrapper: {
    marginTop: 32,
    alignItems: "center",
  },
  closingDivider: {
    height: 1,
    width: "100%",
    marginBottom: 14,
  },
  closingDividerBottom: {
    height: 1,
    width: "100%",
    marginTop: 14,
  },
  closingText: {
    fontSize: 13,
    fontStyle: "italic",
    textAlign: "center",
    lineHeight: 1.6,
  },
});

/* ─── SVG Icons ──────────────────────────────────────────────────────────── */

function CheckIcon({ size = 11, color = "#27AE60" }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx="12" cy="12" r="12" fill={color} />
      <Path d="M7 12.5l3.5 3.5 7-7" stroke="white" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function XIcon({ size = 11, color = "#C0392B" }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx="12" cy="12" r="12" fill={color} />
      <Path d="M8 8l8 8M16 8l-8 8" stroke="white" strokeWidth={3} strokeLinecap="round" />
    </Svg>
  );
}

/* ─── Helper Components ───────────────────────────────────────────────────── */

function ParagraphText({ text }: { text: string }) {
  const paragraphs = text.split("\n").filter((p) => p.trim().length > 0);
  return (
    <View>
      {paragraphs.map((para, i) => (
        <Text key={i} style={i === 0 ? s.paragraph : s.paragraphSpaced}>
          {para}
        </Text>
      ))}
    </View>
  );
}

function SectionLabel({
  text,
  theme,
  first,
}: {
  text: string;
  theme: ReportTheme;
  first?: boolean;
}) {
  return (
    <View wrap={false} minPresenceAhead={200}>
      <Text
        style={[
          s.sectionLabel,
          { color: theme.accent },
          first ? s.sectionLabelFirst : {},
        ]}
      >
        {text}
      </Text>
      <View style={[s.sectionUnderline, { backgroundColor: theme.accent }]} />
    </View>
  );
}

function Header({ theme }: { theme: ReportTheme }) {
  return (
    <View style={s.header} fixed>
      <Text style={[s.headerBrand, { color: theme.accent }]}>ADHD PERSONALITY REPORT</Text>
      <Text style={[s.headerSub, { color: theme.muted }]}>
        Your child's unique profile
      </Text>
    </View>
  );
}

function DynamicFooter({ theme }: { theme: ReportTheme }) {
  return (
    <View style={[s.footer, { borderTopColor: theme.border }]} fixed>
      <Text style={[s.footerText, { color: theme.muted }]}>
        ADHD PERSONALITY REPORT · A personalized profile for your child
      </Text>
      <Text
        style={[s.footerPage, { color: theme.accent }]}
        render={({ pageNumber, totalPages }) => `${pageNumber}`}
      />
    </View>
  );
}

/* ─── Main Document ───────────────────────────────────────────────────────── */

export function ReportDocument({ report, childName }: ReportDocumentProps) {
  const theme = getTheme(report.archetypeId);
  const NAME = childName.toUpperCase();

  return (
    <Document title={`${childName} ${report.title}`}>
      {/* ════════════════ PAGE 1 — COVER ════════════════ */}
      <Page
        size="A4"
        style={[s.coverPage, { backgroundColor: theme.bg, color: theme.text }]}
      >
        {/* Hero Section */}
        <View style={s.heroSection}>
          <View style={s.heroBrandRow}>
            <Text style={[s.heroBrand, { color: theme.accent }]}>ADHD PERSONALITY REPORT</Text>
            <Text style={[s.heroBrandSub, { color: theme.muted }]}>
              Your child's unique profile
            </Text>
          </View>
          <Text style={[s.heroTitle, { color: theme.accent }]}>
            {report.title}
          </Text>
          <View style={[s.heroLine, { backgroundColor: theme.accent }]} />
          <View style={[s.heroQuoteBox, { backgroundColor: theme.softAccent }]}>
            {ANIMAL_IMAGE[report.archetypeId] && (
              <Image src={ANIMAL_IMAGE[report.archetypeId]} style={s.heroQuoteImage} />
            )}
            <View style={s.heroQuoteRight}>
              <Text style={[s.heroQuote, { color: theme.text }]}>
                {`\u201C${report.innerVoiceQuote.trim()}\u201D`}
              </Text>
              <Text style={[s.heroAttribution, { color: theme.muted }]}>
                {`\u2014 ${childName}`}
              </Text>
            </View>
          </View>
        </View>

        {/* Content below hero */}
        <View style={s.coverContent}>
          <SectionLabel text="THE ANIMAL" theme={theme} first />
          <ParagraphText text={report.animalDescription} />

          <SectionLabel text={`ABOUT ${NAME}`} theme={theme} />
          <ParagraphText text={report.aboutChild} />
        </View>

        <DynamicFooter theme={theme} />
      </Page>

      {/* ════════════════ PAGES 2+ — ALL REMAINING CONTENT (wraps automatically) ════════════════ */}
      <Page
        size="A4"
        style={[s.page, { backgroundColor: theme.bg, color: theme.text }]}
        wrap
      >
        <Header theme={theme} />
        <DynamicFooter theme={theme} />

        {/* ── Hidden Superpower ── */}
        <SectionLabel text={`${NAME}'S HIDDEN SUPERPOWER`} theme={theme} first />
        <ParagraphText text={report.hiddenSuperpower} />

        {/* ── Understanding Brain ── */}
        <SectionLabel text={`UNDERSTANDING ${NAME}'S BRAIN`} theme={theme} />
        {report.brainSections.map((section) => (
          <View key={section.title} style={s.subSection} wrap={false}>
            <Text style={[s.subTitle, { color: theme.accent }]}>
              {section.title}
            </Text>
            <ParagraphText text={section.content} />
          </View>
        ))}

        {/* ── A Day in Life ── */}
        <SectionLabel text={`A DAY IN ${NAME}'S LIFE`} theme={theme} />
        {[
          { label: "Morning", text: report.dayInLife.morning },
          { label: "School", text: report.dayInLife.school },
          { label: "After School", text: report.dayInLife.afterSchool },
          { label: "Bedtime", text: report.dayInLife.bedtime },
        ].map((block) => (
          <View key={block.label} style={s.subSection} wrap={false}>
            <Text style={[s.subTitle, { color: theme.accent }]}>
              {block.label}
            </Text>
            <ParagraphText text={block.text} />
          </View>
        ))}

        {/* ── Drains / Fuels ── */}
        <View wrap={false}>
        <SectionLabel
          text={`CONNECTING WITH ${NAME} AND WHAT FUELS THEM`}
          theme={theme}
        />
        <View style={s.dfContainer}>
          {/* Drains */}
          <View style={s.dfColumn}>
            <View style={[s.dfHeader, { backgroundColor: theme.dangerSoft }]}>
              <Text style={[s.dfHeaderIcon, { color: theme.dangerAccent }]}>
                ✕
              </Text>
              <Text style={[s.dfHeaderText, { color: theme.dangerAccent }]}>
                WHAT DRAINS {NAME}
              </Text>
            </View>
            {report.drains.map((item, i) => (
              <View key={`d-${i}`} style={[s.dfItem, { flexDirection: "row", alignItems: "flex-start" }]}>
                <View style={{ width: 18, paddingTop: 1 }}><XIcon size={10} color={theme.dangerAccent} /></View>
                <Text style={{ flex: 1, fontSize: 10.5, lineHeight: 1.45 }}>{item}</Text>
              </View>
            ))}
          </View>
          {/* Fuels */}
          <View style={s.dfColumn}>
            <View style={[s.dfHeader, { backgroundColor: theme.successSoft }]}>
              <Text style={[s.dfHeaderIcon, { color: theme.successAccent }]}>
                ✓
              </Text>
              <Text style={[s.dfHeaderText, { color: theme.successAccent }]}>
                WHAT FUELS {NAME}
              </Text>
            </View>
            {report.fuels.map((item, i) => (
              <View key={`f-${i}`} style={[s.dfItem, { flexDirection: "row", alignItems: "flex-start" }]}>
                <View style={{ width: 18, paddingTop: 1 }}><CheckIcon size={10} color={theme.successAccent} /></View>
                <Text style={{ flex: 1, fontSize: 10.5, lineHeight: 1.45 }}>{item}</Text>
              </View>
            ))}
          </View>
        </View>
        </View>

        {/* ── Overwhelm ── */}
        <SectionLabel text={`WHEN ${NAME} GETS OVERWHELMED`} theme={theme} />
        <ParagraphText text={report.overwhelm} />

        {/* ── Affirmations ── */}
        <SectionLabel text={`WHAT ${NAME} NEEDS TO HEAR MOST`} theme={theme} />
        <View>
          {report.affirmations.map((aff, i) => (
            <View key={`aff-${i}`} style={s.affirmationItem}>
              <Text style={[s.affirmationText, { color: theme.text }]}>
                {aff}
              </Text>
            </View>
          ))}
        </View>

        {/* ── What Not to Say ── */}
        <SectionLabel text="WHAT NOT TO SAY AND WHAT TO SAY INSTEAD" theme={theme} />
        <View style={s.sayTable} wrap={false}>
          <View style={s.sayHeaderRow}>
            <View
              style={[
                s.sayHeaderCell,
                { backgroundColor: theme.dangerSoft, flexDirection: "row", alignItems: "center" },
              ]}
            >
              <Text style={{ fontSize: 9, fontWeight: 700, fontFamily: "Helvetica-Bold", color: theme.dangerAccent, marginRight: 5 }}>
                ✕
              </Text>
              <Text style={{ fontSize: 8.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, fontFamily: "Helvetica-Bold", color: theme.dangerAccent }}>
                INSTEAD OF...
              </Text>
            </View>
            <View
              style={[
                s.sayHeaderCell,
                { backgroundColor: theme.successSoft, flexDirection: "row", alignItems: "center" },
              ]}
            >
              <Text style={{ fontSize: 9, fontWeight: 700, fontFamily: "Helvetica-Bold", color: theme.successAccent, marginRight: 5 }}>
                ✓
              </Text>
              <Text style={{ fontSize: 8.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, fontFamily: "Helvetica-Bold", color: theme.successAccent }}>
                TRY...
              </Text>
            </View>
          </View>
          {report.doNotSay.map((pair, i) => (
            <View
              key={`say-${i}`}
              style={[
                s.sayRow,
                {
                  borderBottomColor: theme.border,
                },
              ]}
            >
              <View style={[s.sayCell, { flexDirection: "row", alignItems: "flex-start" }]}>
                <View style={{ width: 18, paddingTop: 1 }}><XIcon size={10} color={theme.dangerAccent} /></View>
                <Text style={{ flex: 1, fontSize: 11, lineHeight: 1.45 }}>{pair.insteadOf}</Text>
              </View>
              <View style={[s.sayCell, { flexDirection: "row", alignItems: "flex-start" }]}>
                <View style={{ width: 18, paddingTop: 1 }}><CheckIcon size={10} color={theme.successAccent} /></View>
                <Text style={{ flex: 1, fontSize: 11, lineHeight: 1.45 }}>{pair.tryThis}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* ── Closing ── */}
        <View style={s.closingWrapper} wrap={false}>
          <View style={[s.closingDivider, { backgroundColor: theme.accent }]} />
          <Text style={[s.closingText, { color: theme.accent }]}>
            {report.closingLine}
          </Text>
          <View style={[s.closingDividerBottom, { backgroundColor: theme.accent }]} />
        </View>

        {/* ── Disclaimer ── */}
        <View style={{ marginTop: 40 }} wrap={false}>
          <Text style={{ fontSize: 8, lineHeight: 1.5, color: theme.muted, textAlign: "center" }}>
            This report is for informational and educational purposes only. It is not a clinical assessment, diagnosis, or substitute for professional evaluation. If you have concerns about your child's development, please consult a qualified healthcare provider.
          </Text>
        </View>
      </Page>
    </Document>
  );
}

export default ReportDocument;
