/**
 * Dashboard Page - Main overview of user's financial data
 * 
 * This page shows:
 * - Budget progress for the default account
 * - Recent transactions and expense breakdown
 * - All user accounts with their balances
 * - Option to add new accounts
 */

import { getDashboardData, getUserAccounts } from "@/actions/dashboard";
import { getCurrentBudget } from "@/actions/budget";
import CreateAccountDrawer from "@/components/CreateAccountDrawer";
import AccountCard from "./_components/AccountCard";
import BudgetProgress from "./_components/BudgetProgress";
import { DashboardOverview } from "./_components/DashboardOverview";
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";

// Import the actual types from actions
import type { SerializedAccount, SerializedTransaction } from "@/actions/dashboard";

// Simple type aliases for cleaner code
type Account = SerializedAccount;
type Transaction = SerializedTransaction;

// Interface for budget data
interface BudgetData {
    budget: { id: string; userId: string; amount: number } | null;
    currentExpenses: number;
}

export default async function DashboardPage() {
    // Step 1: Get all user accounts
    // This fetches accounts from the database
    const accountsRaw = await getUserAccounts();
    const accounts: Account[] = accountsRaw ?? []; // Use empty array if null/undefined

    // Step 2: Find the default account (the one marked as default)
    const defaultAccount = accounts.find((a) => a.isDefault);

    // Step 3: Get budget data for the default account
    let budgetData: BudgetData | null = null;
    if (defaultAccount?.id) {
        budgetData = await getCurrentBudget(defaultAccount.id);
    }

    // Step 4: Get all transactions for the dashboard overview
    const transactionsRaw = await getDashboardData();
    const transactions: Transaction[] = transactionsRaw ?? []; // Use empty array if null/undefined

    return (
        <div className="space-y-8">
            {/* Budget Progress Section */}
            {/* Only show if user has a default account */}
            {defaultAccount && (
                <BudgetProgress
                    initialBudget={budgetData?.budget ?? null}
                    currentExpenses={budgetData?.currentExpenses ?? 0}
                />
            )}

            {/* Dashboard Overview Section */}
            {/* Shows recent transactions and expense breakdown */}
            <DashboardOverview accounts={accounts} transactions={transactions} />

            {/* Accounts Grid Section */}
            {/* Shows all accounts and option to add new ones */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* Add New Account Card */}
                <CreateAccountDrawer>
                    <Card className="hover:shadow-md transition-shadow cursor-pointer border-dashed">
                        <CardContent className="flex flex-col items-center justify-center h-full pt-5 text-muted-foreground">
                            <Plus className="h-10 w-10 mb-2" />
                            <p className="text-sm font-medium">Add New Account</p>
                        </CardContent>
                    </Card>
                </CreateAccountDrawer>

                {/* Existing Accounts */}
                {accounts.map((account) => (
                    <AccountCard key={account.id} account={account} />
                ))}
            </div>
        </div>
    );
}
