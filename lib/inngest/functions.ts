import prisma from "../prisma";
import { inngest } from "./client";
import { sendEmail } from "@/actions/send-email";
import EmailTemplate from "@/emails/template";

export const checkBudgetAlert = inngest.createFunction(
  { name: "Check Budget Alerts" },
  { cron: "0 */6 * * *" }, // Every 6 hours
  async ({ step }) => {
    // Fetch all budgets along with default accounts
    const budgets = await step.run("fetch-budgets", async () =>
      prisma.budget.findMany({
        include: {
          user: {
            include: {
              accounts: { where: { isDefault: true } },
            },
          },
        },
      })
    );

    for (const budget of budgets) {
      const defaultAccount = budget.user.accounts[0];
      if (!defaultAccount) continue;

      await step.run(`check-budget-${budget.id}`, async () => {
        const totalExpenses = await getMonthExpenses(budget.userId, defaultAccount.id);
        const budgetAmount = Number(budget.amount);
        const percentageUsed = (totalExpenses / budgetAmount) * 100;

        if (shouldSendAlert(budget.lastAlertSent, percentageUsed)) {
          // Send Budget Alert Email
          await sendEmail({
            to: budget.user.email,
            subject: `Budget Alert for ${defaultAccount.name}`,
            react: EmailTemplate({
              userName: budget.user.name,
              type: "budget-alert",
              data: {
                percentageUsed,
                budgetAmount: parseFloat(budgetAmount.toFixed(1)),
                totalExpenses: parseFloat(totalExpenses.toFixed(1)),
                accountName: defaultAccount.name,
              },
            }),
          });

          // Update last alert date
          await prisma.budget.update({
            where: { id: budget.id },
            data: { lastAlertSent: new Date() },
          });
        }
      });
    }
  }
);

// Get total expenses for the current month
async function getMonthExpenses(userId: string, accountId: string): Promise<number> {
  const startDate = new Date();
  startDate.setDate(1);

  const result = await prisma.transaction.aggregate({
    where: {
      userId,
      accountId,
      type: "EXPENSE",
      date: { gte: startDate },
    },
    _sum: { amount: true },
  });

  return result._sum.amount?.toNumber() || 0;
}

// Determine if we should send alert
function shouldSendAlert(lastAlertSent: Date | null, percentageUsed: number): boolean {
  const THRESHOLD = 80; // 80%
  const isNewMonthAlert = !lastAlertSent || isNewMonth(lastAlertSent, new Date());
  return percentageUsed >= THRESHOLD && isNewMonthAlert;
}

// Check if last alert was sent in a different month
function isNewMonth(lastDate: Date, currentDate: Date): boolean {
  return lastDate.getMonth() !== currentDate.getMonth() || lastDate.getFullYear() !== currentDate.getFullYear();
}
