import { PopulateMateriaisFromPDF } from "@/components/admin/PopulateMateriaisFromPDF";

const AdminPopulate = () => {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold">Admin: Popular Materiais</h1>
          <p className="text-muted-foreground">
            Use IA para extrair e estruturar automaticamente o conteúdo do PDF
          </p>
        </div>
        
        <PopulateMateriaisFromPDF />
      </div>
    </div>
  );
};

export default AdminPopulate;
