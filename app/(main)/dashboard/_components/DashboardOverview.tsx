"use client";

import { useState } from "react";
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
    Legend,
} from "recharts";
import { format } from "date-fns";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// =====================
// Types
// =====================
type Account = {
    id: string;
    name: string;
    isDefault?: boolean;
};

type Transaction = {
    id: string;
    accountId: string;
    amount: number;
    type: "EXPENSE" | "INCOME";
    category: string;
    description?: string;
    date: string | Date;
};

type Props = {
    accounts: Account[];
    transactions: Transaction[];
};

// =====================
// Constants
// =====================
const COLORS = [
    "#FF6B6B",
    "#4ECDC4",
    "#45B7D1",
    "#96CEB4",
    "#FFEEAD",
    "#D4A5A5",
    "#9FA8DA",
];

// =====================
// Component
// =====================
export function DashboardOverview({ accounts, transactions }: Props) {
    const [selectedAccountId, setSelectedAccountId] = useState(
        accounts.find((a) => a.isDefault)?.id || accounts[0]?.id
    );

    // Transactions for selected account
    const accountTransactions = transactions.filter(
        (t) => t.accountId === selectedAccountId
    );

    // Get last 5 recent transactions
    const recentTransactions = [...accountTransactions]
        .sort((a, b) => {
            const dateA = a.date instanceof Date ? a.date : new Date(a.date);
            const dateB = b.date instanceof Date ? b.date : new Date(b.date);
            return dateB.getTime() - dateA.getTime();
        })
        .slice(0, 5);

    // Filter current month expenses
    const now = new Date();
    const currentMonthExpenses = accountTransactions.filter((t) => {
        const d = t.date instanceof Date ? t.date : new Date(t.date);
        return (
            t.type === "EXPENSE" &&
            d.getMonth() === now.getMonth() &&
            d.getFullYear() === now.getFullYear()
        );
    });

    // Group by category
    const expensesByCategory = currentMonthExpenses.reduce<Record<string, number>>(
        (acc, t) => {
            acc[t.category] = (acc[t.category] || 0) + t.amount;
            return acc;
        },
        {}
    );

    // Pie chart data
    const pieChartData = Object.entries(expensesByCategory).map(
        ([category, amount]) => ({ name: category, value: amount })
    );

    return (
        <div className="grid gap-4 md:grid-cols-2">
            {/* Recent Transactions */}
            <Card>
                <CardHeader className="flex items-center justify-between pb-4">
                    <CardTitle className="text-base font-normal">
                        Recent Transactions
                    </CardTitle>
                    <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                        <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Select account" />
                        </SelectTrigger>
                        <SelectContent>
                            {accounts.map((account) => (
                                <SelectItem key={account.id} value={account.id}>
                                    {account.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </CardHeader>
                <CardContent>
                    {recentTransactions.length === 0 ? (
                        <p className="text-center text-muted-foreground py-4">
                            No recent transactions
                        </p>
                    ) : (
                        <div className="space-y-4">
                            {recentTransactions.map((t) => (
                                <div
                                    key={t.id}
                                    className="flex items-center justify-between"
                                >
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium">
                                            {t.description || "Untitled Transaction"}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {format(t.date instanceof Date ? t.date : new Date(t.date), "PP")}
                                        </p>
                                    </div>
                                    <div
                                        className={cn(
                                            "flex items-center gap-1",
                                            t.type === "EXPENSE" ? "text-red-500" : "text-green-500"
                                        )}
                                    >
                                        {t.type === "EXPENSE" ? (
                                            <ArrowDownRight className="h-4 w-4" />
                                        ) : (
                                            <ArrowUpRight className="h-4 w-4" />
                                        )}
                                        ${t.amount.toFixed(2)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Expense Breakdown */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base font-normal">
                        Monthly Expense Breakdown
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0 pb-5">
                    {pieChartData.length === 0 ? (
                        <p className="text-center text-muted-foreground py-4">
                            No expenses this month
                        </p>
                    ) : (
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieChartData}
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={80}
                                        dataKey="value"
                                        label={({ name, value }) =>
                                            `${name}: $${typeof value === "number" ? value.toFixed(2) : "0.00"}`
                                        }
                                    >
                                        {pieChartData.map((_, i) => (
                                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(val: number) => `$${val.toFixed(2)}`}
                                        contentStyle={{
                                            backgroundColor: "hsl(var(--popover))",
                                            border: "1px solid hsl(var(--border))",
                                            borderRadius: "var(--radius)",
                                        }}
                                    />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
