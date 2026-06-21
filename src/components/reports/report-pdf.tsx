import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer"

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
  },
  headerBar: {
    backgroundColor: "#27262E",
    padding: 20,
    marginBottom: 24,
  },
  companyName: {
    color: "#E19C63",
    fontSize: 18,
    fontWeight: "bold",
  },
  reportTitle: {
    color: "#FFFFFF",
    fontSize: 12,
    marginTop: 4,
  },
  generatedDate: {
    color: "#8BA5BE",
    fontSize: 9,
    marginTop: 4,
  },
  sectionTitle: {
    color: "#E19C63",
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 8,
    marginTop: 16,
  },
  body: {
    fontSize: 10,
    lineHeight: 1.6,
    color: "#333333",
    marginBottom: 16,
  },
  table: {
    marginTop: 8,
    marginBottom: 16,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    paddingVertical: 6,
  },
  tableHeader: {
    backgroundColor: "#27262E",
    borderBottomWidth: 0,
    paddingVertical: 8,
  },
  tableCellLabel: {
    flex: 1,
    fontSize: 9,
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  tableCellValue: {
    width: 80,
    fontSize: 9,
    color: "#FFFFFF",
    fontWeight: "bold",
    textAlign: "right",
  },
  cellLabel: {
    flex: 1,
    fontSize: 9,
    color: "#4B5563",
  },
  cellValue: {
    width: 80,
    fontSize: 9,
    color: "#333333",
    textAlign: "right",
  },
  topSourcesSection: {
    marginTop: 16,
  },
  sourceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  sourceName: {
    fontSize: 9,
    color: "#4B5563",
  },
  sourceValue: {
    fontSize: 9,
    color: "#333333",
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: "#27262E",
    marginVertical: 16,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center",
    color: "#8BA5BE",
    fontSize: 8,
  },
})

interface ReportPDFProps {
  report: {
    client_name: string
    period_start: string
    period_end: string
    narrative_text: string
    raw_data?: any
    created_at: string
  }
}

export function ReportPDF({ report }: ReportPDFProps) {
  const metrics = report.raw_data?.metrics || {}

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerBar}>
          <Text style={styles.companyName}>KVANT</Text>
          <Text style={styles.reportTitle}>Client Narrative Report — {report.client_name}</Text>
          <Text style={styles.generatedDate}>
            Generated {new Date(report.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Executive Summary</Text>
        <Text style={styles.body}>{report.narrative_text}</Text>

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>Performance Metrics</Text>

        {metrics.sessions !== undefined && (
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={styles.tableCellLabel}>Metric</Text>
              <Text style={styles.tableCellValue}>Value</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.cellLabel}>Sessions</Text>
              <Text style={styles.cellValue}>{metrics.sessions?.toLocaleString()}</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.cellLabel}>Users</Text>
              <Text style={styles.cellValue}>{metrics.users?.toLocaleString()}</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.cellLabel}>Pageviews</Text>
              <Text style={styles.cellValue}>{metrics.pageviews?.toLocaleString()}</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.cellLabel}>Bounce Rate</Text>
              <Text style={styles.cellValue}>{metrics.bounceRate}%</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.cellLabel}>Avg. Session Duration</Text>
              <Text style={styles.cellValue}>{metrics.avgSessionDuration}s</Text>
            </View>
            {metrics.sessionsChange !== undefined && (
              <View style={styles.tableRow}>
                <Text style={styles.cellLabel}>Sessions Change</Text>
                <Text style={styles.cellValue}>{metrics.sessionsChange > 0 ? "+" : ""}{metrics.sessionsChange}%</Text>
              </View>
            )}
            {metrics.usersChange !== undefined && (
              <View style={styles.tableRow}>
                <Text style={styles.cellLabel}>Users Change</Text>
                <Text style={styles.cellValue}>{metrics.usersChange > 0 ? "+" : ""}{metrics.usersChange}%</Text>
              </View>
            )}
          </View>
        )}

        {metrics.topPages?.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Top Pages</Text>
            <View style={styles.table}>
              <View style={[styles.tableRow, styles.tableHeader]}>
                <Text style={styles.tableCellLabel}>Page</Text>
                <Text style={styles.tableCellValue}>Views</Text>
              </View>
              {metrics.topPages.map((page: any, i: number) => (
                <View style={styles.tableRow} key={i}>
                  <Text style={styles.cellLabel}>{page.path}</Text>
                  <Text style={styles.cellValue}>{page.views?.toLocaleString()}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {metrics.sessionsBySource?.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Traffic Sources</Text>
            <View style={styles.topSourcesSection}>
              {metrics.sessionsBySource.map((s: any, i: number) => (
                <View style={styles.sourceRow} key={i}>
                  <Text style={styles.sourceName}>{s.source}</Text>
                  <Text style={styles.sourceValue}>{s.sessions?.toLocaleString()}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        <Text style={styles.footer}>Generated by Kvant — AI-Powered Client Reports</Text>
      </Page>
    </Document>
  )
}
