import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";

const PARTICIPATING_STATES = [
    "AC", "AL", "AM", "BA", "CE", "DF", "ES", "GO", "MT", "MS", "PA", "PB", "RN", "RS", "RO", "RR", "SE"
];

export function EligibilityChecker() {
    const [step, setStep] = useState<"form" | "result">("form");
    const [formData, setFormData] = useState({
        age: "",
        income: "",
        cadUnico: "",
        state: "",
        firstLicense: ""
    });
    const [isEligible, setIsEligible] = useState(false);
    const [reasons, setReasons] = useState<string[]>([]);

    const handleCheck = () => {
        const newReasons: string[] = [];
        let eligible = true;

        // Check Age
        if (parseInt(formData.age) < 18) {
            eligible = false;
            newReasons.push("É necessário ter 18 anos ou mais.");
        }

        // Check Income (approximate half minimum wage ~ R$ 706)
        if (parseFloat(formData.income) > 706) {
            eligible = false;
            newReasons.push("A renda per capita deve ser de até meio salário mínimo (aprox. R$ 706).");
        }

        // Check CadUnico
        if (formData.cadUnico !== "yes") {
            eligible = false;
            newReasons.push("É necessário estar inscrito no Cadastro Único (CadÚnico).");
        }

        // Check First License
        if (formData.firstLicense !== "yes") {
            eligible = false;
            newReasons.push("O programa é exclusivo para a primeira habilitação.");
        }

        // Check State
        if (!PARTICIPATING_STATES.includes(formData.state)) {
            eligible = false;
            newReasons.push("Seu estado ainda não possui ou não divulgou o programa CNH Social recentemente.");
        }

        setIsEligible(eligible);
        setReasons(newReasons);
        setStep("result");
    };

    const reset = () => {
        setStep("form");
        setFormData({
            age: "",
            income: "",
            cadUnico: "",
            state: "",
            firstLicense: ""
        });
        setReasons([]);
    };

    if (step === "result") {
        return (
            <Card className="w-full max-w-md mx-auto border border-border shadow-lg bg-card">
                <CardHeader className="text-center pb-2">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                        {isEligible ? (
                            <CheckCircle2 className="h-10 w-10 text-primary" />
                        ) : (
                            <XCircle className="h-10 w-10 text-destructive" />
                        )}
                    </div>
                    <CardTitle className="text-2xl font-bold text-foreground">
                        {isEligible ? "Provavelmente Elegível! 🎉" : "Talvez não seja elegível 😕"}
                    </CardTitle>
                    <CardDescription>
                        Com base nas informações fornecidas.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {isEligible ? (
                        <div className="rounded-lg bg-primary/10 p-4 text-sm text-primary-foreground dark:text-primary">
                            <p className="text-primary font-medium">Você atende aos critérios básicos! O próximo passo é verificar o edital específico do Detran do seu estado ({formData.state}).</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
                                <p className="font-semibold mb-2">Motivos:</p>
                                <ul className="list-disc pl-4 space-y-1">
                                    {reasons.map((reason, index) => (
                                        <li key={index}>{reason}</li>
                                    ))}
                                </ul>
                            </div>
                            <div className="flex items-start gap-2 text-xs text-muted-foreground mt-2">
                                <AlertCircle className="w-4 h-4 mt-0.5" />
                                <p>As regras podem variar ligeiramente por estado. Recomendamos sempre consultar o Detran local.</p>
                            </div>
                        </div>
                    )}
                </CardContent>
                <CardFooter>
                    <Button onClick={reset} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                        Verificar Novamente
                    </Button>
                </CardFooter>
            </Card>
        );
    }

    return (
        <Card className="w-full max-w-md mx-auto border border-border shadow-md bg-card">
            <CardHeader>
                <CardTitle className="text-xl text-center text-primary">Verificador de Elegibilidade</CardTitle>
                <CardDescription className="text-center">
                    Responda às perguntas para saber se você pode participar.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="state">Estado</Label>
                    <Select onValueChange={(val) => setFormData({ ...formData, state: val })} value={formData.state}>
                        <SelectTrigger id="state">
                            <SelectValue placeholder="Selecione seu estado" />
                        </SelectTrigger>
                        <SelectContent>
                            {["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"].map((uf) => (
                                <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="age">Idade</Label>
                    <Input
                        id="age"
                        type="number"
                        placeholder="Sua idade"
                        value={formData.age}
                        onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="income">Renda Mensal por Pessoa (R$)</Label>
                    <Input
                        id="income"
                        type="number"
                        placeholder="Ex: 500"
                        value={formData.income}
                        onChange={(e) => setFormData({ ...formData, income: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">Some a renda de todos e divida pelo número de pessoas na casa.</p>
                </div>

                <div className="space-y-2">
                    <Label>Possui CadÚnico ativo?</Label>
                    <Select onValueChange={(val) => setFormData({ ...formData, cadUnico: val })} value={formData.cadUnico}>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="yes">Sim</SelectItem>
                            <SelectItem value="no">Não</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label>É sua primeira habilitação?</Label>
                    <Select onValueChange={(val) => setFormData({ ...formData, firstLicense: val })} value={formData.firstLicense}>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="yes">Sim</SelectItem>
                            <SelectItem value="no">Não</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </CardContent>
            <CardFooter>
                <Button
                    onClick={handleCheck}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                    disabled={!formData.age || !formData.income || !formData.cadUnico || !formData.state || !formData.firstLicense}
                >
                    Verificar Agora
                </Button>
            </CardFooter>
        </Card>
    );
}
