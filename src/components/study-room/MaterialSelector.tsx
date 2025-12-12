import React, { useState } from "react";
import { Check, ChevronsUpDown, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { StudyMaterial, STUDY_MATERIALS } from "@/data/studyMaterials";

interface MaterialSelectorProps {
    selectedMaterial: StudyMaterial;
    onSelect: (material: StudyMaterial) => void;
}

export function MaterialSelector({ selectedMaterial, onSelect }: MaterialSelectorProps) {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between sm:w-[300px]"
                >
                    <div className="flex items-center gap-2 truncate">
                        <BookOpen className="h-4 w-4 shrink-0 opacity-50" />
                        <span className="truncate">{selectedMaterial.title}</span>
                    </div>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </DialogTrigger>
            <DialogContent className="p-0">
                <DialogHeader className="px-4 py-3 border-b">
                    <DialogTitle>Selecionar Material de Estudo</DialogTitle>
                </DialogHeader>
                <Command>
                    <CommandInput placeholder="Buscar por estado ou título..." />
                    <CommandList>
                        <CommandEmpty>Nenhum material encontrado.</CommandEmpty>
                        <CommandGroup heading="Disponíveis">
                            {STUDY_MATERIALS.map((material) => (
                                <CommandItem
                                    key={material.id}
                                    value={`${material.state} ${material.title}`}
                                    onSelect={() => {
                                        onSelect(material);
                                        setOpen(false);
                                    }}
                                    className="cursor-pointer"
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            selectedMaterial.id === material.id
                                                ? "opacity-100"
                                                : "opacity-0"
                                        )}
                                    />
                                    <div className="flex flex-col">
                                        <span className="font-medium">{material.title}</span>
                                        <span className="text-xs text-muted-foreground">Estado: {material.state}</span>
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </DialogContent>
        </Dialog>
    );
}
