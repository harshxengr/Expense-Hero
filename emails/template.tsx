import {
    Body,
    Container,
    Head,
    Heading,
    Html,
    Preview,
    Section,
    Text,
} from "@react-email/components";

type MonthlyReportData = {
    month: string;
    stats: {
        totalIncome: number;
        totalExpenses: number;
        byCategory?: Record<string, number>;
    };
    insights?: string[];
};

type BudgetAlertData = {
    percentageUsed: number;
    budgetAmount: number;
    totalExpenses: number;
};

type EmailTemplateProps =
    | {
        userName: string;
        type: "monthly-report";
        data: MonthlyReportData;
    }
    | {
        userName: string;
        type: "budget-alert";
        data: BudgetAlertData;
    };

export default function EmailTemplate(props: EmailTemplateProps) {
    const { userName, type, data } = props;

    if (type === "monthly-report") {
        const { month, stats, insights } = data as MonthlyReportData;

        return (
            <Html>
                <Head />
                <Preview>Your Monthly Financial Report</Preview>
                <Body style={styles.body}>
                    <Container style={styles.container}>
                        <Heading style={styles.title}>Monthly Financial Report</Heading>

                        <Text style={styles.text}>Hello {userName},</Text>
                        <Text style={styles.text}>
                            Here’s your financial summary for {month}:
                        </Text>

                        {/* Main Stats */}
                        <Section style={styles.statsContainer}>
                            <div style={styles.stat}>
                                <Text style={styles.text}>Total Income</Text>
                                <Text style={styles.heading}>${stats.totalIncome}</Text>
                            </div>
                            <div style={styles.stat}>
                                <Text style={styles.text}>Total Expenses</Text>
                                <Text style={styles.heading}>${stats.totalExpenses}</Text>
                            </div>
                            <div style={styles.stat}>
                                <Text style={styles.text}>Net</Text>
                                <Text style={styles.heading}>
                                    ${stats.totalIncome - stats.totalExpenses}
                                </Text>
                            </div>
                        </Section>

                        {/* Category Breakdown */}
                        {stats.byCategory && (
                            <Section style={styles.section}>
                                <Heading style={styles.heading}>Expenses by Category</Heading>
                                {Object.entries(stats.byCategory).map(([category, amount]) => (
                                    <div key={category} style={styles.row}>
                                        <Text style={styles.text}>{category}</Text>
                                        <Text style={styles.text}>${amount}</Text>
                                    </div>
                                ))}
                            </Section>
                        )}

                        {/* AI Insights */}
                        {insights && insights.length > 0 && (
                            <Section style={styles.section}>
                                <Heading style={styles.heading}>Wealth Insights</Heading>
                                {insights.map((insight, index) => (
                                    <Text key={index} style={styles.text}>
                                        • {insight}
                                    </Text>
                                ))}
                            </Section>
                        )}

                        <Text style={styles.footer}>
                            Thank you for using Wealth. Keep tracking your finances for better
                            financial health!
                        </Text>
                    </Container>
                </Body>
            </Html>
        );
    }

    if (type === "budget-alert") {
        const { percentageUsed, budgetAmount, totalExpenses } =
            data as BudgetAlertData;

        return (
            <Html>
                <Head />
                <Preview>Budget Alert</Preview>
                <Body style={styles.body}>
                    <Container style={styles.container}>
                        <Heading style={styles.title}>Budget Alert</Heading>
                        <Text style={styles.text}>Hello {userName},</Text>
                        <Text style={styles.text}>
                            You’ve used {percentageUsed.toFixed(1)}% of your monthly budget.
                        </Text>
                        <Section style={styles.statsContainer}>
                            <div style={styles.stat}>
                                <Text style={styles.text}>Budget Amount</Text>
                                <Text style={styles.heading}>${budgetAmount}</Text>
                            </div>
                            <div style={styles.stat}>
                                <Text style={styles.text}>Spent So Far</Text>
                                <Text style={styles.heading}>${totalExpenses}</Text>
                            </div>
                            <div style={styles.stat}>
                                <Text style={styles.text}>Remaining</Text>
                                <Text style={styles.heading}>
                                    ${budgetAmount - totalExpenses}
                                </Text>
                            </div>
                        </Section>
                    </Container>
                </Body>
            </Html>
        );
    }

    return null; // Fallback
}

const styles: Record<string, React.CSSProperties> = {
    body: {
        backgroundColor: "#f6f9fc",
        fontFamily: "-apple-system, sans-serif",
    },
    container: {
        backgroundColor: "#ffffff",
        margin: "0 auto",
        padding: "20px",
        borderRadius: "5px",
        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
    },
    title: {
        color: "#1f2937",
        fontSize: "32px",
        fontWeight: "bold",
        textAlign: "center",
        margin: "0 0 20px",
    },
    heading: {
        color: "#1f2937",
        fontSize: "20px",
        fontWeight: 600,
        margin: "0 0 16px",
    },
    text: {
        color: "#4b5563",
        fontSize: "16px",
        margin: "0 0 16px",
    },
    section: {
        marginTop: "32px",
        padding: "20px",
        backgroundColor: "#f9fafb",
        borderRadius: "5px",
        border: "1px solid #e5e7eb",
    },
    statsContainer: {
        margin: "32px 0",
        padding: "20px",
        backgroundColor: "#f9fafb",
        borderRadius: "5px",
    },
    stat: {
        marginBottom: "16px",
        padding: "12px",
        backgroundColor: "#fff",
        borderRadius: "4px",
        boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
    },
    row: {
        display: "flex",
        justifyContent: "space-between",
        padding: "12px 0",
        borderBottom: "1px solid #e5e7eb",
    },
    footer: {
        color: "#6b7280",
        fontSize: "14px",
        textAlign: "center",
        marginTop: "32px",
        paddingTop: "16px",
        borderTop: "1px solid #e5e7eb",
    },
};
