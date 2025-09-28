"use client";

import { useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import useFetch from "@/hooks/useFetch";
import { updateDefaultAccount } from "@/actions/account";

interface Account {
  id: string;
  name: string;
  type: "CURRENT" | "SAVINGS";
  balance: number | string;
  isDefault?: boolean;
}

interface AccountCardProps {
  account: Account;
}

const AccountCard: React.FC<AccountCardProps> = ({ account }) => {
  const { id, name, type, balance, isDefault } = account;
  const { loading, fn: updateDefaultFn, data, error } = useFetch(updateDefaultAccount);

  const handleDefaultChange = async () => {
    if (isDefault) {
      toast.warning("You need at least 1 default account");
      return;
    }
    await updateDefaultFn(id);
  };

  useEffect(() => {
    if (typeof data === "object" && data !== null && "success" in data && (data as any).success) {
      toast.success("Default account updated successfully");
    }
  }, [data]);

  useEffect(() => {
    if (error) toast.error((error as Error).message || "Failed to update default account");
  }, [error]);

  return (
    <Card className="hover:shadow-md transition-shadow group relative">
      <Link href={`/account/${id}`} className="block">
        <CardHeader className="flex justify-between items-center pb-2">
          <CardTitle className="text-sm font-medium capitalize">{name}</CardTitle>
          <Switch checked={isDefault} onClick={handleDefaultChange} disabled={loading} />
        </CardHeader>

        <CardContent>
          <div className="text-2xl font-bold">${parseFloat(balance.toString()).toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">{type.charAt(0) + type.slice(1).toLowerCase()} Account</p>
        </CardContent>

        <CardFooter className="flex justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <ArrowUpRight className="h-4 w-4 text-green-500" /> Income
          </div>
          <div className="flex items-center gap-1">
            <ArrowDownRight className="h-4 w-4 text-red-500" /> Expense
          </div>
        </CardFooter>
      </Link>
    </Card>
  );
};

export default AccountCard;
