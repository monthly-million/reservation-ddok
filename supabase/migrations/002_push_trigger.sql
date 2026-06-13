-- Push notification trigger on new reservation
CREATE OR REPLACE FUNCTION notify_new_reservation()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM net.http_post(
    url := current_setting('app.settings.supabase_functions_url') || '/send-push',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := jsonb_build_object(
      'shop_id', NEW.shop_id,
      'customer_name', NEW.customer_name,
      'reservation_id', NEW.id
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_new_reservation
  AFTER INSERT ON reservations
  FOR EACH ROW EXECUTE FUNCTION notify_new_reservation();
