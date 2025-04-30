-- Renaming marshall_swift_factor ➜ cost_factor
ALTER TABLE IF EXISTS marshall_swift_factor RENAME TO cost_factor;
-- Back-compat view
CREATE OR REPLACE VIEW marshall_swift_factor AS
SELECT * FROM cost_factor;