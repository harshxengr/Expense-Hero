'use client';

import * as Icons from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface FeatureCardProps {
    title: string;
    description: string;
    icon: keyof typeof Icons;
}
const FeatureCard = ({ title, description, icon }: FeatureCardProps) => {
    const IconComponent = Icons[icon] as React.ComponentType<{ className?: string }>;

    return (
        <Card className="p-6 shadow-sm hover:shadow-lg">
            <CardContent className="space-y-4 pt-4">
                {IconComponent && <IconComponent className="h-8 w-8 text-indigo-600"/>}
                <h3 className="text-xl font-semibold">
                    {title}
                </h3>
                <p className="text-gray-600">
                    {description}
                </p>
            </CardContent>
        </Card>
    )
}

export default FeatureCard