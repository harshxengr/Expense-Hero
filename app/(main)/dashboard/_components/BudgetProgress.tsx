"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Pencil, Check, X } from "lucide-react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import useFetch from "@/hooks/useFetch";
import { updateBudget } from "@/actions/budget";

type Budget = {
    amount: number;
};

type BudgetProgressProps = {
    initialBudget: Budget | null;
    currentExpenses: number;
};

const BudgetProgress = ({ initialBudget, currentExpenses }: BudgetProgressProps) => {
    const [isEditing, setIsEditing] = useState(false);
    const [newBudget, setNewBudget] = useState(initialBudget?.amount?.toString() || "");

    const { loading, fn: updateBudgetFn, data, error } = useFetch(updateBudget);

    const percentUsed = initialBudget ? (currentExpenses / initialBudget.amount) * 100 : 0;

    const handleUpdateBudget = async () => {
        const amount = parseFloat(newBudget);

        if (isNaN(amount) || amount <= 0) {
            toast.error("Please enter a valid amount");
            return;
        }

        await updateBudgetFn(amount);
    };

    const handleCancel = () => {
        setNewBudget(initialBudget?.amount?.toString() || "");
        setIsEditing(false);
    };

    useEffect(() => {
        if (typeof data === "object" && data !== null && "success" in data && (data as any).success) {
            setIsEditing(false);
            toast.success("Budget updated successfully");
        }
    }, [data]);

    useEffect(() => {
        if (error) {
            toast.error((error as Error).message || "Failed to update budget");
        }
    }, [error]);

    const progressColor =
        percentUsed >= 90
            ? "bg-red-500"
            : percentUsed >= 75
                ? "bg-yellow-500"
                : "bg-green-500";

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex-1">
                    <CardTitle className="text-sm font-medium">
                        Monthly Budget (Default Account)
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                        {isEditing ? (
                            <div className="flex items-center gap-2">
                                <Input
                                    type="number"
                                    value={newBudget}
                                    onChange={(e) => setNewBudget(e.target.value)}
                                    className="w-32"
                                    placeholder="Enter amount"
                                    autoFocus
                                    disabled={loading}
                                />
                                <Button variant="ghost" size="icon" onClick={handleUpdateBudget} disabled={loading}>
                                    <Check className="h-4 w-4 text-green-500" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={handleCancel} disabled={loading}>
                                    <X className="h-4 w-4 text-red-500" />
                                </Button>
                            </div>
                        ) : (
                            <>
                                <CardDescription>
                                    {initialBudget
                                        ? `$${currentExpenses.toFixed(2)} of $${initialBudget.amount.toFixed(2)} spent`
                                        : "No budget set"}
                                </CardDescription>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setIsEditing(true)}
                                    className="h-6 w-6"
                                >
                                    <Pencil className="h-3 w-3" />
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {initialBudget && (
                    <div className="space-y-2">
                        <Progress value={percentUsed} className={progressColor} />
                        <p className="text-xs text-muted-foreground text-right">
                            {percentUsed.toFixed(1)}% used
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default BudgetProgress;
