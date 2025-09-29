INSERT INTO roles(name, description) VALUES
  ('godmode','Founder'),
  ('superadmin','Super Admin'),
  ('admin','Admin'),
  ('creator','Creator'),
  ('user','User')
ON CONFLICT (name) DO NOTHING;

INSERT INTO tiers(name, description, monthly_price_cents) VALUES
  ('free','Free',0),
  ('sovereign','Sovereign',0)
ON CONFLICT (name) DO NOTHING;
