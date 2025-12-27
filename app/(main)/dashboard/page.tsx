import { getDashboardData, getUserAccounts } from "@/actions/dashboard";
import { getCurrentBudget } from "@/actions/budget";
import CreateAccountDrawer from "@/components/CreateAccountDrawer";
import AccountCard from "./_components/AccountCard";
import BudgetProgress from "./_components/BudgetProgress";
import { DashboardOverview } from "./_components/DashboardOverview";
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";
import type { SerializedAccount, SerializedTransaction } from "@/actions/dashboard";

type Account = SerializedAccount;
type Transaction = SerializedTransaction;

interface BudgetData {
    budget: { id: string; userId: string; amount: number } | null;
    currentExpenses: number;
}

export default async function DashboardPage() {
    const accountsRaw = await getUserAccounts();
    const accounts: Account[] = accountsRaw ?? [];

    const defaultAccount = accounts.find((a) => a.isDefault);

    let budgetData: BudgetData | null = null;
    if (defaultAccount?.id) {
        budgetData = await getCurrentBudget(defaultAccount.id);
    }

    const transactionsRaw = await getDashboardData();
    const transactions: Transaction[] = transactionsRaw ?? [];

    return (
        <div className="space-y-8">
            {defaultAccount && (
                <BudgetProgress
                    initialBudget={budgetData?.budget ?? null}
                    currentExpenses={budgetData?.currentExpenses ?? 0}
                />
            )}

            <DashboardOverview accounts={accounts} transactions={transactions} />

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <CreateAccountDrawer>
                    <Card className="hover:shadow-md transition-shadow cursor-pointer border-dashed">
                        <CardContent className="flex flex-col items-center justify-center h-full pt-5 text-muted-foreground">
                            <Plus className="h-10 w-10 mb-2" />
                            <p className="text-sm font-medium">Add New Account</p>
                        </CardContent>
                    </Card>
                </CreateAccountDrawer>

                {accounts.map((account) => (
                    <AccountCard key={account.id} account={account} />
                ))}
            </div>
        </div>
    );
}
