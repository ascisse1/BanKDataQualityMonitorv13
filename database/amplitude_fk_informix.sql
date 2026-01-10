-- ============================================================================
-- AMPLITUDE CBS - Foreign Key Constraints for INFORMIX
-- Run this AFTER loading seed data
-- ============================================================================

ALTER TABLE bkcom ADD CONSTRAINT FOREIGN KEY (cli) REFERENCES bkcli(cli);
ALTER TABLE bkadcli ADD CONSTRAINT FOREIGN KEY (cli) REFERENCES bkcli(cli);
ALTER TABLE bkprfcli ADD CONSTRAINT FOREIGN KEY (cli) REFERENCES bkcli(cli);
ALTER TABLE bkcntcli ADD CONSTRAINT FOREIGN KEY (cli) REFERENCES bkcli(cli);
ALTER TABLE bkemacli ADD CONSTRAINT FOREIGN KEY (cli) REFERENCES bkcli(cli);

-- ============================================================================
-- End of FK Constraints
-- ============================================================================
