import { StyleSheet, Font } from "@react-pdf/renderer";

// Brand colors
export const COLORS = {
  primary: "rgb(84, 22, 123)",
  primaryLight: "#F4ECFF",
  primaryDark: "#54167B",
  text: "#111827",
  textLight: "#6B7280",
  border: "#E5E7EB",
  background: "#FFFFFF",
  backgroundLight: "#F9FAFB",
  blue: "#3B82F6",
  blueLight: "#EFF6FF",
  green: "#10B981",
  greenLight: "#F0FDF4",
  orange: "#F59E0B",
  orangeLight: "#FEF3C7",
};

export const styles = StyleSheet.create({
  // Page styles
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: COLORS.text,
    backgroundColor: COLORS.background,
  },

  // Header and footer
  header: {
    position: "absolute",
    top: 20,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 10,
    borderBottom: `2px solid ${COLORS.primary}`,
  },
  headerText: {
    fontSize: 10,
    color: COLORS.textLight,
    fontFamily: "Helvetica",
  },
  headerCompany: {
    fontSize: 12,
    color: COLORS.primary,
    fontFamily: "Helvetica-Bold",
  },
  pageNumber: {
    position: "absolute",
    bottom: 20,
    right: 40,
    fontSize: 9,
    color: COLORS.textLight,
  },

  // Cover page
  coverPage: {
    padding: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  coverTitle: {
    fontSize: 36,
    fontFamily: "Helvetica-Bold",
    color: COLORS.primary,
    marginBottom: 20,
    textAlign: "center",
  },
  coverSubtitle: {
    fontSize: 20,
    fontFamily: "Helvetica",
    color: COLORS.textLight,
    marginBottom: 40,
    textAlign: "center",
  },
  coverCompany: {
    fontSize: 28,
    fontFamily: "Helvetica-Bold",
    color: COLORS.text,
    marginBottom: 10,
    textAlign: "center",
  },
  coverDate: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 20,
  },
  coverDivider: {
    width: "60%",
    height: 3,
    backgroundColor: COLORS.primary,
    marginVertical: 30,
  },

  // Section headers
  sectionHeader: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: COLORS.primary,
    marginBottom: 10,
    paddingBottom: 8,
    borderBottom: `3px solid ${COLORS.primary}`,
    marginTop: 20,
  },
  sectionDescription: {
    fontSize: 11,
    color: COLORS.textLight,
    marginBottom: 20,
    lineHeight: 1.5,
  },

  // Subsection headers
  subsectionHeader: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: COLORS.primary,
    marginTop: 20,
    marginBottom: 12,
    paddingBottom: 5,
    borderBottom: `2px solid ${COLORS.primaryLight}`,
  },

  // Card styles
  card: {
    backgroundColor: COLORS.backgroundLight,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  cardPrimary: {
    backgroundColor: COLORS.primaryLight,
    border: `1px solid ${COLORS.primary}`,
    borderLeft: `4px solid ${COLORS.primary}`,
  },
  cardBlue: {
    backgroundColor: COLORS.blueLight,
    border: `1px solid ${COLORS.blue}`,
    borderLeft: `4px solid ${COLORS.blue}`,
  },
  cardGreen: {
    backgroundColor: COLORS.greenLight,
    border: `1px solid ${COLORS.green}`,
    borderLeft: `4px solid ${COLORS.green}`,
  },
  cardOrange: {
    backgroundColor: COLORS.orangeLight,
    border: `1px solid ${COLORS.orange}`,
    borderLeft: `4px solid ${COLORS.orange}`,
  },

  // Card content
  cardTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: COLORS.text,
    marginBottom: 6,
  },
  cardDescription: {
    fontSize: 10,
    color: COLORS.text,
    lineHeight: 1.5,
    marginBottom: 8,
  },
  cardMeta: {
    fontSize: 9,
    color: COLORS.textLight,
    marginTop: 6,
  },

  // Badges
  badgeContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 6,
  },
  badge: {
    backgroundColor: COLORS.backgroundLight,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    fontSize: 8,
    color: COLORS.textLight,
  },
  badgePrimary: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
    color: COLORS.primary,
  },
  badgeBlue: {
    backgroundColor: COLORS.blueLight,
    borderColor: COLORS.blue,
    color: COLORS.blue,
  },
  badgeGreen: {
    backgroundColor: COLORS.greenLight,
    borderColor: COLORS.green,
    color: COLORS.green,
  },

  // Outcome hierarchy styles
  outcomeItem: {
    marginBottom: 16,
  },
  outcomeMainLevel: {
    marginLeft: 0,
  },
  outcomeNestedLevel: {
    marginLeft: 20,
    paddingLeft: 12,
    borderLeft: `2px solid ${COLORS.primaryLight}`,
  },
  outcomeTitle: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: COLORS.primary,
    marginBottom: 6,
  },
  outcomeDescription: {
    fontSize: 10,
    color: COLORS.text,
    lineHeight: 1.6,
    marginBottom: 6,
  },
  outcomeMeta: {
    fontSize: 9,
    color: COLORS.textLight,
    fontStyle: "italic",
  },

  // Scorecard specific styles
  scorecardType: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: COLORS.text,
    marginBottom: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 4,
    alignSelf: "flex-start",
  },
  scoreGuideItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
    paddingLeft: 12,
  },
  scoreNumber: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: COLORS.primary,
    width: 30,
  },
  scoreDescription: {
    fontSize: 9,
    color: COLORS.text,
    lineHeight: 1.5,
    flex: 1,
  },

  // Utility styles
  spacer: {
    height: 12,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  textBold: {
    fontFamily: "Helvetica-Bold",
  },
  textItalic: {
    fontStyle: "italic",
  },
});
