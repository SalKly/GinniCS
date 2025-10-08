import React from "react";
import { Page, Text, View } from "@react-pdf/renderer";
import { styles } from "./PDFStyles";

interface PDFCoverPageProps {
  companyName: string;
  generatedDate: string;
}

export const PDFCoverPage: React.FC<PDFCoverPageProps> = ({ companyName, generatedDate }) => {
  return (
    <Page size="A4" style={styles.coverPage}>
      <View style={styles.coverPage}>
        <Text style={styles.coverTitle}>Onboarding Blueprint</Text>
        <Text style={styles.coverSubtitle}>Comprehensive Call Evaluation Framework</Text>

        <View style={styles.coverDivider} />

        <Text style={styles.coverCompany}>{companyName}</Text>

        <View style={styles.coverDivider} />

        <Text style={styles.coverDate}>Generated on {generatedDate}</Text>

        <View style={{ marginTop: 60 }}>
          <Text style={{ fontSize: 10, color: "#6B7280", textAlign: "center" }}>Powered by Ginni.ai</Text>
          <Text style={{ fontSize: 9, color: "#9CA3AF", textAlign: "center", marginTop: 4 }}>AI-driven Sales Coaching</Text>
        </View>
      </View>
    </Page>
  );
};
