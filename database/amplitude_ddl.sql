-- ============================================================================
-- AMPLITUDE CBS - Complete DDL Script
-- BSIC Bank - Core Banking System Database Schema
-- Generated for MySQL/MariaDB
-- ============================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- Drop tables if exist (in reverse dependency order)
DROP TABLE IF EXISTS bkemacli;
DROP TABLE IF EXISTS bkcntcli;
DROP TABLE IF EXISTS bkprfcli;
DROP TABLE IF EXISTS bkadcli;
DROP TABLE IF EXISTS bkcom;
DROP TABLE IF EXISTS bkcli;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- Table: bkcli - Clients (Main client table)
-- ============================================================================
CREATE TABLE bkcli (
    -- Primary Key
    cli           CHAR(15)       NOT NULL COMMENT 'Code client (PK)',

    -- Identity Information
    nom           CHAR(36)       NULL COMMENT 'Nom du client',
    tcli          CHAR(1)        NULL COMMENT 'Type client (1=Particulier, 2=Societe, 3=Entreprise individuelle)',
    lib           CHAR(2)        NULL COMMENT 'Code intitule (M., Mme, Mlle)',
    pre           CHAR(30)       NULL COMMENT 'Prenom',
    sext          CHAR(1)        NULL COMMENT 'Sexe (M/F)',
    dna           DATE           NULL COMMENT 'Date de naissance',
    viln          CHAR(30)       NULL COMMENT 'Ville de naissance',
    payn          CHAR(3)        NULL COMMENT 'Pays de naissance (ISO)',
    nat           CHAR(3)        NULL COMMENT 'Nationalite (ISO)',
    res           CHAR(3)        NULL COMMENT 'Pays de residence (ISO)',
    midname       CHAR(30)       NULL COMMENT 'Deuxieme prenom',
    nomrest       CHAR(67)       NULL COMMENT 'Nom a restituer',
    nmer          CHAR(36)       NULL COMMENT 'Nom de la mere',
    regn          CHAR(50)       NULL COMMENT 'Region de naissance',

    -- Family Status
    sit           CHAR(1)        NULL COMMENT 'Situation familiale (C=Celibataire, M=Marie, D=Divorce, V=Veuf)',
    reg           CHAR(1)        NULL COMMENT 'Regime matrimonial',
    tconj         CHAR(1)        NULL COMMENT 'Type de conjoint',
    conj          CHAR(15)       NULL COMMENT 'Code conjoint (FK bkcli)',
    nbenf         SMALLINT       NULL COMMENT 'Nombre enfants',
    clifam        CHAR(15)       NULL COMMENT 'Client rattachement familial',

    -- Legal Capacity
    capj          CHAR(1)        NULL COMMENT 'Capacite juridique',
    dcapj         DATE           NULL COMMENT 'Date application capacite juridique',
    sitj          CHAR(3)        NULL COMMENT 'Situation juridique',
    dsitj         DATE           NULL COMMENT 'Date application situation juridique',

    -- Company Information (for tcli = 2 or 3)
    rso           CHAR(65)       NULL COMMENT 'Raison sociale',
    rso2          CHAR(65)       NULL COMMENT 'Deuxieme raison sociale',
    sig           CHAR(20)       NULL COMMENT 'Sigle',
    datc          DATE           NULL COMMENT 'Date creation entreprise',
    fju           CHAR(2)        NULL COMMENT 'Forme juridique (SA, SARL, SAS, etc.)',

    -- Legal Identifiers
    nrc           CHAR(20)       NULL COMMENT 'Numero registre de commerce',
    vrc           DATE           NULL COMMENT 'Date validite RCS',
    drc           DATE           NULL COMMENT 'Date delivrance RCS',
    lrc           CHAR(30)       NULL COMMENT 'Lieu delivrance RCS',
    nchc          CHAR(3)        NULL COMMENT 'Chambre de commerce',
    npa           CHAR(20)       NULL COMMENT 'Numero patente',
    vpa           DATE           NULL COMMENT 'Date validite patente',
    nidn          CHAR(20)       NULL COMMENT 'Numero identite nationale (CNI)',
    nis           CHAR(20)       NULL COMMENT 'Numero identite sociale (CNPS)',
    nidf          CHAR(20)       NULL COMMENT 'Numero identite fiscale (NIF)',
    nicr          CHAR(20)       NULL COMMENT 'Numero Centrale des Risques',
    clcr          CHAR(1)        NULL COMMENT 'Cle Centrale des Risques',

    -- Classification
    grp           CHAR(6)        NULL COMMENT 'Code groupe',
    sgrp          CHAR(6)        NULL COMMENT 'Sous-groupe',
    met           CHAR(6)        NULL COMMENT 'Metier',
    smet          CHAR(6)        NULL COMMENT 'Sous-metier',
    seg           CHAR(3)        NULL COMMENT 'Segment',
    catl          CHAR(1)        NULL COMMENT 'Categorie interne',
    catn          CHAR(6)        NULL COMMENT 'Categorie Banque Centrale',
    sec           CHAR(5)        NULL COMMENT 'Secteur activite',
    nst           CHAR(20)       NULL COMMENT 'Numero statistique',

    -- Auditors (for companies)
    cmc1          CHAR(36)       NULL COMMENT 'Commissaire aux comptes 1',
    cmc2          CHAR(36)       NULL COMMENT 'Commissaire aux comptes 2',

    -- Bank Relations
    age           CHAR(5)        NULL COMMENT 'Code agence',
    ges           CHAR(3)        NULL COMMENT 'Code gestionnaire',
    qua           CHAR(2)        NULL COMMENT 'Code qualite',
    lienbq        CHAR(3)        NULL COMMENT 'Lien avec la banque',
    clipar        CHAR(15)       NULL COMMENT 'Client parrain',

    -- Tax & Compliance
    tax           CHAR(1)        NULL COMMENT 'Client taxable (O/N)',
    lter          CHAR(1)        NULL COMMENT 'Code territorialite',
    resd          CHAR(3)        NULL COMMENT 'Residence de declaration',
    aclas         CHAR(1)        NULL COMMENT 'Accord de classement',
    maclas        DECIMAL(19,4)  NULL COMMENT 'Montant accord classement',
    emtit         CHAR(1)        NULL COMMENT 'Emetteur de titres',

    -- Risk Management
    rrc           CHAR(1)        NULL COMMENT 'Risque relation client',
    dvrrc         DATE           NULL COMMENT 'Date validation risque',
    uti_vrrc      CHAR(10)       NULL COMMENT 'Utilisateur validation risque',

    -- Restrictions
    ichq          CHAR(1)        NULL COMMENT 'Interdiction chequier (O/N)',
    dichq         DATE           NULL COMMENT 'Date interdiction chequier',
    icb           CHAR(1)        NULL COMMENT 'Interdiction carte bancaire (O/N)',
    dicb          DATE           NULL COMMENT 'Date interdiction carte',

    -- Preferences
    lang          CHAR(3)        NULL COMMENT 'Code langue',
    ced           CHAR(1)        NULL COMMENT 'Code edition',

    -- Custom Fields
    chl1          CHAR(10)       NULL COMMENT 'Champ libre 1',
    chl2          CHAR(10)       NULL COMMENT 'Champ libre 2',
    chl3          CHAR(10)       NULL COMMENT 'Champ libre 3',

    -- Audit Fields
    utic          CHAR(10)       NULL COMMENT 'Utilisateur creation',
    uti           CHAR(10)       NULL COMMENT 'Utilisateur modification',
    dou           DATE           NULL COMMENT 'Date creation',
    dmo           DATE           NULL COMMENT 'Date modification',
    ord           DECIMAL(4,0)   NULL COMMENT 'Numero fiche modif',
    epu           CHAR(1)        NULL COMMENT 'Code epuration',
    catr          CHAR(1)        NULL COMMENT 'Code transfert temps reel',

    PRIMARY KEY (cli),
    INDEX idx_bkcli_nom (nom),
    INDEX idx_bkcli_age (age),
    INDEX idx_bkcli_tcli (tcli),
    INDEX idx_bkcli_nidn (nidn)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Table principale des clients BSIC';

-- ============================================================================
-- Table: bkcom - Comptes (Client/Accounting Accounts)
-- ============================================================================
CREATE TABLE bkcom (
    -- Primary Key (Composite)
    ncp           CHAR(11)       NOT NULL COMMENT 'Numero de compte (PK)',
    suf           CHAR(2)        NOT NULL COMMENT 'Suffixe (PK)',
    age           CHAR(5)        NOT NULL COMMENT 'Code agence (PK)',
    dev           CHAR(3)        NOT NULL COMMENT 'Devise (PK)',
    cha           CHAR(10)       NOT NULL COMMENT 'Chapitre comptable (PK)',

    -- Account Identity
    clc           CHAR(2)        NULL COMMENT 'Cle de controle RIB',
    cli           CHAR(15)       NULL COMMENT 'Code client (FK)',
    inti          CHAR(30)       NULL COMMENT 'Intitule du compte',
    ser           CHAR(4)        NULL COMMENT 'Code service',
    typ           CHAR(3)        NULL COMMENT 'Type de compte',
    cpro          CHAR(3)        NULL COMMENT 'Code produit',
    cpack         CHAR(6)        NULL COMMENT 'Code package',

    -- Account Configuration
    sbi           CHAR(1)        NULL COMMENT 'Sens (D=Debiteur, C=Crediteur, I=Indifferent)',
    crp           CHAR(1)        NULL COMMENT 'Emargement',
    arr           CHAR(1)        NULL COMMENT 'Soumis a arrete',
    ech           CHAR(1)        NULL COMMENT 'Echelle arrete',
    ext           CHAR(1)        NULL COMMENT 'Extrait de compte',
    extd          CHAR(10)       NULL COMMENT 'Mode delivrance extrait',
    tax           CHAR(1)        NULL COMMENT 'Taxable',
    cver          CHAR(1)        NULL COMMENT 'A ne pas apurer',
    prlib         DECIMAL(1,0)   NULL COMMENT 'Prelevement liberatoire',
    parrd         CHAR(1)        NULL COMMENT 'Periodicite arrete debit',
    parrc         CHAR(1)        NULL COMMENT 'Periodicite arrete credit',
    nanti         CHAR(1)        NULL COMMENT 'Nantissement',
    ouvp          CHAR(1)        NULL COMMENT 'Ouverture provisoire',
    cptcoj        CHAR(1)        NULL COMMENT 'Compte joint',
    clir          CHAR(15)       NULL COMMENT 'Client responsable',
    lib           CHAR(2)        NULL COMMENT 'Libelle compte joint',

    -- Balances
    sde           DECIMAL(19,4)  NULL COMMENT 'Solde comptable',
    sva           DECIMAL(19,4)  NULL COMMENT 'Solde valeur',
    shi           DECIMAL(19,4)  NULL COMMENT 'Solde historique',
    sar           DECIMAL(19,4)  NULL COMMENT 'Solde arrete',
    sin           DECIMAL(19,4)  NULL COMMENT 'Solde indicatif',
    dbt           DECIMAL(19,4)  NULL COMMENT 'Capitaux debiteurs',
    crt           DECIMAL(19,4)  NULL COMMENT 'Capitaux crediteurs',

    -- Unavailable Amounts
    mind          DECIMAL(19,4)  NULL COMMENT 'Indisponible hors SBF',
    minds         DECIMAL(19,4)  NULL COMMENT 'Indisponible SBF',
    minj          DECIMAL(19,4)  NULL COMMENT 'Indisponible journalier hors SBF',
    minjs         DECIMAL(19,4)  NULL COMMENT 'Indisponible journalier SBF',
    mtfdr         DECIMAL(19,4)  NULL COMMENT 'Montant fonds reserves',
    mntl2         DECIMAL(19,4)  NULL COMMENT 'Montant libre 2',

    -- Limits
    psbf          DECIMAL(12,0)  NULL COMMENT 'Plafond SBF',
    seui          DECIMAL(4,0)   NULL COMMENT 'Seuil reappro cheques',
    aut1          DECIMAL(19,4)  NULL COMMENT 'Autorisation 1 (decouvert)',
    eca1          DATE           NULL COMMENT 'Date echeance autorisation 1',

    -- Dates
    dva           DATE           NULL COMMENT 'Date valeur',
    dhi           DATE           NULL COMMENT 'Date historique',
    dar           DATE           NULL COMMENT 'Date arrete',
    ddm           DATE           NULL COMMENT 'Dernier mouvement',
    ddc           DATE           NULL COMMENT 'Dernier credit',
    ddd           DATE           NULL COMMENT 'Dernier debit',
    dou           DATE           NULL COMMENT 'Date ouverture',
    dmo           DATE           NULL COMMENT 'Date modif',
    dech          DATE           NULL COMMENT 'Date echeance',
    ecd           DATE           NULL COMMENT 'Debut echeance ponctuelle',
    dodb          DATE           NULL COMMENT 'Date origine debit',
    dodb2         DATE           NULL COMMENT 'Date origine debit 2',
    daut          DATE           NULL COMMENT 'Date origine depassement',
    daut2         DATE           NULL COMMENT 'Date derniere autorisation',
    datl1         DATE           NULL COMMENT 'Date libre 1',
    datl2         DATE           NULL COMMENT 'Date libre 2',
    datdev        DATE           NULL COMMENT 'Date changement devise',

    -- Closure
    ife           CHAR(1)        NULL COMMENT 'Instance fermeture',
    cfe           CHAR(1)        NULL COMMENT 'Compte ferme',
    dif           DATE           NULL COMMENT 'Date instance fermeture',
    dfe           DATE           NULL COMMENT 'Date fermeture',
    motclo        CHAR(3)        NULL COMMENT 'Motif cloture',

    -- Checkbook
    mdchq         CHAR(1)        NULL COMMENT 'Mode delivrance cheques',
    tychq         CHAR(2)        NULL COMMENT 'Type chequier',
    agchq         CHAR(5)        NULL COMMENT 'Agence delivrance cheques',
    tadch         CHAR(1)        NULL COMMENT 'Type adresse cheque',
    codadch       CHAR(2)        NULL COMMENT 'Code adresse cheque',

    -- Lettrage
    cpl           CHAR(2)        NULL COMMENT 'Dernier couple lettrage',
    ddl           DATE           NULL COMMENT 'Date dernier lettrage',

    -- IBAN/RIB
    ribdec        CHAR(2)        NULL COMMENT 'Cle RIB declaration',
    cleiban       CHAR(2)        NULL COMMENT 'Cle IBAN',

    -- Agency Information
    agecre        CHAR(5)        NULL COMMENT 'Agence creation',
    agerib        CHAR(5)        NULL COMMENT 'Agence RIB',
    derrage       CHAR(5)        NULL COMMENT 'Derniere agence',

    -- Fusion
    fus_age       CHAR(5)        NULL COMMENT 'Agence fusion',
    fus_dev       CHAR(3)        NULL COMMENT 'Devise fusion',
    fus_cha       CHAR(10)       NULL COMMENT 'Chapitre fusion',
    fus_ncp       CHAR(11)       NULL COMMENT 'Compte fusion',
    fus_suf       CHAR(2)        NULL COMMENT 'Suffixe fusion',
    derndev       CHAR(3)        NULL COMMENT 'Derniere devise',

    -- Contentious
    ctx           CHAR(1)        NULL COMMENT 'Code passage contentieux',

    -- Custom Fields
    zonl2         CHAR(10)       NULL COMMENT 'Zone libre 2',
    zonl3         CHAR(10)       NULL COMMENT 'Zone libre 3',

    -- Audit
    uti           CHAR(10)       NULL COMMENT 'Utilisateur initiateur',
    utic          CHAR(10)       NULL COMMENT 'Utilisateur creation',
    utiif         CHAR(10)       NULL COMMENT 'Utilisateur instance fermeture',
    utife         CHAR(10)       NULL COMMENT 'Utilisateur fermeture',
    ord           DECIMAL(4,0)   NULL COMMENT 'Numero fiche',
    catr          CHAR(1)        NULL COMMENT 'Transfert temps reel',

    PRIMARY KEY (ncp, suf, age, dev, cha),
    INDEX idx_bkcom_cli (cli),
    INDEX idx_bkcom_age (age),
    INDEX idx_bkcom_typ (typ),
    INDEX idx_bkcom_sde (sde),
    CONSTRAINT fk_bkcom_cli FOREIGN KEY (cli) REFERENCES bkcli(cli)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Table des comptes clients et comptables';

-- ============================================================================
-- Table: bkadcli - Adresses Clients
-- ============================================================================
CREATE TABLE bkadcli (
    -- Primary Key
    cli           CHAR(15)       NOT NULL COMMENT 'Code client (PK, FK)',
    typ           CHAR(2)        NOT NULL COMMENT 'Type adresse (PK): 01=Domicile, 02=Travail, 03=Courrier',

    -- Address Details
    lang          CHAR(3)        NULL COMMENT 'Langue restitution',
    fmt           CHAR(2)        NULL COMMENT 'Format adresse',
    adr1          CHAR(30)       NULL COMMENT 'Adresse ligne 1',
    adr2          CHAR(30)       NULL COMMENT 'Adresse ligne 2',
    adr3          CHAR(30)       NULL COMMENT 'Adresse ligne 3',
    ville         CHAR(30)       NULL COMMENT 'Ville',
    dep           CHAR(30)       NULL COMMENT 'Departement',
    reg           CHAR(50)       NULL COMMENT 'Region',
    cpos          CHAR(10)       NULL COMMENT 'Code postal',
    cpay          CHAR(3)        NULL COMMENT 'Code pays (ISO)',

    -- Postal Information
    bdis          CHAR(30)       NULL COMMENT 'Bureau distributeur',
    bpos          CHAR(10)       NULL COMMENT 'Boite postale',
    spos          CHAR(10)       NULL COMMENT 'Secteur postal',
    lspos         CHAR(30)       NULL COMMENT 'Libelle secteur postal',

    -- Bank Reference
    gui           CHAR(5)        NULL COMMENT 'Code guichet',
    cas           CHAR(9)        NULL COMMENT 'Casier',
    ser           CHAR(4)        NULL COMMENT 'Code service',
    trs           CHAR(3)        NULL COMMENT 'Type transport',

    -- Contact
    email         CHAR(50)       NULL COMMENT 'Email',

    -- Temporary Address
    dprvd         DATE           NULL COMMENT 'Debut adresse provisoire',
    dprvf         DATE           NULL COMMENT 'Fin adresse provisoire',

    -- Mail Returns
    nrce          SMALLINT       NULL COMMENT 'Nombre retours courrier',
    drce          DATE           NULL COMMENT 'Date premier retour',

    -- Transfer Flag
    atrf          CHAR(1)        NULL COMMENT 'A transferer',

    PRIMARY KEY (cli, typ),
    INDEX idx_bkadcli_ville (ville),
    INDEX idx_bkadcli_cpay (cpay),
    CONSTRAINT fk_bkadcli_cli FOREIGN KEY (cli) REFERENCES bkcli(cli)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Table des adresses clients';

-- ============================================================================
-- Table: bkprfcli - Profils Clients (Emplois/Revenus)
-- ============================================================================
CREATE TABLE bkprfcli (
    -- Primary Key
    cli           CHAR(15)       NOT NULL COMMENT 'Code client (PK, FK)',

    -- Professional Information
    prf           CHAR(3)        NULL COMMENT 'Code profession',
    emp           CHAR(15)       NULL COMMENT 'Code employeur',
    demb          DATE           NULL COMMENT 'Date embauche',
    trev          CHAR(2)        NULL COMMENT 'Tranche de revenus',
    demp          CHAR(30)       NULL COMMENT 'Departement employeur',

    -- Transfer Flag
    atrf          CHAR(1)        NULL COMMENT 'A transferer',

    PRIMARY KEY (cli),
    CONSTRAINT fk_bkprfcli_cli FOREIGN KEY (cli) REFERENCES bkcli(cli)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Table des profils professionnels clients';

-- ============================================================================
-- Table: bkcntcli - Contacts Clients
-- ============================================================================
CREATE TABLE bkcntcli (
    -- Primary Key
    cli           CHAR(15)       NOT NULL COMMENT 'Code client (PK, FK)',

    -- Contact Information
    nom           CHAR(36)       NULL COMMENT 'Nom du contact',
    pre           CHAR(30)       NULL COMMENT 'Prenom du contact',
    tel           CHAR(20)       NULL COMMENT 'Telephone',
    email         CHAR(50)       NULL COMMENT 'Email',

    -- Transfer Flag
    atrf          CHAR(1)        NULL COMMENT 'A transferer',

    PRIMARY KEY (cli),
    INDEX idx_bkcntcli_tel (tel),
    CONSTRAINT fk_bkcntcli_cli FOREIGN KEY (cli) REFERENCES bkcli(cli)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Table des contacts clients';

-- ============================================================================
-- Table: bkemacli - Emails Clients
-- ============================================================================
CREATE TABLE bkemacli (
    -- Primary Key
    cli           CHAR(15)       NOT NULL COMMENT 'Code client (PK, FK)',
    typ           CHAR(3)        NOT NULL COMMENT 'Type email (PK): PER=Personnel, PRO=Professionnel',

    -- Email
    email         CHAR(50)       NULL COMMENT 'Adresse email',

    -- Transfer Flag
    atrf          CHAR(1)        NULL COMMENT 'A transferer',

    PRIMARY KEY (cli, typ),
    INDEX idx_bkemacli_email (email),
    CONSTRAINT fk_bkemacli_cli FOREIGN KEY (cli) REFERENCES bkcli(cli)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Table des emails clients';

-- ============================================================================
-- End of DDL Script
-- ============================================================================
