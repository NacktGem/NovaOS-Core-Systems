-- Founder (Ty), Jules, Nova AI, sample creators/users, base palettes

INSERT INTO auth.users (email, username, password_hash, role)
VALUES
('founder@nova.local','founder','$2b$12$abcdefghijklmnopqrstuv', 'GODMODE') ON CONFLICT DO NOTHING,
('jules@nova.local','jules','$2b$12$abcdefghijklmnopqrstuv', 'SUPER_ADMIN') ON CONFLICT DO NOTHING,
('nova@nova.local','nova','$2b$12$abcdefghijklmnopqrstuv', 'SUPER_ADMIN') ON CONFLICT DO NOTHING;

-- Base palettes
INSERT INTO content.palettes (key,name,tier,colors) VALUES
('DarkCore','DarkCore','FREE','{"bg":"#000003","fg":"#E6E6E6","p1":"#19212A","p2":"#013E43"}'),
('RoseNoir','RoseNoir','FREE','{"bg":"#431D21","fg":"#F8E8EE","p1":"#A33A5B","p2":"#89333F"}'),
('ObsidianBloom','ObsidianBloom','PAID','{"bg":"#0B0C0F","fg":"#E8EEF3","p1":"#223140","p2":"#5F6D7A"}'),
('GarnetMist','GarnetMist','PAID','{"bg":"#1C0B10","fg":"#FFECEF","p1":"#A33A5B","p2":"#5B1A2C"}'),
('BlueAsh','BlueAsh','PAID','{"bg":"#0E141A","fg":"#EAF2F8","p1":"#1B2A41","p2":"#3E5C76"}'),
('VelvetNight','VelvetNight','PAID','{"bg":"#0A0A0C","fg":"#F3F0FA","p1":"#2B2537","p2":"#5A4B7A"}')
ON CONFLICT DO NOTHING;
