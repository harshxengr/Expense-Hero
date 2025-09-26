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


export default function EmailTemplate({ userName, type, data }: any) {
    return (
        <Html>
            <Head />
            <Preview>
                {type === "monthly-report"
                    ? "Your Monthly Financial Report"
                    : "Budget Alert"}
            </Preview>
            <Body style={styles.body}>
                <Container style={styles.container}>
                    <Heading style={styles.title}>
                        {type === "monthly-report" ? "Monthly Financial Report" : "Budget Alert"}
                    </Heading>

                    <Text style={styles.text}>Hello {userName},</Text>

                    {type === "monthly-report" && renderMonthlyReport(data)}
                    {type === "budget-alert" && renderBudgetAlert(data)}

                    <Text style={styles.footer}>
                        Thank you for using Welth. Keep tracking your finances for better
                        financial health!
                    </Text>
                </Container>
            </Body>
        </Html>
    );
}

function renderMonthlyReport(data: any) {
    const { month, stats, insights } = data;
    const net = stats.totalIncome - stats.totalExpenses;

    return (
        <>
            <Text style={styles.text}>Here’s your financial summary for {month}:</Text>

            {/* Stats */}
            <Section style={styles.statsContainer}>
                <Stat label="Total Income" value={stats.totalIncome} />
                <Stat label="Total Expenses" value={stats.totalExpenses} />
                <Stat label="Net" value={net} />
            </Section>

            {/* Category Breakdown */}
            {Object.keys(stats.byCategory).length > 0 && (
                <Section style={styles.section}>
                    <Heading style={styles.heading}>Expenses by Category</Heading>
                    {Object.entries(stats.byCategory).map(([category, amount]) => (
                        <Row key={category} label={category} value={amount} />
                    ))}
                </Section>
            )}

            {/* Insights */}
            {insights.length > 0 && (
                <Section style={styles.section}>
                    <Heading style={styles.heading}>Welth Insights</Heading>
                    {insights.map((insight: any, i: any) => (
                        <Text key={i} style={styles.text}>
                            • {insight}
                        </Text>
                    ))}
                </Section>
            )}
        </>
    );
}

function renderBudgetAlert(data: any) {
    const { percentageUsed, budgetAmount, totalExpenses } = data;
    const remaining = budgetAmount - totalExpenses;

    return (
        <>
            <Text style={styles.text}>
                You’ve used {percentageUsed.toFixed(1)}% of your monthly budget.
            </Text>

            <Section style={styles.statsContainer}>
                <Stat label="Budget Amount" value={budgetAmount} />
                <Stat label="Spent So Far" value={totalExpenses} />
                <Stat label="Remaining" value={remaining} />
            </Section>
        </>
    );
}

function Stat({ label, value }: { label: string; value: number }) {
    return (
        <div style={styles.stat}>
            <Text style={styles.text}>{label}</Text>
            <Text style={styles.heading}>${value}</Text>
        </div>
    );
}

function Row({ label, value }: { label: string; value: number }) {
    return (
        <div style={styles.row}>
            <Text style={styles.text}>{label}</Text>
            <Text style={styles.text}>${value}</Text>
        </div>
    );
}

const styles: any = {
    body: {
        backgroundColor: "#f6f9fc",
        fontFamily: "sans-serif",
    },
    container: {
        backgroundColor: "#fff",
        margin: "0 auto",
        padding: "20px",
        borderRadius: "6px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    },
    title: {
        color: "#1f2937",
        fontSize: "28px",
        fontWeight: "bold",
        textAlign: "center",
        margin: "0 0 20px",
    },
    heading: {
        color: "#1f2937",
        fontSize: "18px",
        fontWeight: 600,
        margin: "0 0 12px",
    },
    text: {
        color: "#4b5563",
        fontSize: "15px",
        margin: "0 0 12px",
    },
    section: {
        marginTop: "24px",
        padding: "16px",
        backgroundColor: "#f9fafb",
        borderRadius: "5px",
        border: "1px solid #e5e7eb",
    },
    statsContainer: {
        margin: "24px 0",
        padding: "16px",
        backgroundColor: "#f9fafb",
        borderRadius: "5px",
    },
    stat: {
        marginBottom: "12px",
        padding: "10px",
        backgroundColor: "#fff",
        borderRadius: "4px",
        boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
    },
    row: {
        display: "flex",
        justifyContent: "space-between",
        padding: "8px 0",
        borderBottom: "1px solid #e5e7eb",
    },
    footer: {
        color: "#6b7280",
        fontSize: "13px",
        textAlign: "center",
        marginTop: "24px",
        paddingTop: "12px",
        borderTop: "1px solid #e5e7eb",
    },
};
