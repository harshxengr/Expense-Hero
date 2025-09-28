"use client";

import * as Icons from "lucide-react";

interface HowItWorkCardProps {
    title: string;
    description: string;
    icon: keyof typeof Icons;
}

const HowItWorkCard = ({ icon, title, description }: HowItWorkCardProps) => {
    const IconComponent = Icons[icon] as React.ComponentType<{ className?: string }>;

    return (
        <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                {IconComponent && <IconComponent className="h-8 w-8 text-indigo-600" />}
            </div>
            <h3 className="text-xl font-semibold mb-4">
                {title}
            </h3>
            <p className="text-gray-600">
                {description}
            </p>
        </div>
    )
}

export default HowItWorkCard