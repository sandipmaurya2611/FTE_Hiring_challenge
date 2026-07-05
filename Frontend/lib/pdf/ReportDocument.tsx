import React from "react";
import { Document, Page, Text, View, StyleSheet, Link } from "@react-pdf/renderer";
import { ReportData } from "../../types";

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#ffffff",
    fontFamily: "Helvetica",
  },
  headerContainer: {
    backgroundColor: "#0a0a0a",
    paddingTop: 50,
    paddingBottom: 40,
    paddingHorizontal: 50,
  },
  goldBar: {
    height: 10,
    backgroundColor: "#C49B45",
  },
  headerBadge: {
    color: "#C49B45",
    fontSize: 9,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  headerTitle: {
    color: "#ffffff",
    fontSize: 32,
    fontFamily: "Helvetica",
  },
  contentContainer: {
    paddingTop: 10,
    paddingHorizontal: 50,
    paddingBottom: 50,
  },
  sectionTitle: {
    color: "#C49B45",
    fontSize: 11,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginTop: 25,
    marginBottom: 8,
  },
  sectionDivider: {
    borderBottomWidth: 1,
    borderBottomColor: "#eeeeee",
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 10,
  },
  infoLabel: {
    width: 100,
    color: "#666666",
    fontSize: 10,
  },
  infoValue: {
    flex: 1,
    color: "#333333",
    fontSize: 10,
  },
  bodyText: {
    color: "#333333",
    fontSize: 10,
    lineHeight: 1.6,
  },
  bulletRow: {
    flexDirection: "row",
    marginBottom: 8,
    alignItems: "flex-start",
  },
  bulletDot: {
    width: 15,
    fontSize: 10,
    color: "#666666",
  },
  bulletText: {
    flex: 1,
    fontSize: 10,
    color: "#333333",
    lineHeight: 1.5,
  },
  competitorRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  competitorName: {
    width: 120,
    color: "#333333",
    fontSize: 10,
  },
  competitorWebsite: {
    flex: 1,
    color: "#777777",
    fontSize: 10,
  },
});

interface Props {
  report: ReportData;
}

export function ReportDocument({ report }: Props) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerContainer} fixed>
          <Text style={styles.headerBadge}>RELU CONSULTANCY · COMPANY RESEARCH REPORT</Text>
          <Text style={styles.headerTitle}>{report.companyName}</Text>
        </View>
        <View style={styles.goldBar} fixed />

        <View style={styles.contentContainer}>
          {/* Company Information */}
          <Text style={styles.sectionTitle}>COMPANY INFORMATION</Text>
          <View style={styles.sectionDivider} />
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Website</Text>
            <Text style={styles.infoValue}>{report.website || "Not available"}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Phone</Text>
            <Text style={styles.infoValue}>{report.phone || "Not publicly listed"}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Address</Text>
            <Text style={styles.infoValue}>{report.address || "Not available"}</Text>
          </View>

          {/* Summary */}
          {report.summary && (
            <View>
              <Text style={styles.sectionTitle}>COMPANY SUMMARY</Text>
              <View style={styles.sectionDivider} />
              <Text style={styles.bodyText}>{report.summary}</Text>
            </View>
          )}

          {/* Products */}
          {report.products?.length > 0 && (
            <View wrap={false}>
              <Text style={styles.sectionTitle}>PRODUCTS &amp; SERVICES</Text>
              <View style={styles.sectionDivider} />
              {report.products.map((p, i) => (
                <View key={i} style={styles.bulletRow}>
                  <Text style={styles.bulletDot}>•</Text>
                  <Text style={styles.bulletText}>{p}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Pain Points */}
          {report.painPoints?.length > 0 && (
            <View wrap={false}>
              <Text style={styles.sectionTitle}>AI-GENERATED PAIN POINTS</Text>
              <View style={styles.sectionDivider} />
              {report.painPoints.map((pt, i) => (
                <View key={i} style={styles.bulletRow}>
                  <Text style={styles.bulletDot}>•</Text>
                  <Text style={styles.bulletText}>{pt}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Competitors */}
          {report.competitors?.length > 0 && (
            <View wrap={false}>
              <Text style={styles.sectionTitle}>COMPETITORS</Text>
              <View style={styles.sectionDivider} />
              {report.competitors.map((c, i) => (
                <View key={i} style={styles.competitorRow}>
                  <Text style={styles.competitorName}>{c.name}</Text>
                  <Text style={styles.competitorWebsite}>{c.website}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </Page>
    </Document>
  );
}
