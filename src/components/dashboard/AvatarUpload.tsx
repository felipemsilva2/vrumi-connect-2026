import { useState, useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Camera, Loader2, User } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface AvatarUploadProps {
    userId: string
    url: string | null
    onUpload: (url: string) => void
    fullName: string | null
}

export const AvatarUpload = ({ userId, url, onUpload, fullName }: AvatarUploadProps) => {
    const [avatarUrl, setAvatarUrl] = useState<string | null>(url)
    const [uploading, setUploading] = useState(false)
    const { toast } = useToast()

    useEffect(() => {
        if (url) setAvatarUrl(url)
    }, [url])

    const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true)

            if (!event.target.files || event.target.files.length === 0) {
                throw new Error("Você deve selecionar uma imagem para upload.")
            }

            const file = event.target.files[0]
            const fileExt = file.name.split(".").pop()
            const filePath = `${userId}/${Math.random()}.${fileExt}`

            const { error: uploadError } = await supabase.storage
                .from("avatars")
                .upload(filePath, file)

            if (uploadError) {
                throw uploadError
            }

            const { data } = supabase.storage.from("avatars").getPublicUrl(filePath)

            onUpload(data.publicUrl)
            setAvatarUrl(data.publicUrl)

            toast({
                title: "Foto atualizada",
                description: "Sua foto de perfil foi alterada com sucesso.",
            })
        } catch (error: any) {
            let errorMessage = error.message
            if (error.message && error.message.includes("Bucket not found")) {
                errorMessage = "O bucket 'avatars' não foi encontrado. Por favor, crie-o no painel do Supabase e torne-o público."
            }

            toast({
                title: "Erro no upload",
                description: errorMessage,
                variant: "destructive",
            })
        } finally {
            setUploading(false)
        }
    }

    const getInitials = (name: string | null) => {
        if (!name) return "U"
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .substring(0, 2)
    }

    return (
        <div className="flex flex-col items-center gap-4">
            <div className="relative group">
                <Avatar className="h-32 w-32 border-4 border-background shadow-xl">
                    <AvatarImage src={avatarUrl || ""} className="object-cover" />
                    <AvatarFallback className="bg-primary/10 text-primary text-4xl font-bold">
                        {getInitials(fullName)}
                    </AvatarFallback>
                </Avatar>
                <div className="absolute bottom-0 right-0">
                    <label
                        htmlFor="avatar-upload"
                        className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-110 active:scale-95"
                    >
                        {uploading ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            <Camera className="h-5 w-5" />
                        )}
                        <input
                            id="avatar-upload"
                            type="file"
                            accept="image/*"
                            onChange={uploadAvatar}
                            disabled={uploading}
                            className="hidden"
                        />
                    </label>
                </div>
            </div>
            <p className="text-sm text-muted-foreground">
                Clique na câmera para alterar sua foto
            </p>
        </div>
    )
}
