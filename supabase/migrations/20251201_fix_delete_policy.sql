-- Enable RLS on user_passes if not already enabled
ALTER TABLE "public"."user_passes" ENABLE ROW LEVEL SECURITY;

-- Policy to allow admins to delete subscriptions
CREATE POLICY "Admins can delete user_passes" 
ON "public"."user_passes" 
FOR DELETE 
USING (
  is_admin(auth.uid())
);

-- Policy to allow admins to view all subscriptions (if not already present)
CREATE POLICY "Admins can view all user_passes" 
ON "public"."user_passes" 
FOR SELECT 
USING (
  is_admin(auth.uid())
);
