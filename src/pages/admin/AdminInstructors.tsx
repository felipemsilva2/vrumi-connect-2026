// Delete Dialog State
const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
const [instructorToDelete, setInstructorToDelete] = useState<Instructor | null>(null);

// ... (existing code)

const handleSuspend = async (instructor: Instructor) => {
  setIsProcessing(true);
  console.log(`[AdminInstructors] Attempting to suspend instructor ID: ${instructor.id}`);

  try {
    const { error } = await supabase
      .from("instructors")
      .update({ status: "suspended", updated_at: new Date().toISOString() })
      .eq("id", instructor.id);

    if (error) {
      console.error('[AdminInstructors] Supabase Update Error:', error);
      throw error;
    }

    console.log('[AdminInstructors] Status updated successfully in DB');

    await supabase.from("notifications").insert({
      user_id: instructor.user_id,
      type: "instructor_suspended",
      title: "Conta Suspensa",
      message: "Sua conta de instrutor foi suspensa temporariamente. Entre em contato com o suporte para mais informações.",
    });

    await logAction({
      actionType: "SUSPEND_INSTRUCTOR",
      entityType: "instructor",
      entityId: instructor.id,
      oldValues: { status: instructor.status },
      newValues: { status: "suspended" },
    });

    toast.success("Instrutor suspenso");
    fetchInstructors();
  } catch (error: any) {
    console.error("Error suspending instructor (CATCH):", error);
    toast.error(error.message || "Erro ao suspender instrutor");
  } finally {
    setIsProcessing(false);
  }
};

const handleDeleteClick = (instructor: Instructor) => {
  setInstructorToDelete(instructor);
  setDeleteDialogOpen(true);
};

const handleDeleteConfirm = async () => {
  if (!instructorToDelete) return;
  setIsProcessing(true);
  try {
    const { error } = await supabase
      .from("instructors")
      .delete()
      .eq("id", instructorToDelete.id);

    if (error) throw error;

    await logAction({
      actionType: "DELETE_INSTRUCTOR",
      entityType: "instructor",
      entityId: instructorToDelete.id,
      oldValues: { name: instructorToDelete.full_name },
      newValues: null,
    });

    toast.success("Instrutor removido com sucesso");
    setDeleteDialogOpen(false);
    fetchInstructors();
  } catch (error: any) {
    console.error("Error deleting instructor:", error);
    toast.error(error.message || "Erro ao remover instrutor");
  } finally {
    setIsProcessing(false);
  }
};

// ... (render return)

{
  instructor.status === 'approved' && (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => handleSuspend(instructor)}
      disabled={isProcessing}
      title="Suspender"
      className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
    >
      <Ban className="h-4 w-4" />
    </Button>
  )
}
<Button
  variant="ghost"
  size="icon"
  onClick={() => handleDeleteClick(instructor)}
  disabled={isProcessing}
  title="Remover"
  className="text-red-600 hover:text-red-700 hover:bg-red-50"
>
  <Trash2 className="h-4 w-4" />
</Button>
                      </div >
                    </TableCell >
                  </TableRow >
                ))
              )}
            </TableBody >
          </Table >

  {/* ... (pagination) */ }
        </div >
      </div >

  <InstructorDetailsDialog
    open={dialogOpen}
    onOpenChange={setDialogOpen}
    instructor={selectedInstructor}
    onUpdate={fetchInstructors}
  />

{/* Reject Dialog */ }
{/* ... (existing reject dialog) */ }

{/* Delete Confirmation Dialog */ }
<AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Tem certeza absoluta?</AlertDialogTitle>
      <AlertDialogDescription>
        Esta ação não pode ser desfeita. Isso excluirá permanentemente o registro do instrutor
        <strong> {instructorToDelete?.full_name}</strong> e removerá seus dados de nossos servidores.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancelar</AlertDialogCancel>
      <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 focus:ring-red-600">
        {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sim, remover instrutor"}
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>

{/* ... (rest of the file) */ }
