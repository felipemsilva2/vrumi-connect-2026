import { useRegisterSW } from 'virtual:pwa-register/react'
import { Button } from '@/components/ui/button'
import { ToastAction } from '@/components/ui/toast'
import { useToast } from '@/hooks/use-toast'
import { useEffect } from 'react'

export function ReloadPrompt() {
    const { toast } = useToast()

    const {
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegistered(r) {
            console.log('SW Registered: ' + r)
        },
        onRegisterError(error) {
            console.log('SW registration error', error)
        },
    })

    useEffect(() => {
        if (needRefresh) {
            toast({
                title: "Nova versão disponível",
                description: "Uma nova versão do app está disponível. Atualize para ver as mudanças.",
                action: (
                    <ToastAction altText="Atualizar" onClick={() => updateServiceWorker(true)}>
                        Atualizar
                    </ToastAction>
                ),
                duration: Infinity, // Keep open until clicked
            })
        }
    }, [needRefresh, updateServiceWorker, toast])

    return null
}
