import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RotateCw, CheckCircle, XCircle } from "lucide-react";

interface Flashcard {
  id: number;
  question: string;
  answer: string;
  category: string;
}

const flashcardsData: Flashcard[] = [
  {
    id: 1,
    question: "Qual é a velocidade máxima permitida em vias urbanas?",
    answer: "A velocidade máxima em vias urbanas é de 50 km/h, salvo quando houver sinalização específica indicando o contrário.",
    category: "Legislação",
  },
  {
    id: 2,
    question: "O que significa a placa triangular vermelha com borda?",
    answer: "Placa triangular vermelha indica sinalização de regulamentação, especificamente 'Dê a preferência'. O condutor deve reduzir a velocidade e dar passagem aos veículos que circulam na via preferencial.",
    category: "Sinalização",
  },
  {
    id: 3,
    question: "Quando deve-se usar farol baixo durante o dia?",
    answer: "O farol baixo deve ser usado durante o dia em rodovias de pista simples situadas fora dos perímetros urbanos e em túneis providos de iluminação pública.",
    category: "Direção Defensiva",
  },
  {
    id: 4,
    question: "O que é aquaplanagem?",
    answer: "Aquaplanagem é a perda de contato dos pneus com o solo devido ao acúmulo de água na pista, fazendo o veículo 'deslizar' sobre a água. Ocorre especialmente em alta velocidade.",
    category: "Mecânica",
  },
];

const FlashcardSection = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [stats, setStats] = useState({ correct: 0, incorrect: 0 });

  const currentCard = flashcardsData[currentIndex];

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleNext = (correct: boolean) => {
    if (correct) {
      setStats({ ...stats, correct: stats.correct + 1 });
    } else {
      setStats({ ...stats, incorrect: stats.incorrect + 1 });
    }
    
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % flashcardsData.length);
  };

  return (
    <section className="py-20 px-4 bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto max-w-5xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Flashcards Interativos
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Aprenda de forma dinâmica com nossos flashcards interativos. Teste seus conhecimentos e veja seu progresso em tempo real.
          </p>
        </div>

        {/* Stats */}
        <div className="flex justify-center gap-6 mb-8">
          <div className="flex items-center gap-2 bg-success/10 px-6 py-3 rounded-full border border-success/20">
            <CheckCircle className="w-5 h-5 text-success" />
            <span className="font-semibold text-success">{stats.correct} Corretas</span>
          </div>
          <div className="flex items-center gap-2 bg-destructive/10 px-6 py-3 rounded-full border border-destructive/20">
            <XCircle className="w-5 h-5 text-destructive" />
            <span className="font-semibold text-destructive">{stats.incorrect} Incorretas</span>
          </div>
        </div>

        {/* Flashcard */}
        <div className="mb-8 perspective-1000">
          <Card
            className={`relative h-[400px] cursor-pointer transition-all duration-500 transform shadow-card hover:shadow-elegant ${
              isFlipped ? "[transform:rotateY(180deg)]" : ""
            }`}
            style={{ transformStyle: "preserve-3d" }}
            onClick={handleFlip}
          >
            {/* Front */}
            <div
              className="absolute inset-0 p-8 flex flex-col items-center justify-center backface-hidden bg-gradient-card rounded-lg"
              style={{ backfaceVisibility: "hidden" }}
            >
              <div className="inline-block mb-6 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium">
                {currentCard.category}
              </div>
              <h3 className="text-2xl md:text-3xl font-bold text-center text-foreground mb-4">
                {currentCard.question}
              </h3>
              <div className="mt-8 flex items-center gap-2 text-muted-foreground">
                <RotateCw className="w-5 h-5" />
                <span className="text-sm">Clique para ver a resposta</span>
              </div>
            </div>

            {/* Back */}
            <div
              className="absolute inset-0 p-8 flex flex-col items-center justify-center backface-hidden bg-gradient-card rounded-lg"
              style={{
                backfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
              }}
            >
              <div className="inline-block mb-6 px-4 py-2 bg-secondary/10 text-secondary rounded-full text-sm font-medium">
                Resposta
              </div>
              <p className="text-lg md:text-xl text-center text-foreground leading-relaxed">
                {currentCard.answer}
              </p>
              <div className="mt-8 flex items-center gap-2 text-muted-foreground">
                <RotateCw className="w-5 h-5" />
                <span className="text-sm">Clique para voltar</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            variant="outline"
            size="lg"
            onClick={() => handleNext(false)}
            className="flex-1 sm:flex-none"
          >
            <XCircle className="w-5 h-5" />
            Não Sabia
          </Button>
          <Button
            variant="success"
            size="lg"
            onClick={() => handleNext(true)}
            className="flex-1 sm:flex-none"
          >
            <CheckCircle className="w-5 h-5" />
            Sabia
          </Button>
        </div>

        {/* Progress */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Card {currentIndex + 1} de {flashcardsData.length}
          </p>
          <div className="mt-2 w-full max-w-md mx-auto bg-muted rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / flashcardsData.length) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default FlashcardSection;
