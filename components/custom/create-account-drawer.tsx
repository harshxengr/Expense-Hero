"use client";

import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
    DrawerClose,
} from "@/components/ui/drawer"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Switch } from "../ui/switch";
import { Button } from "../ui/button";
import { ReactNode, useEffect, useState } from "react";
import { Input } from "../ui/input";
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod";
import { accountSchema } from "@/lib/zodSchema";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createAccount } from "@/actions/dashboard";
import useFetch from "@/hooks/useFetch";

interface CreateAccountDrawerProps {
    children: ReactNode
}

const CreateAccountDrawer: React.FC<CreateAccountDrawerProps> = ({ children }) => {
    const [open, setOpen] = useState(false);

    const { register, handleSubmit, formState: { errors }, setValue, watch, reset } = useForm<z.input<typeof accountSchema>>({
        resolver: zodResolver(accountSchema),
        defaultValues: {
            name: "",
            type: "CURRENT",
            balance: "",
            isDefault: false
        }
    })

    const { data: newAccount, error, fn: createAccountFn, loading: createAccountLoading } = useFetch(createAccount);

    useEffect(() => {
        if (newAccount && !createAccountLoading) {
            toast.success("Account created successfully");
            reset();
            setOpen(false);
        }
    }, [createAccountLoading, newAccount, reset]);

    useEffect(() => {
        if (error) {
            toast.error((error as Error).message || "Failed to create account");
        }
    }, [error]);

    const onSubmit = async (data: z.input<typeof accountSchema>) => {
        await createAccountFn(data);
    }

    return (
        <Drawer open={open} onOpenChange={setOpen}>
            <DrawerTrigger asChild>{children}</DrawerTrigger>
            <DrawerContent>
                <DrawerHeader>
                    <DrawerTitle>Are you absolutely sure?</DrawerTitle>
                    <DrawerDescription>This action cannot be undone.</DrawerDescription>
                </DrawerHeader>
                <div className="px-4 pb-4">
                    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
                        {/* Name Field */}
                        <div className="space-y-2">
                            <label htmlFor="name">Account Name</label>
                            <Input {...register("name")} id="name" placeholder="e.g., Main Checking" />
                            {errors.name && (<p className="text-sm text-red-500">{errors.name.message}</p>)}
                        </div>

                        {/* Type Select */}
                        <div className="space-y-2">
                            <label htmlFor="type" className="text-sm font-medium">Account Type</label>
                            <Select onValueChange={(value) => setValue("type", value as "CURRENT" | "SAVINGS")} defaultValue={watch("type")}>
                                <SelectTrigger id="type">
                                    <SelectValue placeholder="Select Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="CURRENT">Current</SelectItem>
                                    <SelectItem value="SAVINGS">Savings</SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.type && (<p className="text-sm text-red-500">{errors.type.message}</p>)}
                        </div>

                        {/* Balance Field */}
                        <div className="space-y-2">
                            <label htmlFor="balance" className="text-sm font-medium">Initial Balance</label>
                            <Input {...register("balance")} id="balance" type="number" step="0.01" placeholder="0.00" />
                            {errors.balance && (<p className="text-sm text-red-500">{errors.balance.message}</p>)}
                        </div>

                        {/* Switch */}
                        <div className="flex items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                                <label htmlFor="isDefault" className="text-sm font-medium cursor-pointer">Set as Default</label>
                                <p className="text-sm text-muted-foreground">This account will be selected by default for transactions</p>
                            </div>
                            <Switch id="isDefault"
                                onCheckedChange={(checked) => setValue("isDefault", checked)}
                                checked={watch("isDefault")}
                            />
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-4 pt-4">
                            <DrawerClose asChild>
                                <Button type="button" variant="outline" className="flex-1">Cancel</Button>
                            </DrawerClose>
                            <Button type="submit" className="flex-1" disabled={createAccountLoading}>
                                {createAccountLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating...</> : "Create Account"}
                            </Button>
                        </div>
                    </form>
                </div>
            </DrawerContent>
        </Drawer>

    )
}

export default CreateAccountDrawer