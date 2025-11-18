import { useEffect, useState } from "react"
import { supabase } from "@/integrations/supabase/client"
import { useActivePass } from "@/hooks/useActivePass"
import { NonSubscriberView } from "@/components/paywall/NonSubscriberView"
import { AnimatePresence, motion } from "framer-motion"
import { analytics } from "@/utils/studyAnalytics"

interface SubscriptionGateProps {
  children: React.ReactNode
  feature?: string
}

export const SubscriptionGate = ({ children, feature }: SubscriptionGateProps) => {
  const [userId, setUserId] = useState<string | undefined>(undefined)
  const [isUserLoading, setIsUserLoading] = useState(true)
  const { hasActivePass, isLoading } = useActivePass(userId)

  useEffect(() => {
    let mounted = true
    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!mounted) return
      if (user?.id) setUserId(user.id)
      setIsUserLoading(false)
    }
    loadUser()
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    if (!isLoading) {
      analytics.trackEvent("paywall", hasActivePass ? "access_granted" : "access_blocked", feature)
    }
  }, [isLoading, hasActivePass, feature])

  return (
    <AnimatePresence mode="wait">
      {isUserLoading || isLoading ? (
        <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 w-40 bg-muted rounded" />
            <div className="h-4 w-72 bg-muted rounded" />
            <div className="h-32 w-full bg-muted rounded" />
          </div>
        </motion.div>
      ) : hasActivePass ? (
        <motion.div key="content" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
          {children}
        </motion.div>
      ) : (
        <motion.div key="paywall" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
          <NonSubscriberView feature={feature} />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
