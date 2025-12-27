// lib/inngest/functions.ts
import { inngest } from "./client";
import prisma from "../prisma";
import { sendEmail } from "@/actions/send-email";
import EmailTemplate from "@/emails/template";
import { GoogleGenerativeAI } from "@google/generative-ai";

// ====================
// 1. Recurring Transactions
// ====================
export const processRecurringTransaction = inngest.createFunction(
  {
    id: "process-recurring-transaction",
    name: "Process Recurring Transaction",
    throttle: { limit: 10, period: "1m", key: "event.data.userId" },
  },
  { event: "transaction.recurring.process" },
  async ({ event }) => {
    const { transactionId, userId } = event.data;
    if (!transactionId || !userId) return;

    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId, userId },
      include: { account: true },
    });
    if (!transaction || !isTransactionDue(transaction)) return;

    await prisma.$transaction(async (tx) => {
      await tx.transaction.create({
        data: {
          type: transaction.type,
          amount: transaction.amount,
          description: `${transaction.description} (Recurring)`,
          date: new Date(),
          category: transaction.category,
          userId: transaction.userId,
          accountId: transaction.accountId,
          isRecurring: false,
        },
      });

      const balanceChange =
        transaction.type === "EXPENSE"
          ? -transaction.amount.toNumber()
          : transaction.amount.toNumber();

      await tx.account.update({
        where: { id: transaction.accountId },
        data: { balance: { increment: balanceChange } },
      });

      await tx.transaction.update({
        where: { id: transaction.id },
        data: {
          lastProcessed: new Date(),
          nextRecurringDate: calculateNextRecurringDate(
            new Date(),
            transaction.recurringInterval ?? ""
          ),
        },
      });
    });
  }
);

export const triggerRecurringTransactions = inngest.createFunction(
  { id: "trigger-recurring-transactions", name: "Trigger Recurring Transactions" },
  { cron: "0 0 * * *" }, // Daily
  async () => {
    const transactions = await prisma.transaction.findMany({
      where: {
        isRecurring: true,
        status: "COMPLETED",
        OR: [{ lastProcessed: null }, { nextRecurringDate: { lte: new Date() } }],
      },
    });

    if (transactions.length > 0) {
      await inngest.send(
        transactions.map((t) => ({
          name: "transaction.recurring.process",
          data: { transactionId: t.id, userId: t.userId },
        }))
      );
    }

    return { triggered: transactions.length };
  }
);

// ====================
// 2. Monthly Reports
// ====================

// Simple interface for financial stats
interface FinancialStats {
  totalIncome: number;
  totalExpenses: number;
  byCategory: Record<string, number>;
  transactionCount: number;
}

// Generate AI-powered financial insights with fallback
async function generateFinancialInsights(stats: FinancialStats, month: string): Promise<string[]> {
  try {
    // Check if API key is available
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("API key not configured");
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Simple, clear prompt for AI
    const prompt = `
      Analyze this financial data and provide 3 concise, actionable insights.
      Format as a JSON array of strings.
      Data for ${month}:
      Income: $${stats.totalIncome}, Expenses: $${stats.totalExpenses}
      Categories: ${JSON.stringify(stats.byCategory)}
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text().replace(/```json|```/g, "").trim();
    
    // Parse JSON response safely
    return JSON.parse(responseText);
  } catch (error) {
    console.error("Failed to generate AI insights:", error);
    
    // Return simple, helpful fallback insights
    return [
      "Your expenses are high in one category – review and cut back.",
      "Set a budget to improve savings.",
      "Track recurring costs for better planning.",
    ];
  }
}

export const generateMonthlyReports = inngest.createFunction(
  { id: "generate-monthly-reports", name: "Generate Monthly Reports" },
  { cron: "0 0 1 * *" }, // First day of each month
  async () => {
    const users = await prisma.user.findMany({ include: { accounts: true } });

    for (const user of users) {
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);

      const stats = await getMonthlyStats(user.id, lastMonth);
      const monthName = lastMonth.toLocaleString("default", { month: "long" });
      const insights = await generateFinancialInsights(stats, monthName);

      await sendEmail({
        to: user.email,
        subject: `Your Monthly Financial Report - ${monthName}`,
        react: EmailTemplate({
          userName: user.name ?? "",
          type: "monthly-report",
          data: { stats, month: monthName, insights },
        }),
      });
    }

    return { processed: users.length };
  }
);

// ====================
// 3. Budget Alerts
// ====================
export const checkBudgetAlerts = inngest.createFunction(
  { id: "check-budget-alerts", name: "Check Budget Alerts" },
  { cron: "0 */6 * * *" }, // Every 6 hours
  async () => {
    const budgets = await prisma.budget.findMany({
      include: { user: { include: { accounts: { where: { isDefault: true } } } } },
    });

    for (const budget of budgets) {
      const account = budget.user.accounts[0];
      if (!account) continue;

      const expenses = await prisma.transaction.aggregate({
        where: {
          userId: budget.userId,
          accountId: account.id,
          type: "EXPENSE",
          date: { gte: new Date(new Date().setDate(1)) },
        },
        _sum: { amount: true },
      });

      const spent = typeof expenses._sum.amount === "number"
        ? expenses._sum.amount
        : expenses._sum.amount?.toNumber?.() ?? 0;
      const budgetAmount = typeof budget.amount === "number"
        ? budget.amount
        : budget.amount?.toNumber?.() ?? 0;
      const percentageUsed = budgetAmount > 0 ? (spent / budgetAmount) * 100 : 0;

      if (percentageUsed >= 80 && isNewMonth(budget.lastAlertSent, new Date())) {
        await sendEmail({
          to: budget.user.email,
          subject: `Budget Alert for ${account.name}`,
          react: EmailTemplate({
            userName: budget.user.name ?? "",
            type: "budget-alert",
            data: {
              percentageUsed,
              budgetAmount: typeof budget.amount === "number"
                ? budget.amount
                : budget.amount?.toNumber?.() ?? 0,
              totalExpenses: spent,
            },
          }),
        });

        await prisma.budget.update({
          where: { id: budget.id },
          data: { lastAlertSent: new Date() },
        });
      }
    }
  }
);

// ====================
// Helpers
// ====================
function isTransactionDue(t: any) {
  if (!t.lastProcessed) return true;
  return new Date(t.nextRecurringDate) <= new Date();
}

function calculateNextRecurringDate(date: Date, interval: string) {
  const next = new Date(date);
  if (interval === "DAILY") next.setDate(next.getDate() + 1);
  if (interval === "WEEKLY") next.setDate(next.getDate() + 7);
  if (interval === "MONTHLY") next.setMonth(next.getMonth() + 1);
  if (interval === "YEARLY") next.setFullYear(next.getFullYear() + 1);
  return next;
}

// Get monthly financial statistics for a user
async function getMonthlyStats(userId: string, month: Date): Promise<FinancialStats> {
  // Calculate start and end of the month
  const start = new Date(month.getFullYear(), month.getMonth(), 1);
  const end = new Date(month.getFullYear(), month.getMonth() + 1, 0);

  // Get all transactions for the month
  const transactions = await prisma.transaction.findMany({
    where: { 
      userId, 
      date: { gte: start, lte: end } 
    },
  });

  // Initialize stats object
  const stats: FinancialStats = {
    totalExpenses: 0,
    totalIncome: 0,
    byCategory: {},
    transactionCount: transactions.length
  };

  // Process each transaction
  for (const transaction of transactions) {
    const amount = transaction.amount.toNumber();
    
    if (transaction.type === "EXPENSE") {
      stats.totalExpenses += amount;
      // Add to category total
      stats.byCategory[transaction.category] = 
        (stats.byCategory[transaction.category] || 0) + amount;
    } else {
      stats.totalIncome += amount;
    }
  }

  return stats;
}

function isNewMonth(last: Date | null, now: Date) {
  if (!last) return true;
  return last.getMonth() !== now.getMonth() || last.getFullYear() !== now.getFullYear();
}
