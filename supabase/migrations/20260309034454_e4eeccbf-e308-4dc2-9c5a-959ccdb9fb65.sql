
DROP POLICY "System can insert notifications" ON public.notifications;

CREATE POLICY "Treasurers and admins can insert notifications" ON public.notifications
  FOR INSERT TO authenticated WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'treasurer'::app_role)
  );
