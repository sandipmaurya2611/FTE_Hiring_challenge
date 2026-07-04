import React from "react";
import { Document, Page, Text, View, StyleSheet, Link } from "@react-pdf/renderer";
import { ReportData } from "../../types";

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#0a0a0a",
    padding: 40,
    fontFamily: "Helvetica",
    color: "#ededed",
  },
  header: {
    marginBottom: 24,
    borderBottom: "1 solid #222222",
    paddingBottom: 16,
  },
  badge: {
    fontSize: 7,
    color: "#FBBF24",
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  companyName: {
    fontSize: 24,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
    marginBottom: 4,
  },
  website: {
    fontSize: 9,
    color: "#71717a",
  },
  sectionTitle: {
    fontSize: 7,
    color: "#FBBF24",
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 8,
    marginTop: 20,
  },
  card: {
    backgroundColor: "#111111",
    borderRadius: 6,
    padding: 12,
    border: "1 solid #1e1e1e",
    marginBottom: 8,
  },
  cardLabel: {
    fontSize: 7,
    color: "#52525b",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 10,
    color: "#d4d4d8",
  },
  bodyText: {
    fontSize: 10,
    color: "#a1a1aa",
    lineHeight: 1.6,
  },
  pill: {
    backgroundColor: "#111111",
    border: "1 solid #1e1e1e",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 6,
    marginBottom: 6,
  },
  pillText: {
    fontSize: 9,
    color: "#d4d4d8",
  },
  pillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  bullet: {
    flexDirection: "row",
    marginBottom: 6,
    alignItems: "flex-start",
  },
  bulletDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#FBBF24",
    marginRight: 8,
    marginTop: 3,
  },
  bulletText: {
    flex: 1,
    fontSize: 10,
    color: "#a1a1aa",
    lineHeight: 1.5,
  },
  competitorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  competitorCard: {
    backgroundColor: "#111111",
    border: "1 solid #1e1e1e",
    borderRadius: 6,
    padding: 10,
    width: "30%",
    marginBottom: 6,
  },
  competitorName: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
    marginBottom: 3,
  },
  competitorWebsite: {
    fontSize: 8,
    color: "#60a5fa",
  },
  contactRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 4,
  },
  contactCard: {
    flex: 1,
    backgroundColor: "#111111",
    borderRadius: 6,
    padding: 10,
    border: "1 solid #1e1e1e",
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    borderTop: "1 solid #1a1a1a",
    paddingTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: {
    fontSize: 7,
    color: "#3f3f46",
  },
});

interface Props {
  report: ReportData;
}

export function ReportDocument({ report }: Props) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.badge}>Company Intelligence Report</Text>
          <Text style={styles.companyName}>{report.companyName}</Text>
          <Text style={styles.website}>{report.website}</Text>
        </View>

        {/* Contact Info */}
        <View style={styles.contactRow}>
          <View style={styles.contactCard}>
            <Text style={styles.cardLabel}>Phone</Text>
            <Text style={styles.cardValue}>{report.phone || "Not available"}</Text>
          </View>
          <View style={styles.contactCard}>
            <Text style={styles.cardLabel}>Address</Text>
            <Text style={styles.cardValue}>{report.address || "Not available"}</Text>
          </View>
        </View>

        {/* Summary */}
        {report.summary && (
          <>
            <Text style={styles.sectionTitle}>Company Summary</Text>
            <Text style={styles.bodyText}>{report.summary}</Text>
          </>
        )}

        {/* Products */}
        {report.products?.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Products & Services</Text>
            <View style={styles.pillsRow}>
              {report.products.map((p, i) => (
                <View key={i} style={styles.pill}>
                  <Text style={styles.pillText}>{p}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Pain Points */}
        {report.painPoints?.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>AI-Generated Pain Points</Text>
            {report.painPoints.map((pt, i) => (
              <View key={i} style={styles.bullet}>
                <View style={styles.bulletDot} />
                <Text style={styles.bulletText}>{pt}</Text>
              </View>
            ))}
          </>
        )}

        {/* Competitors */}
        {report.competitors?.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Competitors</Text>
            <View style={styles.competitorGrid}>
              {report.competitors.map((c, i) => (
                <View key={i} style={styles.competitorCard}>
                  <Text style={styles.competitorName}>{c.name}</Text>
                  <Text style={styles.competitorWebsite}>{c.website}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>Relu Consultancy · Company Intelligence</Text>
          <Text style={styles.footerText}>Generated by AI Research Assistant</Text>
        </View>
      </Page>
    </Document>
  );
}
