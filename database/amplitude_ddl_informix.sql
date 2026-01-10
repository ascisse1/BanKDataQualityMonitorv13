-- ============================================================================
-- AMPLITUDE CBS - Complete DDL Script for INFORMIX
-- BSIC Bank - Core Banking System Database Schema
-- ============================================================================
-- NOTE: Foreign key constraints are in a separate file (amplitude_fk_informix.sql)
--       to allow bulk data loading without constraint violations.
-- ============================================================================

-- Drop tables if exist (in reverse dependency order)
-- DROP TABLE IF EXISTS bkemacli;
-- DROP TABLE IF EXISTS bkcntcli;
-- DROP TABLE IF EXISTS bkprfcli;
-- DROP TABLE IF EXISTS bkadcli;
-- DROP TABLE IF EXISTS bkcom;
-- DROP TABLE IF EXISTS bkcli;

-- ============================================================================
-- Table: bkcli - Clients (Main client table)
-- ============================================================================
CREATE TABLE bkcli (
    -- Primary Key
    cli           CHAR(15) NOT NULL,

    -- Identity Information
    nom           CHAR(36),
    tcli          CHAR(1),
    lib           CHAR(2),
    pre           CHAR(30),
    sext          CHAR(1),
    dna           DATE,
    viln          CHAR(30),
    payn          CHAR(3),
    nat           CHAR(3),
    res           CHAR(3),
    midname       CHAR(30),
    nomrest       CHAR(67),
    nmer          CHAR(36),
    regn          CHAR(50),

    -- Family Status
    sit           CHAR(1),
    reg           CHAR(1),
    tconj         CHAR(1),
    conj          CHAR(15),
    nbenf         SMALLINT,
    clifam        CHAR(15),

    -- Legal Capacity
    capj          CHAR(1),
    dcapj         DATE,
    sitj          CHAR(3),
    dsitj         DATE,

    -- Company Information (for tcli = 2 or 3)
    rso           CHAR(65),
    rso2          CHAR(65),
    sig           CHAR(20),
    datc          DATE,
    fju           CHAR(2),

    -- Legal Identifiers
    nrc           CHAR(20),
    vrc           DATE,
    drc           DATE,
    lrc           CHAR(30),
    nchc          CHAR(3),
    npa           CHAR(20),
    vpa           DATE,
    nidn          CHAR(20),
    nis           CHAR(20),
    nidf          CHAR(20),
    nicr          CHAR(20),
    clcr          CHAR(1),

    -- Classification
    grp           CHAR(6),
    sgrp          CHAR(6),
    met           CHAR(6),
    smet          CHAR(6),
    seg           CHAR(3),
    catl          CHAR(1),
    catn          CHAR(6),
    sec           CHAR(5),
    nst           CHAR(20),

    -- Auditors (for companies)
    cmc1          CHAR(36),
    cmc2          CHAR(36),

    -- Bank Relations
    age           CHAR(5),
    ges           CHAR(3),
    qua           CHAR(2),
    lienbq        CHAR(3),
    clipar        CHAR(15),

    -- Tax & Compliance
    tax           CHAR(1),
    lter          CHAR(1),
    resd          CHAR(3),
    aclas         CHAR(1),
    maclas        DECIMAL(19,4),
    emtit         CHAR(1),

    -- Risk Management
    rrc           CHAR(1),
    dvrrc         DATE,
    uti_vrrc      CHAR(10),

    -- Restrictions
    ichq          CHAR(1),
    dichq         DATE,
    icb           CHAR(1),
    dicb          DATE,

    -- Preferences
    lang          CHAR(3),
    ced           CHAR(1),

    -- Custom Fields
    chl1          CHAR(10),
    chl2          CHAR(10),
    chl3          CHAR(10),

    -- Audit Fields
    utic          CHAR(10),
    uti           CHAR(10),
    dou           DATE,
    dmo           DATE,
    ord           DECIMAL(4,0),
    epu           CHAR(1),
    catr          CHAR(1),

    PRIMARY KEY (cli)
);

CREATE INDEX idx_bkcli_nom ON bkcli(nom);
CREATE INDEX idx_bkcli_age ON bkcli(age);
CREATE INDEX idx_bkcli_tcli ON bkcli(tcli);
CREATE INDEX idx_bkcli_nidn ON bkcli(nidn);

-- ============================================================================
-- Table: bkcom - Comptes (Client/Accounting Accounts)
-- ============================================================================
CREATE TABLE bkcom (
    -- Primary Key (Composite)
    ncp           CHAR(11) NOT NULL,
    suf           CHAR(2) NOT NULL,
    age           CHAR(5) NOT NULL,
    dev           CHAR(3) NOT NULL,
    cha           CHAR(10) NOT NULL,

    -- Account Identity
    clc           CHAR(2),
    cli           CHAR(15),
    inti          CHAR(30),
    ser           CHAR(4),
    typ           CHAR(3),
    cpro          CHAR(3),
    cpack         CHAR(6),

    -- Account Configuration
    sbi           CHAR(1),
    crp           CHAR(1),
    arr           CHAR(1),
    ech           CHAR(1),
    ext           CHAR(1),
    extd          CHAR(10),
    tax           CHAR(1),
    cver          CHAR(1),
    prlib         DECIMAL(1,0),
    parrd         CHAR(1),
    parrc         CHAR(1),
    nanti         CHAR(1),
    ouvp          CHAR(1),
    cptcoj        CHAR(1),
    clir          CHAR(15),
    lib           CHAR(2),

    -- Balances
    sde           DECIMAL(19,4),
    sva           DECIMAL(19,4),
    shi           DECIMAL(19,4),
    sar           DECIMAL(19,4),
    sin           DECIMAL(19,4),
    dbt           DECIMAL(19,4),
    crt           DECIMAL(19,4),

    -- Unavailable Amounts
    mind          DECIMAL(19,4),
    minds         DECIMAL(19,4),
    minj          DECIMAL(19,4),
    minjs         DECIMAL(19,4),
    mtfdr         DECIMAL(19,4),
    mntl2         DECIMAL(19,4),

    -- Limits
    psbf          DECIMAL(12,0),
    seui          DECIMAL(4,0),
    aut1          DECIMAL(19,4),
    eca1          DATE,

    -- Dates
    dva           DATE,
    dhi           DATE,
    dar           DATE,
    ddm           DATE,
    ddc           DATE,
    ddd           DATE,
    dou           DATE,
    dmo           DATE,
    dech          DATE,
    ecd           DATE,
    dodb          DATE,
    dodb2         DATE,
    daut          DATE,
    daut2         DATE,
    datl1         DATE,
    datl2         DATE,
    datdev        DATE,

    -- Closure
    ife           CHAR(1),
    cfe           CHAR(1),
    dif           DATE,
    dfe           DATE,
    motclo        CHAR(3),

    -- Checkbook
    mdchq         CHAR(1),
    tychq         CHAR(2),
    agchq         CHAR(5),
    tadch         CHAR(1),
    codadch       CHAR(2),

    -- Lettrage
    cpl           CHAR(2),
    ddl           DATE,

    -- IBAN/RIB
    ribdec        CHAR(2),
    cleiban       CHAR(2),

    -- Agency Information
    agecre        CHAR(5),
    agerib        CHAR(5),
    derrage       CHAR(5),

    -- Fusion
    fus_age       CHAR(5),
    fus_dev       CHAR(3),
    fus_cha       CHAR(10),
    fus_ncp       CHAR(11),
    fus_suf       CHAR(2),
    derndev       CHAR(3),

    -- Contentious
    ctx           CHAR(1),

    -- Custom Fields
    zonl2         CHAR(10),
    zonl3         CHAR(10),

    -- Audit
    uti           CHAR(10),
    utic          CHAR(10),
    utiif         CHAR(10),
    utife         CHAR(10),
    ord           DECIMAL(4,0),
    catr          CHAR(1),

    PRIMARY KEY (ncp, suf, age, dev, cha)
);

CREATE INDEX idx_bkcom_cli ON bkcom(cli);
CREATE INDEX idx_bkcom_age ON bkcom(age);
CREATE INDEX idx_bkcom_typ ON bkcom(typ);
CREATE INDEX idx_bkcom_sde ON bkcom(sde);

-- ============================================================================
-- Table: bkadcli - Adresses Clients
-- ============================================================================
CREATE TABLE bkadcli (
    -- Primary Key
    cli           CHAR(15) NOT NULL,
    typ           CHAR(2) NOT NULL,

    -- Address Details
    lang          CHAR(3),
    fmt           CHAR(2),
    adr1          CHAR(30),
    adr2          CHAR(30),
    adr3          CHAR(30),
    ville         CHAR(30),
    dep           CHAR(30),
    reg           CHAR(50),
    cpos          CHAR(10),
    cpay          CHAR(3),

    -- Postal Information
    bdis          CHAR(30),
    bpos          CHAR(10),
    spos          CHAR(10),
    lspos         CHAR(30),

    -- Bank Reference
    gui           CHAR(5),
    cas           CHAR(9),
    ser           CHAR(4),
    trs           CHAR(3),

    -- Contact
    email         CHAR(50),

    -- Temporary Address
    dprvd         DATE,
    dprvf         DATE,

    -- Mail Returns
    nrce          SMALLINT,
    drce          DATE,

    -- Transfer Flag
    atrf          CHAR(1),

    PRIMARY KEY (cli, typ)
);

CREATE INDEX idx_bkadcli_ville ON bkadcli(ville);
CREATE INDEX idx_bkadcli_cpay ON bkadcli(cpay);

-- ============================================================================
-- Table: bkprfcli - Profils Clients (Emplois/Revenus)
-- ============================================================================
CREATE TABLE bkprfcli (
    -- Primary Key
    cli           CHAR(15) NOT NULL,

    -- Professional Information
    prf           CHAR(3),
    emp           CHAR(15),
    demb          DATE,
    trev          CHAR(2),
    demp          CHAR(30),

    -- Transfer Flag
    atrf          CHAR(1),

    PRIMARY KEY (cli)
);

-- ============================================================================
-- Table: bkcntcli - Contacts Clients
-- ============================================================================
CREATE TABLE bkcntcli (
    -- Primary Key
    cli           CHAR(15) NOT NULL,

    -- Contact Information
    nom           CHAR(36),
    pre           CHAR(30),
    tel           CHAR(20),
    email         CHAR(50),

    -- Transfer Flag
    atrf          CHAR(1),

    PRIMARY KEY (cli)
);

CREATE INDEX idx_bkcntcli_tel ON bkcntcli(tel);

-- ============================================================================
-- Table: bkemacli - Emails Clients
-- ============================================================================
CREATE TABLE bkemacli (
    -- Primary Key
    cli           CHAR(15) NOT NULL,
    typ           CHAR(3) NOT NULL,

    -- Email
    email         CHAR(50),

    -- Transfer Flag
    atrf          CHAR(1),

    PRIMARY KEY (cli, typ)
);

CREATE INDEX idx_bkemacli_email ON bkemacli(email);

-- ============================================================================
-- End of DDL Script
-- ============================================================================
-- NOTE: Run amplitude_fk_informix.sql AFTER loading seed data to add FKs
-- ============================================================================
