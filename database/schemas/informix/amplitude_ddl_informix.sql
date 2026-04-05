-- ============================================================================
-- AMPLITUDE CBS - Complete DDL Script for INFORMIX
-- Sample Bank - Core Banking System Database Schema
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
CREATE TABLE bkcli
(
    cli      CHAR(15) NOT NULL, -- Code du client
    nom      CHAR(36),          -- Nom du client
    tcli     CHAR(1),           -- Type de client (1=Particulier, 2=Société, 3=EI)
    lib      CHAR(2),           -- Code intitulé (Monsieur, Madame …)  → t036
    pre      CHAR(30),          -- Prénom du client
    sext     CHAR(1),           -- Sexe du titulaire (M/F)
    njf      CHAR(36),          -- Nom de jeune fille / conjoint
    dna      DATE,              -- Date de naissance
    viln     CHAR(30),          -- Ville de naissance
    depn     CHAR(30),          -- Département de naissance
    payn     CHAR(3),           -- Pays de naissance                → t040
    locn     CHAR(6),           -- Code localité de naissance
    tid      CHAR(5),           -- Type de pièce d’identité
    nid      CHAR(20),          -- N° pièce d’identité
    did      DATE,              -- Date délivrance pièce
    lid      CHAR(30),          -- Lieu délivrance pièce
    oid      CHAR(30),          -- Organisme délivrateur
    vid      DATE,              -- Date validité pièce
    sit      CHAR(1),           -- Code situation familiale         → t047
    reg      CHAR(1),           -- Code régime matrimonial          → t048
    capj     CHAR(1),           -- Capacité juridique               → t172
    dcapj    DATE,              -- Date application capacité
    sitj     CHAR(3),           -- Situation juridique              → t185
    dsitj    DATE,              -- Date application situation jur.
    tconj    CHAR(1),           -- Type de conjoint
    conj     CHAR(15),          -- Code conjoint
    nbenf    SMALLINT,          -- Nombre d’enfants
    clifam   CHAR(15),          -- Client rattachement familial
    rso      CHAR(65),          -- Raison sociale déclaration
    sig      CHAR(20),          -- Sigle
    datc     DATE,              -- Date création entreprise
    fju      CHAR(2),           -- Forme juridique                  → t049
    nrc      CHAR(20),          -- N° registre commerce
    vrc      DATE,              -- Date validité R.C.
    nchc     CHAR(3),           -- Chambre de commerce              → t077
    npa      CHAR(20),          -- N° patente
    vpa      DATE,              -- Date validité patente
    nidn     CHAR(20),          -- N° identité nationale
    nis      CHAR(20),          -- N° identité sociale
    nidf     CHAR(20),          -- N° identité fiscale
    grp      CHAR(6),           -- Code groupe
    sgrp     CHAR(6),           -- Sous-groupe
    met      CHAR(6),           -- Métier
    smet     CHAR(6),           -- Sous-métier
    cmc1     CHAR(36),          -- Code commissaire aux comptes 1
    cmc2     CHAR(36),          -- Code commissaire aux comptes 2
    age      CHAR(5),           -- Code agence                      → t001
    ges      CHAR(3),           -- Code gestionnaire                → t035
    qua      CHAR(2),           -- Code qualité                     → t043
    tax      CHAR(1),           -- Client taxable (O/N)
    catl     CHAR(1),           -- Catégorie interne                → t041
    seg      CHAR(3),           -- Segment
    nst      CHAR(20),          -- N° statistique
    clipar   CHAR(15),          -- Client parrainage
    chl1     CHAR(10),          -- Champ libre 1                    → t063
    chl2     CHAR(10),          -- Champ libre 2                    → t064
    chl3     CHAR(10),          -- Champ libre 3                    → t065
    lter     CHAR(1),           -- Code territorialité (FICOBA)
    lterc    CHAR(1),           -- Code territorialité conjoint
    resd     CHAR(3),           -- Résidence déclaration
    catn     CHAR(6),           -- Catégorie Banque Centrale        → t042
    sec      CHAR(5),           -- Secteur d’activité               → t071
    lienbq   CHAR(3),           -- Lien apparenté avec la banque
    aclas    CHAR(1),           -- Accord de classement
    maclas   DECIMAL(19, 4),    -- Montant accord de classement
    emtit    CHAR(1),           -- Emetteur de titres
    nicr     CHAR(20),          -- N° immatriculation Centrale Risques
    ced      CHAR(1),           -- Code édition
    clcr     CHAR(1),           -- Clé Centrale des Risques
    nmer     CHAR(36),          -- Nom de la mère
    lang     CHAR(3),           -- Code langue
    nat      CHAR(3),           -- Nationalité                       → t033
    res      CHAR(3),           -- Pays de résidence                 → t040
    ichq     CHAR(1),           -- Interdiction chéquier (O/N)
    dichq    DATE,              -- Date remise en interdiction chèque
    icb      CHAR(1),           -- Interdiction carte bancaire
    dicb     DATE,              -- Date interdiction carte
    epu      CHAR(1),           -- Code épuration (O/N)
    utic     CHAR(10),          -- Utilisateur création              → evuti
    uti      CHAR(10),          -- Utilisateur initiation            → evuti
    dou      DATE,              -- Date création
    dmo      DATE,              -- Date dernière modification
    ord      DECIMAL(4, 0),     -- N° fiche modification
    catr     CHAR(1),           -- Code transfert temps réel
    midname  CHAR(30),          -- Deuxième prénom
    nomrest  CHAR(67),          -- Nom à restituer
    drc      DATE,              -- Date délivrance R.C.
    lrc      CHAR(30),          -- Lieu délivrance R.C.
    rso2     CHAR(65),          -- Seconde raison sociale
    regn     CHAR(50),          -- Région de naissance
    rrc      CHAR(1),           -- Risque relation client
    dvrrc    DATE,              -- Date validation risque relation
    uti_vrrc CHAR(10),          -- Utilisateur validation risque
    PRIMARY KEY (cli)
);



CREATE INDEX idx_bkcli_nom ON bkcli (nom);
CREATE INDEX idx_bkcli_age ON bkcli (age);
CREATE INDEX idx_bkcli_tcli ON bkcli (tcli);
CREATE INDEX idx_bkcli_nidn ON bkcli (nidn);

-- ============================================================================
-- Table: bkcom - Comptes (Client/Accounting Accounts)
-- ============================================================================
CREATE TABLE bkcom
(
    -- Primary Key (Composite)
    ncp     CHAR(11) NOT NULL,
    suf     CHAR(2)  NOT NULL,
    age     CHAR(5)  NOT NULL,
    dev     CHAR(3)  NOT NULL,
    cha     CHAR(10) NOT NULL,

    -- Account Identity
    clc     CHAR(2),
    cli     CHAR(15),
    inti    CHAR(30),
    ser     CHAR(4),
    typ     CHAR(3),
    cpro    CHAR(3),
    cpack   CHAR(6),

    -- Account Configuration
    sbi     CHAR(1),
    crp     CHAR(1),
    arr     CHAR(1),
    ech     CHAR(1),
    ext     CHAR(1),
    extd    CHAR(10),
    tax     CHAR(1),
    cver    CHAR(1),
    prlib   DECIMAL(1, 0),
    parrd   CHAR(1),
    parrc   CHAR(1),
    nanti   CHAR(1),
    ouvp    CHAR(1),
    cptcoj  CHAR(1),
    clir    CHAR(15),
    lib     CHAR(2),

    -- Balances
    sde     DECIMAL(19, 4),
    sva     DECIMAL(19, 4),
    shi     DECIMAL(19, 4),
    sar     DECIMAL(19, 4),
    sin     DECIMAL(19, 4),
    dbt     DECIMAL(19, 4),
    crt     DECIMAL(19, 4),

    -- Unavailable Amounts
    mind    DECIMAL(19, 4),
    minds   DECIMAL(19, 4),
    minj    DECIMAL(19, 4),
    minjs   DECIMAL(19, 4),
    mtfdr   DECIMAL(19, 4),
    mntl2   DECIMAL(19, 4),

    -- Limits
    psbf    DECIMAL(12, 0),
    seui    DECIMAL(4, 0),
    aut1    DECIMAL(19, 4),
    eca1    DATE,

    -- Dates
    dva     DATE,
    dhi     DATE,
    dar     DATE,
    ddm     DATE,
    ddc     DATE,
    ddd     DATE,
    dou     DATE,
    dmo     DATE,
    dech    DATE,
    ecd     DATE,
    dodb    DATE,
    dodb2   DATE,
    daut    DATE,
    daut2   DATE,
    datl1   DATE,
    datl2   DATE,
    datdev  DATE,

    -- Closure
    ife     CHAR(1),
    cfe     CHAR(1),
    dif     DATE,
    dfe     DATE,
    motclo  CHAR(3),

    -- Checkbook
    mdchq   CHAR(1),
    tychq   CHAR(2),
    agchq   CHAR(5),
    tadch   CHAR(1),
    codadch CHAR(2),

    -- Lettrage
    cpl     CHAR(2),
    ddl     DATE,

    -- IBAN/RIB
    ribdec  CHAR(2),
    cleiban CHAR(2),

    -- Agency Information
    agecre  CHAR(5),
    agerib  CHAR(5),
    derrage CHAR(5),

    -- Fusion
    fus_age CHAR(5),
    fus_dev CHAR(3),
    fus_cha CHAR(10),
    fus_ncp CHAR(11),
    fus_suf CHAR(2),
    derndev CHAR(3),

    -- Contentious
    ctx     CHAR(1),

    -- Custom Fields
    zonl2   CHAR(10),
    zonl3   CHAR(10),

    -- Audit
    uti     CHAR(10),
    utic    CHAR(10),
    utiif   CHAR(10),
    utife   CHAR(10),
    ord     DECIMAL(4, 0),
    catr    CHAR(1),

    PRIMARY KEY (ncp, suf, age, dev, cha)
);

CREATE INDEX idx_bkcom_cli ON bkcom (cli);
CREATE INDEX idx_bkcom_age ON bkcom (age);
CREATE INDEX idx_bkcom_typ ON bkcom (typ);
CREATE INDEX idx_bkcom_sde ON bkcom (sde);

-- ============================================================================
-- Table: bkadcli - Adresses Clients
-- ============================================================================
CREATE TABLE bkadcli
(
    -- Primary Key
    cli   CHAR(15) NOT NULL,
    typ   CHAR(2)  NOT NULL,

    -- Address Details
    lang  CHAR(3),
    fmt   CHAR(2),
    adr1  CHAR(30),
    adr2  CHAR(30),
    adr3  CHAR(30),
    ville CHAR(30),
    dep   CHAR(30),
    reg   CHAR(50),
    cpos  CHAR(10),
    cpay  CHAR(3),

    -- Postal Information
    bdis  CHAR(30),
    bpos  CHAR(10),
    spos  CHAR(10),
    lspos CHAR(30),

    -- Bank Reference
    gui   CHAR(5),
    cas   CHAR(9),
    ser   CHAR(4),
    trs   CHAR(3),

    -- Contact
    email CHAR(50),

    -- Temporary Address
    dprvd DATE,
    dprvf DATE,

    -- Mail Returns
    nrce  SMALLINT,
    drce  DATE,

    -- Transfer Flag
    atrf  CHAR(1),

    PRIMARY KEY (cli, typ)
);

CREATE INDEX idx_bkadcli_ville ON bkadcli (ville);
CREATE INDEX idx_bkadcli_cpay ON bkadcli (cpay);

-- ============================================================================
-- Table: bkprfcli - Profils Clients (Emplois/Revenus)
-- ============================================================================
CREATE TABLE bkprfcli
(
    -- Primary Key
    cli  CHAR(15) NOT NULL,

    -- Professional Information
    prf  CHAR(3),
    emp  CHAR(15),
    demb DATE,
    trev CHAR(2),
    demp CHAR(30),

    -- Transfer Flag
    atrf CHAR(1),

    PRIMARY KEY (cli)
);

-- ============================================================================
-- Table: bkcntcli - Contacts Clients
-- ============================================================================
CREATE TABLE bkcntcli
(
    -- Primary Key
    cli   CHAR(15) NOT NULL,

    -- Contact Information
    nom   CHAR(36),
    pre   CHAR(30),
    tel   CHAR(20),
    email CHAR(50),

    -- Transfer Flag
    atrf  CHAR(1),

    PRIMARY KEY (cli)
);

CREATE INDEX idx_bkcntcli_tel ON bkcntcli (tel);

-- ============================================================================
-- Table: bkemacli - Emails Clients
-- ============================================================================
CREATE TABLE bkemacli
(
    -- Primary Key
    cli   CHAR(15) NOT NULL,
    typ   CHAR(3)  NOT NULL,

    -- Email
    email CHAR(50),

    -- Transfer Flag
    atrf  CHAR(1),

    PRIMARY KEY (cli, typ)
);

CREATE INDEX idx_bkemacli_email ON bkemacli (email);

CREATE TABLE bkage
(
    age CHAR(5) NOT NULL, -- Code agence
    lib VARCHAR(30),      -- Libellé de l'agence
    PRIMARY KEY (age) CONSTRAINT pk_bkage
);



-- ============================================================================
-- End of DDL Script
-- ============================================================================
-- NOTE: Run amplitude_fk_informix.sql AFTER loading seed data to add FKs
-- ============================================================================
