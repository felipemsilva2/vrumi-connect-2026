import { FileText, Download, Eye, BookOpen } from "lucide-react"

const materiaisData = [
  {
    id: 1,
    title: "Manual Completo de Legislação de Trânsito",
    category: "Legislação",
    pages: 45,
    type: "PDF",
    downloads: 1234
  },
  {
    id: 2,
    title: "Guia Prático de Direção Defensiva",
    category: "Direção Defensiva",
    pages: 28,
    type: "PDF",
    downloads: 892
  },
  {
    id: 3,
    title: "Todos os Sinais de Trânsito - Ilustrado",
    category: "Sinalização",
    pages: 36,
    type: "PDF",
    downloads: 2341
  },
  {
    id: 4,
    title: "Primeiros Socorros no Trânsito",
    category: "Primeiros Socorros",
    pages: 22,
    type: "PDF",
    downloads: 567
  },
  {
    id: 5,
    title: "Mecânica Básica para Condutores",
    category: "Mecânica",
    pages: 31,
    type: "PDF",
    downloads: 743
  },
  {
    id: 6,
    title: "Meio Ambiente e Cidadania no Trânsito",
    category: "Meio Ambiente",
    pages: 18,
    type: "PDF",
    downloads: 456
  }
]

export const MateriaisView = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Materiais de Estudo</h2>
          <p className="text-muted-foreground mt-1">
            Acesse apostilas e guias completos para sua preparação
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {materiaisData.map((material) => (
          <div
            key={material.id}
            className="bg-card border border-border rounded-xl p-6 hover:shadow-card transition-shadow"
          >
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <span className="text-xs font-medium px-2 py-1 bg-secondary/10 text-secondary rounded-full">
                  {material.category}
                </span>
              </div>
            </div>

            <h3 className="font-semibold text-foreground mb-2 line-clamp-2">
              {material.title}
            </h3>

            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <BookOpen className="h-4 w-4" />
                  {material.pages} páginas
                </span>
                <span className="font-medium">{material.type}</span>
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Download className="h-4 w-4" />
                <span>{material.downloads} downloads</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button className="flex-1 py-2 px-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium flex items-center justify-center gap-2 text-sm">
                <Eye className="h-4 w-4" />
                Visualizar
              </button>
              <button className="py-2 px-4 bg-card border border-border rounded-lg hover:bg-muted transition-colors flex items-center justify-center">
                <Download className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        <div className="bg-card border border-border rounded-lg p-4">
          <h4 className="font-medium text-foreground mb-2">Total de Materiais</h4>
          <p className="text-2xl font-bold text-primary">{materiaisData.length}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <h4 className="font-medium text-foreground mb-2">Materiais Visualizados</h4>
          <p className="text-2xl font-bold text-success">4</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <h4 className="font-medium text-foreground mb-2">Downloads Feitos</h4>
          <p className="text-2xl font-bold text-secondary">3</p>
        </div>
      </div>
    </div>
  )
}
