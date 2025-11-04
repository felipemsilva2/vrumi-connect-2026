import { useState } from "react"
import { BookOpen, ArrowRight, ArrowLeft, RotateCcw } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

const flashcardsData = [
  {
    id: 1,
    category: "Legislação de Trânsito",
    question: "Qual a velocidade máxima permitida em vias urbanas?",
    answer: "60 km/h, exceto quando houver sinalização indicando velocidade diferente."
  },
  {
    id: 2,
    category: "Sinalização",
    question: "O que significa uma placa triangular com borda vermelha?",
    answer: "Sinalização de advertência, alertando sobre condições perigosas à frente."
  },
  {
    id: 3,
    category: "Direção Defensiva",
    question: "O que é direção defensiva?",
    answer: "É dirigir de forma a evitar acidentes, apesar das ações incorretas dos outros e das condições adversas."
  },
  {
    id: 4,
    category: "Primeiros Socorros",
    question: "Qual a primeira ação ao prestar socorro em um acidente?",
    answer: "Sinalizar o local do acidente para evitar novos acidentes."
  },
  {
    id: 5,
    category: "Mecânica Básica",
    question: "Com que frequência deve-se verificar o óleo do motor?",
    answer: "Semanalmente ou a cada 1000 km rodados, sempre com o motor frio."
  }
]

export const FlashcardsView = () => {
  const [currentCard, setCurrentCard] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [direction, setDirection] = useState(0)

  const handleNext = () => {
    if (currentCard < flashcardsData.length - 1) {
      setDirection(1)
      setIsFlipped(false)
      setTimeout(() => setCurrentCard(currentCard + 1), 200)
    }
  }

  const handlePrevious = () => {
    if (currentCard > 0) {
      setDirection(-1)
      setIsFlipped(false)
      setTimeout(() => setCurrentCard(currentCard - 1), 200)
    }
  }

  const handleReset = () => {
    setCurrentCard(0)
    setIsFlipped(false)
  }

  const card = flashcardsData[currentCard]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Flashcards de Estudo</h2>
          <p className="text-muted-foreground mt-1">
            Cartão {currentCard + 1} de {flashcardsData.length}
          </p>
        </div>
        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-card border border-border rounded-lg hover:bg-muted transition-colors"
        >
          <RotateCcw className="h-4 w-4" />
          Recomeçar
        </button>
      </div>

      <div className="flex justify-center items-center min-h-[400px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentCard}
            initial={{ opacity: 0, x: direction * 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -100 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-2xl"
          >
            <motion.div
              className="relative cursor-pointer"
              onClick={() => setIsFlipped(!isFlipped)}
              animate={{ rotateY: isFlipped ? 180 : 0 }}
              transition={{ duration: 0.6 }}
              style={{ transformStyle: "preserve-3d" }}
            >
              <div
                className="bg-card border border-border rounded-2xl p-8 shadow-card min-h-[300px] flex flex-col justify-center items-center"
                style={{
                  backfaceVisibility: "hidden",
                  transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)"
                }}
              >
                <div className="absolute top-4 left-4">
                  <span className="text-xs font-medium px-3 py-1 bg-primary/10 text-primary rounded-full">
                    {card.category}
                  </span>
                </div>
                <BookOpen className="h-12 w-12 text-primary mb-4" />
                <h3 className="text-xl font-semibold text-foreground text-center mb-4">
                  {isFlipped ? "Resposta" : "Pergunta"}
                </h3>
                <p className="text-lg text-foreground text-center">
                  {isFlipped ? card.answer : card.question}
                </p>
                <p className="text-sm text-muted-foreground mt-6">
                  Clique para virar o cartão
                </p>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex justify-center gap-4">
        <button
          onClick={handlePrevious}
          disabled={currentCard === 0}
          className="flex items-center gap-2 px-6 py-3 bg-card border border-border rounded-lg hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ArrowLeft className="h-4 w-4" />
          Anterior
        </button>
        <button
          onClick={handleNext}
          disabled={currentCard === flashcardsData.length - 1}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Próximo
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        <div className="bg-card border border-border rounded-lg p-4">
          <h4 className="font-medium text-foreground mb-2">Estudados Hoje</h4>
          <p className="text-2xl font-bold text-primary">12</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <h4 className="font-medium text-foreground mb-2">Total Estudados</h4>
          <p className="text-2xl font-bold text-success">156</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <h4 className="font-medium text-foreground mb-2">Faltam Revisar</h4>
          <p className="text-2xl font-bold text-secondary">34</p>
        </div>
      </div>
    </div>
  )
}
