import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { HelpCircle, Info } from "lucide-react";

interface FeatureExplanationButtonProps {
    title: string;
    description: string;
    side?: "top" | "right" | "bottom" | "left";
    align?: "start" | "center" | "end";
    icon?: "help" | "info";
    className?: string;
}

export function FeatureExplanationButton({
    title,
    description,
    side = "top",
    align = "center",
    icon = "help",
    className,
}: FeatureExplanationButtonProps) {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className={`h-8 w-8 rounded-full text-muted-foreground hover:text-primary ${className}`}
                    aria-label={`Saiba mais sobre: ${title}`}
                >
                    {icon === "help" ? (
                        <HelpCircle className="h-5 w-5" />
                    ) : (
                        <Info className="h-5 w-5" />
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent side={side} align={align} className="w-80 p-4">
                <div className="space-y-2">
                    <h4 className="font-semibold leading-none text-primary">{title}</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        {description}
                    </p>
                </div>
            </PopoverContent>
        </Popover>
    );
}
