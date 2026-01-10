-- ============================================================================
-- AMPLITUDE CBS - Realistic Seed Data for INFORMIX
-- BSIC Bank - Cote d'Ivoire
-- ============================================================================

-- Clear existing data (in reverse dependency order)
--DELETE FROM bkemacli;
--DELETE FROM bkcntcli;
--DELETE FROM bkprfcli;
--DELETE FROM bkadcli;
--DELETE FROM bkcom;
--DELETE FROM bkcli;

-- ============================================================================
-- BKCLI - Clients (20 Particuliers + 10 Entreprises)
-- ============================================================================

-- Particuliers (tcli = '1')
INSERT INTO bkcli (cli, nom, tcli, lib, pre, sext, dna, viln, payn, nat, res, sit, nbenf, nidn, age, ges, tax, lang, ichq, icb, utic, dou, dmo) VALUES
('CLI000000000001', 'KOUASSI', '1', 'M.', 'Ange Michel', 'M', '1985-03-15', 'Abidjan', 'CIV', 'CIV', 'CIV', 'M', 3, 'CI0185032541236', '00100', '001', 'O', 'FRA', 'N', 'N', 'ADMIN', '2020-01-15', '2024-06-10');

INSERT INTO bkcli (cli, nom, tcli, lib, pre, sext, dna, viln, payn, nat, res, sit, nbenf, nidn, age, ges, tax, lang, ichq, icb, utic, dou, dmo) VALUES
('CLI000000000002', 'KONAN', '1', 'Mme', 'Adjoua Marie', 'F', '1990-07-22', 'Bouake', 'CIV', 'CIV', 'CIV', 'M', 2, 'CI0290071234567', '00100', '001', 'O', 'FRA', 'N', 'N', 'ADMIN', '2020-02-20', '2024-05-18');

INSERT INTO bkcli (cli, nom, tcli, lib, pre, sext, dna, viln, payn, nat, res, sit, nbenf, nidn, age, ges, tax, lang, ichq, icb, utic, dou, dmo) VALUES
('CLI000000000003', 'TRAORE', '1', 'M.', 'Ibrahim', 'M', '1978-11-08', 'Korhogo', 'CIV', 'CIV', 'CIV', 'M', 4, 'CI0178110987654', '00200', '002', 'O', 'FRA', 'N', 'N', 'ADMIN', '2019-06-10', '2024-03-22');

INSERT INTO bkcli (cli, nom, tcli, lib, pre, sext, dna, viln, payn, nat, res, sit, nbenf, nidn, age, ges, tax, lang, ichq, icb, utic, dou, dmo) VALUES
('CLI000000000004', 'DIALLO', '1', 'Mme', 'Fatou', 'F', '1992-04-30', 'Man', 'CIV', 'CIV', 'CIV', 'C', 0, 'CI0292043214569', '00200', '002', 'O', 'FRA', 'N', 'N', 'ADMIN', '2021-03-05', '2024-07-01');

INSERT INTO bkcli (cli, nom, tcli, lib, pre, sext, dna, viln, payn, nat, res, sit, nbenf, nidn, age, ges, tax, lang, ichq, icb, utic, dou, dmo) VALUES
('CLI000000000005', 'YAO', '1', 'M.', 'Kouadio Jean', 'M', '1982-09-17', 'Yamoussoukro', 'CIV', 'CIV', 'CIV', 'M', 2, 'CI0182091478523', '00300', '003', 'O', 'FRA', 'N', 'N', 'ADMIN', '2018-11-28', '2024-04-15');

INSERT INTO bkcli (cli, nom, tcli, lib, pre, sext, dna, viln, payn, nat, res, sit, nbenf, nidn, age, ges, tax, lang, ichq, icb, utic, dou, dmo) VALUES
('CLI000000000006', 'BAMBA', '1', 'M.', 'Seydou', 'M', '1975-01-25', 'Daloa', 'CIV', 'CIV', 'CIV', 'V', 5, 'CI0175012365478', '00300', '003', 'O', 'FRA', 'N', 'N', 'ADMIN', '2017-05-12', '2024-02-28');

INSERT INTO bkcli (cli, nom, tcli, lib, pre, sext, dna, viln, payn, nat, res, sit, nbenf, nidn, age, ges, tax, lang, ichq, icb, utic, dou, dmo) VALUES
('CLI000000000007', 'KONE', '1', 'Mle', 'Aminata', 'F', '1995-12-03', 'San Pedro', 'CIV', 'CIV', 'CIV', 'C', 0, 'CI0195121234567', '00100', '001', 'O', 'FRA', 'N', 'N', 'ADMIN', '2022-08-19', '2024-08-19');

INSERT INTO bkcli (cli, nom, tcli, lib, pre, sext, dna, viln, payn, nat, res, sit, nbenf, nidn, age, ges, tax, lang, ichq, icb, utic, dou, dmo) VALUES
('CLI000000000008', 'OUATTARA', '1', 'M.', 'Mamadou', 'M', '1988-06-14', 'Ferkessedougou', 'CIV', 'CIV', 'CIV', 'M', 1, 'CI0188069874563', '00400', '004', 'O', 'FRA', 'N', 'N', 'ADMIN', '2019-12-03', '2024-01-20');

INSERT INTO bkcli (cli, nom, tcli, lib, pre, sext, dna, viln, payn, nat, res, sit, nbenf, nidn, age, ges, tax, lang, ichq, icb, utic, dou, dmo) VALUES
('CLI000000000009', 'TOURE', '1', 'Mme', 'Awa', 'F', '1987-02-28', 'Abengourou', 'CIV', 'CIV', 'CIV', 'D', 1, 'CI0187023698521', '00400', '004', 'O', 'FRA', 'N', 'N', 'ADMIN', '2020-07-14', '2024-06-05');

INSERT INTO bkcli (cli, nom, tcli, lib, pre, sext, dna, viln, payn, nat, res, sit, nbenf, nidn, age, ges, tax, lang, ichq, icb, utic, dou, dmo) VALUES
('CLI000000000010', 'COULIBALY', '1', 'M.', 'Drissa', 'M', '1980-08-09', 'Odienne', 'CIV', 'CIV', 'CIV', 'M', 3, 'CI0180086541237', '00500', '005', 'O', 'FRA', 'N', 'N', 'ADMIN', '2016-04-22', '2024-05-30');

INSERT INTO bkcli (cli, nom, tcli, lib, pre, sext, dna, viln, payn, nat, res, sit, nbenf, nidn, age, ges, tax, lang, ichq, icb, utic, dou, dmo) VALUES
('CLI000000000011', 'GNAGNE', '1', 'M.', 'Pascal', 'M', '1991-05-20', 'Gagnoa', 'CIV', 'CIV', 'CIV', 'C', 0, 'CI0191051478529', '00500', '005', 'O', 'FRA', 'N', 'N', 'ADMIN', '2021-09-08', '2024-09-08');

INSERT INTO bkcli (cli, nom, tcli, lib, pre, sext, dna, viln, payn, nat, res, sit, nbenf, nidn, age, ges, tax, lang, ichq, icb, utic, dou, dmo) VALUES
('CLI000000000012', 'SORO', '1', 'Mme', 'Mariam', 'F', '1983-10-11', 'Boundiali', 'CIV', 'CIV', 'CIV', 'M', 4, 'CI0183103214568', '00100', '001', 'O', 'FRA', 'N', 'N', 'ADMIN', '2018-03-17', '2024-04-02');

INSERT INTO bkcli (cli, nom, tcli, lib, pre, sext, dna, viln, payn, nat, res, sit, nbenf, nidn, age, ges, tax, lang, ichq, icb, utic, dou, dmo) VALUES
('CLI000000000013', 'ACHI', '1', 'M.', 'Christophe', 'M', '1976-07-04', 'Divo', 'CIV', 'CIV', 'CIV', 'M', 2, 'CI0176079517534', '00200', '002', 'O', 'FRA', 'Y', 'N', 'ADMIN', '2015-11-30', '2023-12-15');

INSERT INTO bkcli (cli, nom, tcli, lib, pre, sext, dna, viln, payn, nat, res, sit, nbenf, nidn, age, ges, tax, lang, ichq, icb, utic, dou, dmo) VALUES
('CLI000000000014', 'MEITE', '1', 'Mle', 'Rokia', 'F', '1998-03-18', 'Seguela', 'CIV', 'CIV', 'CIV', 'C', 0, 'CI0198031597534', '00300', '003', 'O', 'FRA', 'N', 'N', 'ADMIN', '2023-01-25', '2024-01-25');

INSERT INTO bkcli (cli, nom, tcli, lib, pre, sext, dna, viln, payn, nat, res, sit, nbenf, nidn, age, ges, tax, lang, ichq, icb, utic, dou, dmo) VALUES
('CLI000000000015', 'TANOH', '1', 'M.', 'Yves', 'M', '1984-12-25', 'Abidjan', 'CIV', 'CIV', 'CIV', 'M', 1, 'CI0184124578963', '00100', '001', 'O', 'FRA', 'N', 'N', 'ADMIN', '2019-08-07', '2024-07-12');

INSERT INTO bkcli (cli, nom, tcli, lib, pre, sext, dna, viln, payn, nat, res, sit, nbenf, nidn, age, ges, tax, lang, ichq, icb, utic, dou, dmo) VALUES
('CLI000000000016', 'ZADI', '1', 'Mme', 'Henriette', 'F', '1979-09-02', 'Aboisso', 'CIV', 'CIV', 'CIV', 'V', 3, 'CI0179096321457', '00400', '004', 'O', 'FRA', 'N', 'N', 'ADMIN', '2017-02-14', '2024-02-14');

INSERT INTO bkcli (cli, nom, tcli, lib, pre, sext, dna, viln, payn, nat, res, sit, nbenf, nidn, age, ges, tax, lang, ichq, icb, utic, dou, dmo) VALUES
('CLI000000000017', 'GUEHI', '1', 'M.', 'Simplice', 'M', '1993-04-07', 'Duekoue', 'CIV', 'CIV', 'CIV', 'C', 0, 'CI0193047412589', '00500', '005', 'O', 'FRA', 'N', 'N', 'ADMIN', '2022-05-30', '2024-05-30');

INSERT INTO bkcli (cli, nom, tcli, lib, pre, sext, dna, viln, payn, nat, res, sit, nbenf, nidn, age, ges, tax, lang, ichq, icb, utic, dou, dmo) VALUES
('CLI000000000018', 'LAGO', '1', 'Mme', 'Josephine', 'F', '1986-11-19', 'Soubre', 'CIV', 'CIV', 'CIV', 'M', 2, 'CI0186111236547', '00100', '001', 'O', 'FRA', 'N', 'N', 'ADMIN', '2020-10-22', '2024-06-18');

INSERT INTO bkcli (cli, nom, tcli, lib, pre, sext, dna, viln, payn, nat, res, sit, nbenf, nidn, age, ges, tax, lang, ichq, icb, utic, dou, dmo) VALUES
('CLI000000000019', 'KASSI', '1', 'M.', 'Emmanuel', 'M', '1981-06-30', 'Bondoukou', 'CIV', 'CIV', 'CIV', 'M', 4, 'CI0181063652147', '00200', '002', 'O', 'FRA', 'N', 'Y', 'ADMIN', '2018-07-05', '2024-03-10');

INSERT INTO bkcli (cli, nom, tcli, lib, pre, sext, dna, viln, payn, nat, res, sit, nbenf, nidn, age, ges, tax, lang, ichq, icb, utic, dou, dmo) VALUES
('CLI000000000020', 'DEMBELE', '1', 'Mle', 'Fanta', 'F', '1997-01-14', 'Tengrela', 'CIV', 'CIV', 'CIV', 'C', 0, 'CI0197017896321', '00300', '003', 'O', 'FRA', 'N', 'N', 'ADMIN', '2023-06-12', '2024-06-12');

-- Entreprises (tcli = '2')
INSERT INTO bkcli (cli, nom, tcli, rso, sig, datc, fju, nrc, vrc, nidf, npa, vpa, sec, age, ges, tax, lang, ichq, icb, utic, dou, dmo) VALUES
('CLI000000000021', 'GROUPE IVOIRE NEGOCE', '2', 'GROUPE IVOIRE NEGOCE SARL', 'GIN', '2010-03-20', 'SR', 'CI-ABJ-2010-B-05421', '2025-03-20', 'NIF2010054210', 'PT2010054210', '2025-03-20', 'COM01', '00100', '001', 'O', 'FRA', 'N', 'N', 'ADMIN', '2015-04-10', '2024-04-10');

INSERT INTO bkcli (cli, nom, tcli, rso, sig, datc, fju, nrc, vrc, nidf, npa, vpa, sec, age, ges, tax, lang, ichq, icb, utic, dou, dmo) VALUES
('CLI000000000022', 'SOC AFRICAINE CONSTRUCT', '2', 'SOCIETE AFRICAINE DE CONSTRUCTION SA', 'SAC', '2005-07-15', 'SA', 'CI-ABJ-2005-B-03215', '2025-07-15', 'NIF2005032150', 'PT2005032150', '2025-07-15', 'BTP01', '00100', '001', 'O', 'FRA', 'N', 'N', 'ADMIN', '2012-08-22', '2024-05-15');

INSERT INTO bkcli (cli, nom, tcli, rso, sig, datc, fju, nrc, vrc, nidf, npa, vpa, sec, age, ges, tax, lang, ichq, icb, utic, dou, dmo) VALUES
('CLI000000000023', 'TRANSPORT EXPRESS IVOIR', '2', 'TRANSPORT EXPRESS IVOIRE SARL', 'TEI', '2015-11-08', 'SR', 'CI-ABJ-2015-B-08742', '2025-11-08', 'NIF2015087420', 'PT2015087420', '2025-11-08', 'TRS01', '00200', '002', 'O', 'FRA', 'N', 'N', 'ADMIN', '2016-02-28', '2024-06-20');

INSERT INTO bkcli (cli, nom, tcli, rso, sig, datc, fju, nrc, vrc, nidf, npa, vpa, sec, age, ges, tax, lang, ichq, icb, utic, dou, dmo) VALUES
('CLI000000000024', 'AGRO BUSINESS CI', '2', 'AGRO BUSINESS COTE D IVOIRE SA', 'ABCI', '2008-04-25', 'SA', 'CI-ABJ-2008-B-06123', '2025-04-25', 'NIF2008061230', 'PT2008061230', '2025-04-25', 'AGR01', '00300', '003', 'O', 'FRA', 'N', 'N', 'ADMIN', '2013-06-14', '2024-03-08');

INSERT INTO bkcli (cli, nom, tcli, rso, sig, datc, fju, nrc, vrc, nidf, npa, vpa, sec, age, ges, tax, lang, ichq, icb, utic, dou, dmo) VALUES
('CLI000000000025', 'PHARMACIE DU PLATEAU', '2', 'PHARMACIE DU PLATEAU SARL', 'PDP', '2018-09-12', 'SR', 'CI-ABJ-2018-B-12456', '2025-09-12', 'NIF2018124560', 'PT2018124560', '2025-09-12', 'SAN01', '00100', '001', 'O', 'FRA', 'N', 'N', 'ADMIN', '2019-01-07', '2024-07-25');

INSERT INTO bkcli (cli, nom, tcli, rso, sig, datc, fju, nrc, vrc, nidf, npa, vpa, sec, age, ges, tax, lang, ichq, icb, utic, dou, dmo) VALUES
('CLI000000000026', 'HOTEL PALM BEACH ABJ', '2', 'HOTEL PALM BEACH ABIDJAN SA', 'HPBA', '2012-06-30', 'SA', 'CI-ABJ-2012-B-09854', '2025-06-30', 'NIF2012098540', 'PT2012098540', '2025-06-30', 'HTL01', '00400', '004', 'O', 'FRA', 'N', 'N', 'ADMIN', '2014-09-18', '2024-04-30');

INSERT INTO bkcli (cli, nom, tcli, rso, sig, datc, fju, nrc, vrc, nidf, npa, vpa, sec, age, ges, tax, lang, ichq, icb, utic, dou, dmo) VALUES
('CLI000000000027', 'IMPORTEX AFRIQUE', '2', 'IMPORTEX AFRIQUE SARL', 'IMPEX', '2016-02-14', 'SR', 'CI-ABJ-2016-B-10237', '2025-02-14', 'NIF2016102370', 'PT2016102370', '2025-02-14', 'COM01', '00500', '005', 'O', 'FRA', 'N', 'N', 'ADMIN', '2017-05-22', '2024-05-22');

INSERT INTO bkcli (cli, nom, tcli, rso, sig, datc, fju, nrc, vrc, nidf, npa, vpa, sec, age, ges, tax, lang, ichq, icb, utic, dou, dmo) VALUES
('CLI000000000028', 'CABINET JURIDIQUE AFR', '2', 'CABINET JURIDIQUE AFRIQUE SAS', 'CJA', '2014-10-05', 'SS', 'CI-ABJ-2014-B-11568', '2025-10-05', 'NIF2014115680', 'PT2014115680', '2025-10-05', 'SRV01', '00100', '001', 'O', 'FRA', 'N', 'N', 'ADMIN', '2015-12-10', '2024-02-18');

INSERT INTO bkcli (cli, nom, tcli, rso, sig, datc, fju, nrc, vrc, nidf, npa, vpa, sec, age, ges, tax, lang, ichq, icb, utic, dou, dmo) VALUES
('CLI000000000029', 'ENERGIE SOLAIRE CI', '2', 'ENERGIE SOLAIRE COTE D IVOIRE SA', 'ESCI', '2019-05-20', 'SA', 'CI-ABJ-2019-B-14785', '2025-05-20', 'NIF2019147850', 'PT2019147850', '2025-05-20', 'ENG01', '00200', '002', 'O', 'FRA', 'N', 'N', 'ADMIN', '2020-03-15', '2024-08-05');

INSERT INTO bkcli (cli, nom, tcli, rso, sig, datc, fju, nrc, vrc, nidf, npa, vpa, sec, age, ges, tax, lang, ichq, icb, utic, dou, dmo) VALUES
('CLI000000000030', 'RESTAURANT LE MAQUIS', '2', 'RESTAURANT LE MAQUIS SARL', 'RLM', '2017-08-18', 'SR', 'CI-ABJ-2017-B-13654', '2025-08-18', 'NIF2017136540', 'PT2017136540', '2025-08-18', 'RST01', '00300', '003', 'O', 'FRA', 'N', 'N', 'ADMIN', '2018-10-30', '2024-06-28');

-- ============================================================================
-- BKCOM - Comptes (Accounts)
-- ============================================================================

-- Comptes courants particuliers
INSERT INTO bkcom (ncp, suf, age, dev, cha, clc, cli, inti, typ, sde, sva, dou, dmo, ddm, ife, cfe, utic) VALUES
('00100000001', '00', '00100', 'XOF', '371000000', '45', 'CLI000000000001', 'KOUASSI ANGE MICHEL', 'CCP', 2547830.0000, 2547830.0000, '2020-01-15', '2024-12-01', '2024-12-01', 'N', 'N', 'ADMIN');

INSERT INTO bkcom (ncp, suf, age, dev, cha, clc, cli, inti, typ, sde, sva, dou, dmo, ddm, ife, cfe, utic) VALUES
('00100000002', '00', '00100', 'XOF', '371000000', '78', 'CLI000000000002', 'KONAN ADJOUA MARIE', 'CCP', 1285640.0000, 1285640.0000, '2020-02-20', '2024-11-28', '2024-11-28', 'N', 'N', 'ADMIN');

INSERT INTO bkcom (ncp, suf, age, dev, cha, clc, cli, inti, typ, sde, sva, dou, dmo, ddm, ife, cfe, utic) VALUES
('00200000003', '00', '00200', 'XOF', '371000000', '12', 'CLI000000000003', 'TRAORE IBRAHIM', 'CCP', 5478920.0000, 5478920.0000, '2019-06-10', '2024-12-02', '2024-12-02', 'N', 'N', 'ADMIN');

INSERT INTO bkcom (ncp, suf, age, dev, cha, clc, cli, inti, typ, sde, sva, dou, dmo, ddm, ife, cfe, utic) VALUES
('00200000004', '00', '00200', 'XOF', '371000000', '36', 'CLI000000000004', 'DIALLO FATOU', 'CCP', 847520.0000, 847520.0000, '2021-03-05', '2024-11-15', '2024-11-15', 'N', 'N', 'ADMIN');

INSERT INTO bkcom (ncp, suf, age, dev, cha, clc, cli, inti, typ, sde, sva, dou, dmo, ddm, ife, cfe, utic) VALUES
('00300000005', '00', '00300', 'XOF', '371000000', '89', 'CLI000000000005', 'YAO KOUADIO JEAN', 'CCP', 3256470.0000, 3256470.0000, '2018-11-28', '2024-12-03', '2024-12-03', 'N', 'N', 'ADMIN');

INSERT INTO bkcom (ncp, suf, age, dev, cha, clc, cli, inti, typ, sde, sva, dou, dmo, ddm, ife, cfe, utic) VALUES
('00300000006', '00', '00300', 'XOF', '371000000', '54', 'CLI000000000006', 'BAMBA SEYDOU', 'CCP', 12458970.0000, 12458970.0000, '2017-05-12', '2024-11-30', '2024-11-30', 'N', 'N', 'ADMIN');

INSERT INTO bkcom (ncp, suf, age, dev, cha, clc, cli, inti, typ, sde, sva, dou, dmo, ddm, ife, cfe, utic) VALUES
('00100000007', '00', '00100', 'XOF', '371000000', '23', 'CLI000000000007', 'KONE AMINATA', 'CCP', 425890.0000, 425890.0000, '2022-08-19', '2024-12-01', '2024-12-01', 'N', 'N', 'ADMIN');

INSERT INTO bkcom (ncp, suf, age, dev, cha, clc, cli, inti, typ, sde, sva, dou, dmo, ddm, ife, cfe, utic) VALUES
('00400000008', '00', '00400', 'XOF', '371000000', '67', 'CLI000000000008', 'OUATTARA MAMADOU', 'CCP', 1987450.0000, 1987450.0000, '2019-12-03', '2024-11-25', '2024-11-25', 'N', 'N', 'ADMIN');

INSERT INTO bkcom (ncp, suf, age, dev, cha, clc, cli, inti, typ, sde, sva, dou, dmo, ddm, ife, cfe, utic) VALUES
('00400000009', '00', '00400', 'XOF', '371000000', '91', 'CLI000000000009', 'TOURE AWA', 'CCP', 654780.0000, 654780.0000, '2020-07-14', '2024-12-02', '2024-12-02', 'N', 'N', 'ADMIN');

INSERT INTO bkcom (ncp, suf, age, dev, cha, clc, cli, inti, typ, sde, sva, dou, dmo, ddm, ife, cfe, utic) VALUES
('00500000010', '00', '00500', 'XOF', '371000000', '38', 'CLI000000000010', 'COULIBALY DRISSA', 'CCP', 8974520.0000, 8974520.0000, '2016-04-22', '2024-11-29', '2024-11-29', 'N', 'N', 'ADMIN');

INSERT INTO bkcom (ncp, suf, age, dev, cha, clc, cli, inti, typ, sde, sva, dou, dmo, ddm, ife, cfe, utic) VALUES
('00500000011', '00', '00500', 'XOF', '371000000', '62', 'CLI000000000011', 'GNAGNE PASCAL', 'CCP', 312450.0000, 312450.0000, '2021-09-08', '2024-12-01', '2024-12-01', 'N', 'N', 'ADMIN');

INSERT INTO bkcom (ncp, suf, age, dev, cha, clc, cli, inti, typ, sde, sva, dou, dmo, ddm, ife, cfe, utic) VALUES
('00100000012', '00', '00100', 'XOF', '371000000', '85', 'CLI000000000012', 'SORO MARIAM', 'CCP', 1745890.0000, 1745890.0000, '2018-03-17', '2024-11-27', '2024-11-27', 'N', 'N', 'ADMIN');

INSERT INTO bkcom (ncp, suf, age, dev, cha, clc, cli, inti, typ, sde, sva, dou, dmo, ddm, ife, cfe, utic) VALUES
('00200000013', '00', '00200', 'XOF', '371000000', '19', 'CLI000000000013', 'ACHI CHRISTOPHE', 'CCP', -547820.0000, -547820.0000, '2015-11-30', '2024-12-03', '2024-12-03', 'N', 'N', 'ADMIN');

INSERT INTO bkcom (ncp, suf, age, dev, cha, clc, cli, inti, typ, sde, sva, dou, dmo, ddm, ife, cfe, utic) VALUES
('00300000014', '00', '00300', 'XOF', '371000000', '43', 'CLI000000000014', 'MEITE ROKIA', 'CCP', 189750.0000, 189750.0000, '2023-01-25', '2024-11-20', '2024-11-20', 'N', 'N', 'ADMIN');

INSERT INTO bkcom (ncp, suf, age, dev, cha, clc, cli, inti, typ, sde, sva, dou, dmo, ddm, ife, cfe, utic) VALUES
('00100000015', '00', '00100', 'XOF', '371000000', '76', 'CLI000000000015', 'TANOH YVES', 'CCP', 2365470.0000, 2365470.0000, '2019-08-07', '2024-12-02', '2024-12-02', 'N', 'N', 'ADMIN');

INSERT INTO bkcom (ncp, suf, age, dev, cha, clc, cli, inti, typ, sde, sva, dou, dmo, ddm, ife, cfe, utic) VALUES
('00400000016', '00', '00400', 'XOF', '371000000', '28', 'CLI000000000016', 'ZADI HENRIETTE', 'CCP', 4521890.0000, 4521890.0000, '2017-02-14', '2024-11-30', '2024-11-30', 'N', 'N', 'ADMIN');

INSERT INTO bkcom (ncp, suf, age, dev, cha, clc, cli, inti, typ, sde, sva, dou, dmo, ddm, ife, cfe, utic) VALUES
('00500000017', '00', '00500', 'XOF', '371000000', '51', 'CLI000000000017', 'GUEHI SIMPLICE', 'CCP', 578940.0000, 578940.0000, '2022-05-30', '2024-12-01', '2024-12-01', 'N', 'N', 'ADMIN');

INSERT INTO bkcom (ncp, suf, age, dev, cha, clc, cli, inti, typ, sde, sva, dou, dmo, ddm, ife, cfe, utic) VALUES
('00100000018', '00', '00100', 'XOF', '371000000', '94', 'CLI000000000018', 'LAGO JOSEPHINE', 'CCP', 1654780.0000, 1654780.0000, '2020-10-22', '2024-11-28', '2024-11-28', 'N', 'N', 'ADMIN');

INSERT INTO bkcom (ncp, suf, age, dev, cha, clc, cli, inti, typ, sde, sva, dou, dmo, ddm, ife, cfe, utic) VALUES
('00200000019', '00', '00200', 'XOF', '371000000', '37', 'CLI000000000019', 'KASSI EMMANUEL', 'CCP', 987450.0000, 987450.0000, '2018-07-05', '2024-12-03', '2024-12-03', 'N', 'N', 'ADMIN');

INSERT INTO bkcom (ncp, suf, age, dev, cha, clc, cli, inti, typ, sde, sva, dou, dmo, ddm, ife, cfe, utic) VALUES
('00300000020', '00', '00300', 'XOF', '371000000', '69', 'CLI000000000020', 'DEMBELE FANTA', 'CCP', 245780.0000, 245780.0000, '2023-06-12', '2024-11-22', '2024-11-22', 'N', 'N', 'ADMIN');

-- Comptes courants entreprises
INSERT INTO bkcom (ncp, suf, age, dev, cha, clc, cli, inti, typ, sde, sva, dou, dmo, ddm, ife, cfe, utic) VALUES
('00100000021', '00', '00100', 'XOF', '371100000', '14', 'CLI000000000021', 'GROUPE IVOIRE NEGOCE', 'CCE', 45789520.0000, 45789520.0000, '2015-04-10', '2024-12-02', '2024-12-02', 'N', 'N', 'ADMIN');

INSERT INTO bkcom (ncp, suf, age, dev, cha, clc, cli, inti, typ, sde, sva, dou, dmo, ddm, ife, cfe, utic) VALUES
('00100000022', '00', '00100', 'XOF', '371100000', '82', 'CLI000000000022', 'SAC SA', 'CCE', 127845630.0000, 127845630.0000, '2012-08-22', '2024-12-01', '2024-12-01', 'N', 'N', 'ADMIN');

INSERT INTO bkcom (ncp, suf, age, dev, cha, clc, cli, inti, typ, sde, sva, dou, dmo, ddm, ife, cfe, utic) VALUES
('00200000023', '00', '00200', 'XOF', '371100000', '56', 'CLI000000000023', 'TRANSPORT EXPRESS', 'CCE', 23654780.0000, 23654780.0000, '2016-02-28', '2024-11-30', '2024-11-30', 'N', 'N', 'ADMIN');

INSERT INTO bkcom (ncp, suf, age, dev, cha, clc, cli, inti, typ, sde, sva, dou, dmo, ddm, ife, cfe, utic) VALUES
('00300000024', '00', '00300', 'XOF', '371100000', '29', 'CLI000000000024', 'AGRO BUSINESS CI', 'CCE', 89745210.0000, 89745210.0000, '2013-06-14', '2024-12-03', '2024-12-03', 'N', 'N', 'ADMIN');

INSERT INTO bkcom (ncp, suf, age, dev, cha, clc, cli, inti, typ, sde, sva, dou, dmo, ddm, ife, cfe, utic) VALUES
('00100000025', '00', '00100', 'XOF', '371100000', '73', 'CLI000000000025', 'PHARMACIE DU PLATEAU', 'CCE', 15478920.0000, 15478920.0000, '2019-01-07', '2024-11-29', '2024-11-29', 'N', 'N', 'ADMIN');

INSERT INTO bkcom (ncp, suf, age, dev, cha, clc, cli, inti, typ, sde, sva, dou, dmo, ddm, ife, cfe, utic) VALUES
('00400000026', '00', '00400', 'XOF', '371100000', '48', 'CLI000000000026', 'HOTEL PALM BEACH', 'CCE', 67892450.0000, 67892450.0000, '2014-09-18', '2024-12-02', '2024-12-02', 'N', 'N', 'ADMIN');

INSERT INTO bkcom (ncp, suf, age, dev, cha, clc, cli, inti, typ, sde, sva, dou, dmo, ddm, ife, cfe, utic) VALUES
('00500000027', '00', '00500', 'XOF', '371100000', '95', 'CLI000000000027', 'IMPORTEX AFRIQUE', 'CCE', 34521780.0000, 34521780.0000, '2017-05-22', '2024-11-28', '2024-11-28', 'N', 'N', 'ADMIN');

INSERT INTO bkcom (ncp, suf, age, dev, cha, clc, cli, inti, typ, sde, sva, dou, dmo, ddm, ife, cfe, utic) VALUES
('00100000028', '00', '00100', 'XOF', '371100000', '61', 'CLI000000000028', 'CABINET JURIDIQUE AFR', 'CCE', 8965470.0000, 8965470.0000, '2015-12-10', '2024-12-01', '2024-12-01', 'N', 'N', 'ADMIN');

INSERT INTO bkcom (ncp, suf, age, dev, cha, clc, cli, inti, typ, sde, sva, dou, dmo, ddm, ife, cfe, utic) VALUES
('00200000029', '00', '00200', 'XOF', '371100000', '34', 'CLI000000000029', 'ENERGIE SOLAIRE CI', 'CCE', 52147890.0000, 52147890.0000, '2020-03-15', '2024-11-30', '2024-11-30', 'N', 'N', 'ADMIN');

INSERT INTO bkcom (ncp, suf, age, dev, cha, clc, cli, inti, typ, sde, sva, dou, dmo, ddm, ife, cfe, utic) VALUES
('00300000030', '00', '00300', 'XOF', '371100000', '87', 'CLI000000000030', 'RESTAURANT LE MAQUIS', 'CCE', 6547820.0000, 6547820.0000, '2018-10-30', '2024-12-03', '2024-12-03', 'N', 'N', 'ADMIN');

-- Comptes epargne (pour certains particuliers)
INSERT INTO bkcom (ncp, suf, age, dev, cha, clc, cli, inti, typ, sde, sva, dou, dmo, ddm, ife, cfe, utic) VALUES
('00100000031', '01', '00100', 'XOF', '372000000', '52', 'CLI000000000001', 'KOUASSI ANGE MICHEL EP', 'CEP', 5478920.0000, 5478920.0000, '2020-03-20', '2024-11-15', '2024-11-15', 'N', 'N', 'ADMIN');

INSERT INTO bkcom (ncp, suf, age, dev, cha, clc, cli, inti, typ, sde, sva, dou, dmo, ddm, ife, cfe, utic) VALUES
('00100000032', '01', '00100', 'XOF', '372000000', '18', 'CLI000000000005', 'YAO KOUADIO JEAN EP', 'CEP', 12547890.0000, 12547890.0000, '2019-02-10', '2024-10-30', '2024-10-30', 'N', 'N', 'ADMIN');

INSERT INTO bkcom (ncp, suf, age, dev, cha, clc, cli, inti, typ, sde, sva, dou, dmo, ddm, ife, cfe, utic) VALUES
('00100000033', '01', '00100', 'XOF', '372000000', '74', 'CLI000000000010', 'COULIBALY DRISSA EP', 'CEP', 25478960.0000, 25478960.0000, '2017-08-05', '2024-11-20', '2024-11-20', 'N', 'N', 'ADMIN');

-- ============================================================================
-- BKADCLI - Adresses Clients
-- ============================================================================

INSERT INTO bkadcli (cli, typ, lang, adr1, adr2, ville, dep, reg, cpos, cpay, email, bpos) VALUES
('CLI000000000001', '01', 'FRA', 'Cocody Riviera 2', 'Rue des Jardins', 'Abidjan', 'Abidjan', 'Lagunes', '01 BP 1234', 'CIV', 'ange.kouassi@email.ci', 'BP 1234');

INSERT INTO bkadcli (cli, typ, lang, adr1, adr2, ville, dep, reg, cpos, cpay, email, bpos) VALUES
('CLI000000000002', '01', 'FRA', 'Yopougon Selmer', 'Quartier Millionnaire', 'Abidjan', 'Abidjan', 'Lagunes', '24 BP 567', 'CIV', 'marie.konan@email.ci', 'BP 567');

INSERT INTO bkadcli (cli, typ, lang, adr1, adr2, ville, dep, reg, cpos, cpay, email, bpos) VALUES
('CLI000000000003', '01', 'FRA', 'Quartier Commerce', 'Avenue principale', 'Bouake', 'Bouake', 'Vallee du Bandama', '05 BP 890', 'CIV', 'ibrahim.traore@email.ci', 'BP 890');

INSERT INTO bkadcli (cli, typ, lang, adr1, adr2, ville, dep, reg, cpos, cpay, email, bpos) VALUES
('CLI000000000004', '01', 'FRA', 'Quartier Residentiel', 'Lot 45', 'Man', 'Man', 'Montagnes', '16 BP 234', 'CIV', 'fatou.diallo@email.ci', 'BP 234');

INSERT INTO bkadcli (cli, typ, lang, adr1, adr2, ville, dep, reg, cpos, cpay, email, bpos) VALUES
('CLI000000000005', '01', 'FRA', 'Quartier Habitat', 'Villa 12', 'Yamoussoukro', 'Yamoussoukro', 'Lacs', '06 BP 456', 'CIV', 'jean.yao@email.ci', 'BP 456');

INSERT INTO bkadcli (cli, typ, lang, adr1, adr2, ville, dep, reg, cpos, cpay, email, bpos) VALUES
('CLI000000000006', '01', 'FRA', 'Zone industrielle', 'Rue Commerce', 'Daloa', 'Daloa', 'Sassandra-Marahoue', '09 BP 789', 'CIV', 'seydou.bamba@email.ci', 'BP 789');

INSERT INTO bkadcli (cli, typ, lang, adr1, adr2, ville, dep, reg, cpos, cpay, email, bpos) VALUES
('CLI000000000007', '01', 'FRA', 'Cocody Angre', 'Residence Palm', 'Abidjan', 'Abidjan', 'Lagunes', '08 BP 321', 'CIV', 'aminata.kone@email.ci', 'BP 321');

INSERT INTO bkadcli (cli, typ, lang, adr1, adr2, ville, dep, reg, cpos, cpay, email, bpos) VALUES
('CLI000000000008', '01', 'FRA', 'Quartier Central', 'Avenue Houphouet', 'Ferkessedougou', 'Ferkessedougou', 'Savanes', '42 BP 654', 'CIV', 'mamadou.ouattara@email.ci', 'BP 654');

INSERT INTO bkadcli (cli, typ, lang, adr1, adr2, ville, dep, reg, cpos, cpay, email, bpos) VALUES
('CLI000000000009', '01', 'FRA', 'Quartier France', 'Rue du marche', 'Abengourou', 'Abengourou', 'Comoe', '19 BP 987', 'CIV', 'awa.toure@email.ci', 'BP 987');

INSERT INTO bkadcli (cli, typ, lang, adr1, adr2, ville, dep, reg, cpos, cpay, email, bpos) VALUES
('CLI000000000010', '01', 'FRA', 'Quartier Administratif', 'Boulevard principal', 'Odienne', 'Odienne', 'Denguele', '33 BP 147', 'CIV', 'drissa.coulibaly@email.ci', 'BP 147');

INSERT INTO bkadcli (cli, typ, lang, adr1, adr2, ville, dep, reg, cpos, cpay, email, bpos) VALUES
('CLI000000000011', '01', 'FRA', 'Marcory Zone 4', 'Immeuble Les Perles', 'Abidjan', 'Abidjan', 'Lagunes', '11 BP 258', 'CIV', 'pascal.gnagne@email.ci', 'BP 258');

INSERT INTO bkadcli (cli, typ, lang, adr1, adr2, ville, dep, reg, cpos, cpay, email, bpos) VALUES
('CLI000000000012', '01', 'FRA', 'Plateau Dokui', 'Avenue Chardy', 'Abidjan', 'Abidjan', 'Lagunes', '01 BP 369', 'CIV', 'mariam.soro@email.ci', 'BP 369');

INSERT INTO bkadcli (cli, typ, lang, adr1, adr2, ville, dep, reg, cpos, cpay, email, bpos) VALUES
('CLI000000000013', '01', 'FRA', 'Quartier Gbokora', 'Rue du Lycee', 'Divo', 'Divo', 'Loh-Djiboua', '28 BP 741', 'CIV', 'christophe.achi@email.ci', 'BP 741');

INSERT INTO bkadcli (cli, typ, lang, adr1, adr2, ville, dep, reg, cpos, cpay, email, bpos) VALUES
('CLI000000000014', '01', 'FRA', 'Quartier Commercial', 'Avenue du marche', 'Seguela', 'Seguela', 'Worodougou', '35 BP 852', 'CIV', 'rokia.meite@email.ci', 'BP 852');

INSERT INTO bkadcli (cli, typ, lang, adr1, adr2, ville, dep, reg, cpos, cpay, email, bpos) VALUES
('CLI000000000015', '01', 'FRA', 'Cocody 2 Plateaux', 'Vallon Rue J45', 'Abidjan', 'Abidjan', 'Lagunes', '28 BP 963', 'CIV', 'yves.tanoh@email.ci', 'BP 963');

INSERT INTO bkadcli (cli, typ, lang, adr1, adr2, ville, dep, reg, cpos, cpay, email, bpos) VALUES
('CLI000000000016', '01', 'FRA', 'Quartier Palmeraie', 'Lot 78', 'Aboisso', 'Aboisso', 'Sud-Comoe', '22 BP 159', 'CIV', 'henriette.zadi@email.ci', 'BP 159');

INSERT INTO bkadcli (cli, typ, lang, adr1, adr2, ville, dep, reg, cpos, cpay, email, bpos) VALUES
('CLI000000000017', '01', 'FRA', 'Quartier Residentiel', 'Villa 34', 'Duekoue', 'Duekoue', 'Montagnes', '38 BP 357', 'CIV', 'simplice.guehi@email.ci', 'BP 357');

INSERT INTO bkadcli (cli, typ, lang, adr1, adr2, ville, dep, reg, cpos, cpay, email, bpos) VALUES
('CLI000000000018', '01', 'FRA', 'Riviera Palmeraie', 'Cite SCI', 'Abidjan', 'Abidjan', 'Lagunes', '08 BP 486', 'CIV', 'josephine.lago@email.ci', 'BP 486');

INSERT INTO bkadcli (cli, typ, lang, adr1, adr2, ville, dep, reg, cpos, cpay, email, bpos) VALUES
('CLI000000000019', '01', 'FRA', 'Quartier Nord', 'Avenue Commerce', 'Bondoukou', 'Bondoukou', 'Gontougo', '25 BP 624', 'CIV', 'emmanuel.kassi@email.ci', 'BP 624');

INSERT INTO bkadcli (cli, typ, lang, adr1, adr2, ville, dep, reg, cpos, cpay, email, bpos) VALUES
('CLI000000000020', '01', 'FRA', 'Quartier Commercial', 'Rue principale', 'Tengrela', 'Tengrela', 'Bagoue', '45 BP 813', 'CIV', 'fanta.dembele@email.ci', 'BP 813');

-- Adresses entreprises (Siege social)
INSERT INTO bkadcli (cli, typ, lang, adr1, adr2, ville, dep, reg, cpos, cpay, email, bpos) VALUES
('CLI000000000021', '01', 'FRA', 'Zone 4 Marcory', 'Rue des Commercants', 'Abidjan', 'Abidjan', 'Lagunes', '01 BP 5421', 'CIV', 'contact@gin.ci', 'BP 5421');

INSERT INTO bkadcli (cli, typ, lang, adr1, adr2, ville, dep, reg, cpos, cpay, email, bpos) VALUES
('CLI000000000022', '01', 'FRA', 'Plateau Avenue Chardy', 'Immeuble Alpha 2000', 'Abidjan', 'Abidjan', 'Lagunes', '01 BP 3215', 'CIV', 'contact@sac-ci.com', 'BP 3215');

INSERT INTO bkadcli (cli, typ, lang, adr1, adr2, ville, dep, reg, cpos, cpay, email, bpos) VALUES
('CLI000000000023', '01', 'FRA', 'Yopougon Zone Ind.', 'Lot 45 Rue 12', 'Abidjan', 'Abidjan', 'Lagunes', '23 BP 8742', 'CIV', 'info@tei.ci', 'BP 8742');

INSERT INTO bkadcli (cli, typ, lang, adr1, adr2, ville, dep, reg, cpos, cpay, email, bpos) VALUES
('CLI000000000024', '01', 'FRA', 'Cocody Blockhauss', 'Immeuble Le Fromager', 'Abidjan', 'Abidjan', 'Lagunes', '01 BP 6123', 'CIV', 'contact@abci.ci', 'BP 6123');

INSERT INTO bkadcli (cli, typ, lang, adr1, adr2, ville, dep, reg, cpos, cpay, email, bpos) VALUES
('CLI000000000025', '01', 'FRA', 'Plateau Rue Commerce', 'Face Cathedrale', 'Abidjan', 'Abidjan', 'Lagunes', '01 BP 12456', 'CIV', 'pharmacie.plateau@gmail.com', 'BP 12456');

INSERT INTO bkadcli (cli, typ, lang, adr1, adr2, ville, dep, reg, cpos, cpay, email, bpos) VALUES
('CLI000000000026', '01', 'FRA', 'Bassam Boulevard', 'Front de mer', 'Grand-Bassam', 'Grand-Bassam', 'Sud-Comoe', '01 BP 9854', 'CIV', 'reservation@hpba.ci', 'BP 9854');

INSERT INTO bkadcli (cli, typ, lang, adr1, adr2, ville, dep, reg, cpos, cpay, email, bpos) VALUES
('CLI000000000027', '01', 'FRA', 'Treichville Avenue 22', 'Immeuble Nour', 'Abidjan', 'Abidjan', 'Lagunes', '18 BP 10237', 'CIV', 'info@importex.ci', 'BP 10237');

INSERT INTO bkadcli (cli, typ, lang, adr1, adr2, ville, dep, reg, cpos, cpay, email, bpos) VALUES
('CLI000000000028', '01', 'FRA', 'Plateau Rue Gourgas', 'Immeuble Sipim 5eme', 'Abidjan', 'Abidjan', 'Lagunes', '01 BP 11568', 'CIV', 'contact@cja.ci', 'BP 11568');

INSERT INTO bkadcli (cli, typ, lang, adr1, adr2, ville, dep, reg, cpos, cpay, email, bpos) VALUES
('CLI000000000029', '01', 'FRA', 'Cocody Riviera Golf', 'Zone Ambassades', 'Abidjan', 'Abidjan', 'Lagunes', '01 BP 14785', 'CIV', 'info@esci.ci', 'BP 14785');

INSERT INTO bkadcli (cli, typ, lang, adr1, adr2, ville, dep, reg, cpos, cpay, email, bpos) VALUES
('CLI000000000030', '01', 'FRA', 'Cocody Angre', 'Carrefour Priere', 'Abidjan', 'Abidjan', 'Lagunes', '28 BP 13654', 'CIV', 'maquis.reserve@gmail.com', 'BP 13654');

-- ============================================================================
-- BKPRFCLI - Profils Professionnels (Particuliers uniquement)
-- ============================================================================

INSERT INTO bkprfcli (cli, prf, emp, demb, trev, demp) VALUES ('CLI000000000001', 'CAD', 'ORANGE CI', '2015-04-01', '05', 'Abidjan');
INSERT INTO bkprfcli (cli, prf, emp, demb, trev, demp) VALUES ('CLI000000000002', 'EMP', 'BSIC BANK', '2018-09-15', '04', 'Abidjan');
INSERT INTO bkprfcli (cli, prf, emp, demb, trev, demp) VALUES ('CLI000000000003', 'COM', 'INDEPENDANT', '2010-01-10', '06', 'Bouake');
INSERT INTO bkprfcli (cli, prf, emp, demb, trev, demp) VALUES ('CLI000000000004', 'ETU', NULL, NULL, '01', NULL);
INSERT INTO bkprfcli (cli, prf, emp, demb, trev, demp) VALUES ('CLI000000000005', 'ING', 'CIE', '2012-03-20', '07', 'Yamoussoukro');
INSERT INTO bkprfcli (cli, prf, emp, demb, trev, demp) VALUES ('CLI000000000006', 'DIR', 'AUTO-EMPLOYE', '2005-07-01', '08', 'Daloa');
INSERT INTO bkprfcli (cli, prf, emp, demb, trev, demp) VALUES ('CLI000000000007', 'STG', 'SODECI', '2023-01-15', '02', 'Abidjan');
INSERT INTO bkprfcli (cli, prf, emp, demb, trev, demp) VALUES ('CLI000000000008', 'ENS', 'MENET-FP', '2014-10-01', '04', 'Ferkessedougou');
INSERT INTO bkprfcli (cli, prf, emp, demb, trev, demp) VALUES ('CLI000000000009', 'MED', 'CHU COCODY', '2016-06-15', '06', 'Abidjan');
INSERT INTO bkprfcli (cli, prf, emp, demb, trev, demp) VALUES ('CLI000000000010', 'AGR', 'INDEPENDANT', '2000-03-01', '05', 'Odienne');
INSERT INTO bkprfcli (cli, prf, emp, demb, trev, demp) VALUES ('CLI000000000011', 'INF', 'MTN CI', '2021-02-01', '04', 'Abidjan');
INSERT INTO bkprfcli (cli, prf, emp, demb, trev, demp) VALUES ('CLI000000000012', 'COM', 'PROSUMA', '2017-11-20', '03', 'Abidjan');
INSERT INTO bkprfcli (cli, prf, emp, demb, trev, demp) VALUES ('CLI000000000013', 'RET', NULL, '1975-06-01', '02', NULL);
INSERT INTO bkprfcli (cli, prf, emp, demb, trev, demp) VALUES ('CLI000000000014', 'ETU', NULL, NULL, '01', NULL);
INSERT INTO bkprfcli (cli, prf, emp, demb, trev, demp) VALUES ('CLI000000000015', 'AVT', 'BICICI', '2011-08-10', '05', 'Abidjan');
INSERT INTO bkprfcli (cli, prf, emp, demb, trev, demp) VALUES ('CLI000000000016', 'COM', 'INDEPENDANT', '2008-04-15', '04', 'Aboisso');
INSERT INTO bkprfcli (cli, prf, emp, demb, trev, demp) VALUES ('CLI000000000017', 'TEC', 'PETRO IVOIRE', '2020-07-01', '03', 'Duekoue');
INSERT INTO bkprfcli (cli, prf, emp, demb, trev, demp) VALUES ('CLI000000000018', 'SEC', 'CFAO MOTORS', '2019-05-20', '03', 'Abidjan');
INSERT INTO bkprfcli (cli, prf, emp, demb, trev, demp) VALUES ('CLI000000000019', 'AGR', 'INDEPENDANT', '2005-01-01', '04', 'Bondoukou');
INSERT INTO bkprfcli (cli, prf, emp, demb, trev, demp) VALUES ('CLI000000000020', 'ETU', NULL, NULL, '01', NULL);

-- ============================================================================
-- BKCNTCLI - Contacts Clients
-- ============================================================================

INSERT INTO bkcntcli (cli, nom, pre, tel, email) VALUES ('CLI000000000001', 'KOUASSI', 'Ange Michel', '+225 0708123456', 'ange.kouassi@email.ci');
INSERT INTO bkcntcli (cli, nom, pre, tel, email) VALUES ('CLI000000000002', 'KONAN', 'Adjoua Marie', '+225 0507234567', 'marie.konan@email.ci');
INSERT INTO bkcntcli (cli, nom, pre, tel, email) VALUES ('CLI000000000003', 'TRAORE', 'Ibrahim', '+225 0102345678', 'ibrahim.traore@email.ci');
INSERT INTO bkcntcli (cli, nom, pre, tel, email) VALUES ('CLI000000000004', 'DIALLO', 'Fatou', '+225 0503456789', 'fatou.diallo@email.ci');
INSERT INTO bkcntcli (cli, nom, pre, tel, email) VALUES ('CLI000000000005', 'YAO', 'Kouadio Jean', '+225 0704567890', 'jean.yao@email.ci');
INSERT INTO bkcntcli (cli, nom, pre, tel, email) VALUES ('CLI000000000006', 'BAMBA', 'Seydou', '+225 0105678901', 'seydou.bamba@email.ci');
INSERT INTO bkcntcli (cli, nom, pre, tel, email) VALUES ('CLI000000000007', 'KONE', 'Aminata', '+225 0506789012', 'aminata.kone@email.ci');
INSERT INTO bkcntcli (cli, nom, pre, tel, email) VALUES ('CLI000000000008', 'OUATTARA', 'Mamadou', '+225 0707890123', 'mamadou.ouattara@email.ci');
INSERT INTO bkcntcli (cli, nom, pre, tel, email) VALUES ('CLI000000000009', 'TOURE', 'Awa', '+225 0108901234', 'awa.toure@email.ci');
INSERT INTO bkcntcli (cli, nom, pre, tel, email) VALUES ('CLI000000000010', 'COULIBALY', 'Drissa', '+225 0509012345', 'drissa.coulibaly@email.ci');
INSERT INTO bkcntcli (cli, nom, pre, tel, email) VALUES ('CLI000000000011', 'GNAGNE', 'Pascal', '+225 0710123456', 'pascal.gnagne@email.ci');
INSERT INTO bkcntcli (cli, nom, pre, tel, email) VALUES ('CLI000000000012', 'SORO', 'Mariam', '+225 0511234567', 'mariam.soro@email.ci');
INSERT INTO bkcntcli (cli, nom, pre, tel, email) VALUES ('CLI000000000013', 'ACHI', 'Christophe', '+225 0112345678', 'christophe.achi@email.ci');
INSERT INTO bkcntcli (cli, nom, pre, tel, email) VALUES ('CLI000000000014', 'MEITE', 'Rokia', '+225 0713456789', 'rokia.meite@email.ci');
INSERT INTO bkcntcli (cli, nom, pre, tel, email) VALUES ('CLI000000000015', 'TANOH', 'Yves', '+225 0514567890', 'yves.tanoh@email.ci');
INSERT INTO bkcntcli (cli, nom, pre, tel, email) VALUES ('CLI000000000016', 'ZADI', 'Henriette', '+225 0115678901', 'henriette.zadi@email.ci');
INSERT INTO bkcntcli (cli, nom, pre, tel, email) VALUES ('CLI000000000017', 'GUEHI', 'Simplice', '+225 0716789012', 'simplice.guehi@email.ci');
INSERT INTO bkcntcli (cli, nom, pre, tel, email) VALUES ('CLI000000000018', 'LAGO', 'Josephine', '+225 0517890123', 'josephine.lago@email.ci');
INSERT INTO bkcntcli (cli, nom, pre, tel, email) VALUES ('CLI000000000019', 'KASSI', 'Emmanuel', '+225 0118901234', 'emmanuel.kassi@email.ci');
INSERT INTO bkcntcli (cli, nom, pre, tel, email) VALUES ('CLI000000000020', 'DEMBELE', 'Fanta', '+225 0719012345', 'fanta.dembele@email.ci');

-- Contacts entreprises (Responsables)
INSERT INTO bkcntcli (cli, nom, pre, tel, email) VALUES ('CLI000000000021', 'KOUAME', 'Georges', '+225 2720300101', 'g.kouame@gin.ci');
INSERT INTO bkcntcli (cli, nom, pre, tel, email) VALUES ('CLI000000000022', 'KOFFI', 'Bernard', '+225 2720200202', 'b.koffi@sac-ci.com');
INSERT INTO bkcntcli (cli, nom, pre, tel, email) VALUES ('CLI000000000023', 'ASSI', 'Patrick', '+225 2721300303', 'p.assi@tei.ci');
INSERT INTO bkcntcli (cli, nom, pre, tel, email) VALUES ('CLI000000000024', 'BROU', 'Sylvain', '+225 2722400404', 's.brou@abci.ci');
INSERT INTO bkcntcli (cli, nom, pre, tel, email) VALUES ('CLI000000000025', 'TAPE', 'Augustin', '+225 2720500505', 'a.tape@pdp.ci');
INSERT INTO bkcntcli (cli, nom, pre, tel, email) VALUES ('CLI000000000026', 'N GUESSAN', 'Marcel', '+225 2721600606', 'm.nguessan@hpba.ci');
INSERT INTO bkcntcli (cli, nom, pre, tel, email) VALUES ('CLI000000000027', 'DIABATE', 'Souleymane', '+225 2722700707', 's.diabate@importex.ci');
INSERT INTO bkcntcli (cli, nom, pre, tel, email) VALUES ('CLI000000000028', 'KOBENAN', 'Isabelle', '+225 2720800808', 'i.kobenan@cja.ci');
INSERT INTO bkcntcli (cli, nom, pre, tel, email) VALUES ('CLI000000000029', 'OULAI', 'Franck', '+225 2721900909', 'f.oulai@esci.ci');
INSERT INTO bkcntcli (cli, nom, pre, tel, email) VALUES ('CLI000000000030', 'GBANE', 'Lacina', '+225 2722001010', 'l.gbane@maquis.ci');

-- ============================================================================
-- BKEMACLI - Emails Clients
-- ============================================================================

-- Emails personnels particuliers
INSERT INTO bkemacli (cli, typ, email, atrf) VALUES ('CLI000000000001', 'PER', 'ange.kouassi@gmail.com', 'N');
INSERT INTO bkemacli (cli, typ, email, atrf) VALUES ('CLI000000000002', 'PER', 'marie.konan@yahoo.fr', 'N');
INSERT INTO bkemacli (cli, typ, email, atrf) VALUES ('CLI000000000003', 'PER', 'ibrahim.traore@gmail.com', 'N');
INSERT INTO bkemacli (cli, typ, email, atrf) VALUES ('CLI000000000004', 'PER', 'fatou.diallo@outlook.com', 'N');
INSERT INTO bkemacli (cli, typ, email, atrf) VALUES ('CLI000000000005', 'PER', 'jean.yao@gmail.com', 'N');
INSERT INTO bkemacli (cli, typ, email, atrf) VALUES ('CLI000000000006', 'PER', 'seydou.bamba@yahoo.fr', 'N');
INSERT INTO bkemacli (cli, typ, email, atrf) VALUES ('CLI000000000007', 'PER', 'aminata.kone@gmail.com', 'N');
INSERT INTO bkemacli (cli, typ, email, atrf) VALUES ('CLI000000000008', 'PER', 'mamadou.ouattara@outlook.com', 'N');
INSERT INTO bkemacli (cli, typ, email, atrf) VALUES ('CLI000000000009', 'PER', 'awa.toure@gmail.com', 'N');
INSERT INTO bkemacli (cli, typ, email, atrf) VALUES ('CLI000000000010', 'PER', 'drissa.coulibaly@yahoo.fr', 'N');

-- Emails professionnels particuliers
INSERT INTO bkemacli (cli, typ, email, atrf) VALUES ('CLI000000000001', 'PRO', 'akouassi@orange.ci', 'N');
INSERT INTO bkemacli (cli, typ, email, atrf) VALUES ('CLI000000000002', 'PRO', 'mkonan@bsic.ci', 'N');
INSERT INTO bkemacli (cli, typ, email, atrf) VALUES ('CLI000000000005', 'PRO', 'jyao@cie.ci', 'N');
INSERT INTO bkemacli (cli, typ, email, atrf) VALUES ('CLI000000000008', 'PRO', 'mouattara@menet-fp.gouv.ci', 'N');
INSERT INTO bkemacli (cli, typ, email, atrf) VALUES ('CLI000000000009', 'PRO', 'atoure@chucocody.ci', 'N');
INSERT INTO bkemacli (cli, typ, email, atrf) VALUES ('CLI000000000011', 'PRO', 'pgnagne@mtn.ci', 'N');
INSERT INTO bkemacli (cli, typ, email, atrf) VALUES ('CLI000000000015', 'PRO', 'ytanoh@bicici.com', 'N');
INSERT INTO bkemacli (cli, typ, email, atrf) VALUES ('CLI000000000017', 'PRO', 'sguehi@petroivoire.ci', 'N');
INSERT INTO bkemacli (cli, typ, email, atrf) VALUES ('CLI000000000018', 'PRO', 'jlago@cfao.com', 'N');

-- Emails entreprises
INSERT INTO bkemacli (cli, typ, email, atrf) VALUES ('CLI000000000021', 'PRO', 'contact@gin.ci', 'N');
INSERT INTO bkemacli (cli, typ, email, atrf) VALUES ('CLI000000000022', 'PRO', 'contact@sac-ci.com', 'N');
INSERT INTO bkemacli (cli, typ, email, atrf) VALUES ('CLI000000000023', 'PRO', 'info@tei.ci', 'N');
INSERT INTO bkemacli (cli, typ, email, atrf) VALUES ('CLI000000000024', 'PRO', 'contact@abci.ci', 'N');
INSERT INTO bkemacli (cli, typ, email, atrf) VALUES ('CLI000000000025', 'PRO', 'pharmacie.plateau@gmail.com', 'N');
INSERT INTO bkemacli (cli, typ, email, atrf) VALUES ('CLI000000000026', 'PRO', 'reservation@hpba.ci', 'N');
INSERT INTO bkemacli (cli, typ, email, atrf) VALUES ('CLI000000000027', 'PRO', 'info@importex.ci', 'N');
INSERT INTO bkemacli (cli, typ, email, atrf) VALUES ('CLI000000000028', 'PRO', 'contact@cja.ci', 'N');
INSERT INTO bkemacli (cli, typ, email, atrf) VALUES ('CLI000000000029', 'PRO', 'info@esci.ci', 'N');
INSERT INTO bkemacli (cli, typ, email, atrf) VALUES ('CLI000000000030', 'PRO', 'maquis.reserve@gmail.com', 'N');

-- ============================================================================
-- End of Seed Data
-- ============================================================================
