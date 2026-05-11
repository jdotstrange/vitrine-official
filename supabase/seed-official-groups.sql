-- Official Vitrine Groups — Seed (from docs/official-groups-seed-list.md)
-- Run once. Uses ON CONFLICT DO NOTHING so safe to re-run.

INSERT INTO conversations (
  id,
  type,
  name,
  description,
  visibility,
  category_type,
  category_code,
  is_official,
  member_count
) VALUES
  ('grp-official-baseball', 'group', 'Vitrine Baseball', 'The official community for baseball memorabilia.', 'public', 'baseball', NULL, true, 0),
  ('grp-official-basketball', 'group', 'Vitrine Basketball', 'The official community for basketball memorabilia.', 'public', 'basketball', NULL, true, 0),
  ('grp-official-football', 'group', 'Vitrine Football', 'The official community for football memorabilia.', 'public', 'football', NULL, true, 0),
  ('grp-official-hockey', 'group', 'Vitrine Hockey', 'The official community for hockey memorabilia.', 'public', 'hockey', NULL, true, 0),
  ('grp-official-soccer', 'group', 'Vitrine Soccer', 'The official community for soccer memorabilia.', 'public', 'soccer', NULL, true, 0),
  ('grp-official-baseball-jerseys', 'group', 'Baseball Jerseys', 'Game-worn and authentic jerseys across sports.', 'public', 'baseball', 'jersey', true, 0),
  ('grp-official-football-helmets', 'group', 'Football Helmets', 'Helmets and protective gear.', 'public', 'football', 'helmet', true, 0),
  ('grp-official-signed-baseballs', 'group', 'Signed Baseballs', 'Signed balls and similar items.', 'public', 'baseball', 'ball', true, 0),
  ('grp-official-puck-collectors', 'group', 'Puck Collectors', 'Signed pucks and hockey memorabilia.', 'public', 'hockey', 'puck', true, 0),
  ('grp-official-cleats-kicks', 'group', 'Cleats & Kicks', 'Cleats and shoes.', 'public', 'soccer', 'cleatsshoes', true, 0),
  ('grp-official-belts-titles', 'group', 'Belts & Titles', 'Championship belts and boxing.', 'public', 'boxing', 'belts', true, 0),
  ('grp-official-pro-wrestling', 'group', 'Pro Wrestling', 'Pro wrestling memorabilia.', 'public', 'pro_wrestling', NULL, true, 0),
  ('grp-official-mma', 'group', 'MMA', 'MMA memorabilia.', 'public', 'mma', NULL, true, 0),
  ('grp-official-golf', 'group', 'Golf', 'Golf memorabilia.', 'public', 'golf', NULL, true, 0),
  ('grp-official-tennis', 'group', 'Tennis', 'Tennis memorabilia.', 'public', 'tennis', NULL, true, 0)
ON CONFLICT (id) DO NOTHING;
