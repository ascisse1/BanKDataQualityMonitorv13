// Données de démonstration pour l'application
// Ces données sont utilisées lorsque la connexion à Supabase n'est pas disponible

// Create a demo data provider for the presentation
export const createDemoDataProvider = () => {
  console.log('🎭 Using demo data provider with sample data');

  return {
    getDemoData: () => demoData,
    getClientStats: () => demoData.clientStats,
    getValidationMetrics: () => demoData.validationMetrics,
    getIndividualAnomalies: (page = 1, limit = 10) => {
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      return {
        data: demoData.individualAnomalies.slice(startIndex, endIndex),
        total: demoData.individualAnomalies.length,
        page,
        limit
      };
    },
    getCorporateAnomalies: (page = 1, limit = 10) => {
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      return {
        data: demoData.corporateAnomalies.slice(startIndex, endIndex),
        total: demoData.corporateAnomalies.length,
        page,
        limit
      };
    },
    getInstitutionalAnomalies: (page = 1, limit = 10) => {
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      return {
        data: demoData.institutionalAnomalies.slice(startIndex, endIndex),
        total: demoData.institutionalAnomalies.length,
        page,
        limit
      };
    },
    getAnomaliesByBranch: () => demoData.branchAnomalies,
    getFatcaStats: () => demoData.fatcaStats,
    getFatcaClients: (page = 1, limit = 10) => {
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      return {
        data: demoData.fatcaClients.slice(startIndex, endIndex),
        total: demoData.fatcaClients.length,
        page,
        limit
      };
    },
    getCorporateFatcaClients: (page = 1, limit = 10) => {
      // Create corporate FATCA clients from regular FATCA clients
      const corporateFatcaClients = demoData.fatcaClients
          .filter((_, index) => index % 3 === 0)
          .map(client => ({
            cli: client.cli.replace('CLI', 'ENT'),
            nom: client.nom.replace('CLIENT', 'ENTREPRISE'),
            raisonSociale: `ENTREPRISE FATCA ${client.cli.substring(3)}`,
            dateEntreeRelation: client.date_entree_relation,
            statusClient: client.status_client,
            paysImmatriculation: client.pays_naissance,
            paysResidenceFiscale: client.nationalite,
            adresse: client.adresse,
            paysAdresse: client.pays_adresse,
            telephone: client.telephone,
            agence: client.cli.substring(3, 5),
            fatcaStatus: client.fatca_status,
            fatcaDate: client.fatca_date,
            fatcaUti: client.fatca_uti,
            notes: client.notes
          }));

      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;

      return {
        data: corporateFatcaClients.slice(startIndex, endIndex),
        total: corporateFatcaClients.length,
        page,
        limit
      };
    },
    getFatcaIndicators: () => demoData.fatcaIndicators,
    getAgencyCorrectionStats: () => demoData.agencyCorrectionStats,
    getWeeklyCorrectionStats: () => demoData.weeklyCorrectionStats,
    getDataLoadHistory: () => demoData.dataLoadHistory,
    getUsersByAgency: () => demoData.usersByAgency,
    getGlobalTrackingData: () => demoData.globalTrackingData
  };
};

// Export a singleton instance
export const demoDataProvider = createDemoDataProvider();

export const demoData = {
  // Statistiques clients
  clientStats: {
    total: 325037,
    individual: 290000,
    corporate: 30000,
    institutional: 5037,
    anomalies: 55000,
    fatca: 12470
  },

  // Métriques de validation
  validationMetrics: [
    {
      category: 'Clients Particuliers',
      total_records: 290000,
      valid_records: 238120,
      quality_score: 82.11
    },
    {
      category: 'Clients Entreprises',
      total_records: 30000,
      valid_records: 26364,
      quality_score: 87.88
    },
    {
      category: 'Clients Institutionnels',
      total_records: 5037,
      valid_records: 4667,
      quality_score: 92.65
    }
  ],

  // Anomalies clients particuliers
  individualAnomalies: [
    {
      cli: "CLI000001",
      nom: "AKPLOGAN",
      tcli: "1",
      pre: "Djimon",
      nid: "",
      nmer: "DOSSOU Rachelle",
      dna: "1980-05-15",
      nat: "BJ",
      age: "01001",
      sext: "M",
      viln: "Cotonou",
      payn: "BJ",
      tid: "CIN"
    },
    {
      cli: "CLI000002",
      nom: "HOUNGBO",
      tcli: "1",
      pre: "Nadège",
      nid: "BJ12345",
      nmer: "",
      dna: "1975-10-20",
      nat: "BJ",
      age: "01002",
      sext: "F",
      viln: "Porto-Novo",
      payn: "BJ",
      tid: "CIN"
    },
    {
      cli: "CLI000003",
      nom: "SOGLO",
      tcli: "1",
      pre: "Koffi",
      nid: "BJ67890",
      nmer: "ADJOVI Martine",
      dna: "",
      nat: "BJ",
      age: "01003",
      sext: "M",
      viln: "Parakou",
      payn: "BJ",
      tid: "CIN"
    },
    {
      cli: "CLI000004",
      nom: "KOSSOU",
      tcli: "1",
      pre: "Sylvie",
      nid: "BJ54321",
      nmer: "AGBODJI Céline",
      dna: "1990-03-25",
      nat: "",
      age: "01004",
      sext: "F",
      viln: "Abomey-Calavi",
      payn: "BJ",
      tid: "CIN"
    },
    {
      cli: "CLI000005",
      nom: "TOKPOHOUN",
      tcli: "1",
      pre: "Honoré",
      nid: "BJ09876",
      nmer: "HOUNKANRIN Pauline",
      dna: "1985-12-10",
      nat: "BJ",
      age: "01005",
      sext: "",
      viln: "Djougou",
      payn: "BJ",
      tid: "CIN"
    },
    {
      cli: "CLI000006",
      nom: "AVOCE",
      tcli: "1",
      pre: "Antoinette",
      nid: "BJ13579",
      nmer: "GBENOU Joséphine",
      dna: "1982-07-30",
      nat: "BJ",
      age: "01001",
      sext: "F",
      viln: "",
      payn: "BJ",
      tid: "CIN"
    },
    {
      cli: "CLI000007",
      nom: "VIGNON",
      tcli: "1",
      pre: "Mathieu",
      nid: "BJ24680",
      nmer: "SANTOS Marie",
      dna: "1978-09-18",
      nat: "BJ",
      age: "01002",
      sext: "M",
      viln: "Bohicon",
      payn: "",
      tid: "CIN"
    },
    {
      cli: "CLI000008",
      nom: "DOSSOU",
      tcli: "1",
      pre: "Angèle",
      nid: "BJ97531",
      nmer: "KOFFI Rachelle",
      dna: "1995-04-05",
      nat: "BJ",
      age: "01003",
      sext: "F",
      viln: "Ouidah",
      payn: "BJ",
      tid: ""
    },
    {
      cli: "CLI000009",
      nom: "SMITH",
      tcli: "1",
      pre: "John",
      nid: "US12345",
      nmer: "SMITH Mary",
      dna: "1970-01-01",
      nat: "US",
      age: "01004",
      sext: "M",
      viln: "New York",
      payn: "US",
      tid: "PSP"
    },
    {
      cli: "CLI000010",
      nom: "JOHNSON",
      tcli: "1",
      pre: "Sarah",
      nid: "US67890",
      nmer: "WILLIAMS Emma",
      dna: "1985-06-15",
      nat: "US",
      age: "01005",
      sext: "F",
      viln: "Chicago",
      payn: "US",
      tid: "PSP"
    }
  ],

  // Anomalies clients entreprises
  corporateAnomalies: [
    {
      cli: "ENT000001",
      nom: "SOCIETE A",
      tcli: "2",
      rso: "SOCIETE ANONYME A",
      nrc: "",
      datc: "2010-05-15",
      age: "01001",
      sig: "SA",
      sec: "Commerce",
      fju: "SA",
      catn: "PME",
      lienbq: "Client"
    },
    {
      cli: "ENT000002",
      nom: "SOCIETE B",
      tcli: "2",
      rso: "",
      nrc: "BJ12345",
      datc: "2015-10-20",
      age: "01002",
      sig: "SB",
      sec: "Industrie",
      fju: "SARL",
      catn: "PME",
      lienbq: "Client"
    },
    {
      cli: "ENT000003",
      nom: "SOCIETE C",
      tcli: "2",
      rso: "SOCIETE ANONYME C",
      nrc: "BJ67890",
      datc: "",
      age: "01003",
      sig: "SC",
      sec: "Services",
      fju: "SA",
      catn: "GE",
      lienbq: "Client"
    },
    {
      cli: "ENT000004",
      nom: "SOCIETE D",
      tcli: "2",
      rso: "SOCIETE ANONYME D",
      nrc: "BJ54321",
      datc: "2005-03-25",
      age: "01004",
      sig: "SD",
      sec: "",
      fju: "SARL",
      catn: "PME",
      lienbq: "Client"
    },
    {
      cli: "ENT000005",
      nom: "SOCIETE E",
      tcli: "2",
      rso: "SOCIETE ANONYME E",
      nrc: "BJ09876",
      datc: "2012-12-10",
      age: "01005",
      sig: "SE",
      sec: "Transport",
      fju: "",
      catn: "PME",
      lienbq: "Client"
    }
  ],

  // Anomalies clients institutionnels
  institutionalAnomalies: [
    {
      cli: "INS000001",
      nom: "INSTITUTION A",
      tcli: "3",
      rso: "INSTITUTION PUBLIQUE A",
      nrc: "",
      datc: "2000-05-15",
      age: "01001",
      sec: "Administration",
      fju: "EP",
      catn: "GE",
      lienbq: "Client"
    },
    {
      cli: "INS000002",
      nom: "INSTITUTION B",
      tcli: "3",
      rso: "",
      nrc: "BJ12345",
      datc: "2005-10-20",
      age: "01002",
      sec: "Éducation",
      fju: "EP",
      catn: "GE",
      lienbq: "Client"
    },
    {
      cli: "INS000003",
      nom: "INSTITUTION C",
      tcli: "3",
      rso: "INSTITUTION PUBLIQUE C",
      nrc: "BJ67890",
      datc: "",
      age: "01003",
      sec: "Santé",
      fju: "EP",
      catn: "GE",
      lienbq: "Client"
    },
    {
      cli: "INS000004",
      nom: "INSTITUTION D",
      tcli: "3",
      rso: "INSTITUTION PUBLIQUE D",
      nrc: "BJ54321",
      datc: "1995-03-25",
      age: "01004",
      sec: "",
      fju: "EP",
      catn: "GE",
      lienbq: "Client"
    },
    {
      cli: "INS000005",
      nom: "INSTITUTION E",
      tcli: "3",
      rso: "INSTITUTION PUBLIQUE E",
      nrc: "BJ09876",
      datc: "2010-12-10",
      age: "01005",
      sec: "Sécurité",
      fju: "",
      catn: "GE",
      lienbq: "Client"
    }
  ],

  // Anomalies par agence
  branchAnomalies: [
    {
      code_agence: "01001",
      lib_agence: "AGENCE GANHI",
      nombre_anomalies: 5243
    },
    {
      code_agence: "01002",
      lib_agence: "AGENCE HAIE VIVE",
      nombre_anomalies: 4872
    },
    {
      code_agence: "01003",
      lib_agence: "AGENCE CADJEHOUN",
      nombre_anomalies: 4521
    },
    {
      code_agence: "01004",
      lib_agence: "AGENCE AKPAKPA",
      nombre_anomalies: 4123
    },
    {
      code_agence: "01005",
      lib_agence: "AGENCE JONQUET",
      nombre_anomalies: 3987
    },
    {
      code_agence: "01006",
      lib_agence: "AGENCE FIDJROSSÈ",
      nombre_anomalies: 3654
    },
    {
      code_agence: "01007",
      lib_agence: "AGENCE PORTO-NOVO",
      nombre_anomalies: 3421
    },
    {
      code_agence: "01008",
      lib_agence: "AGENCE PARAKOU",
      nombre_anomalies: 3210
    },
    {
      code_agence: "01009",
      lib_agence: "AGENCE ABOMEY-CALAVI",
      nombre_anomalies: 2987
    },
    {
      code_agence: "01010",
      lib_agence: "AGENCE OUIDAH",
      nombre_anomalies: 2765
    }
  ],

  // Statistiques FATCA
  fatcaStats: {
    total: 1250,
    individual: 850,
    corporate: 400,
    toVerify: 850,
    confirmed: 320,
    excluded: 80,
    pending: 0,
    currentMonth: 125
  },

  // Clients FATCA
  fatcaClients: [
    {
      cli: "CLI000009",
      nom: "SMITH John",
      date_entree_relation: "2020-01-01",
      status_client: "Client Actif",
      pays_naissance: "US",
      nationalite: "US",
      adresse: "123 Broadway Street, Manhattan, New York",
      pays_adresse: "US",
      telephone: "+12125551234",
      relation_client: "",
      type_relation: "",
      fatca_status: "À vérifier",
      fatca_date: null,
      fatca_uti: null,
      notes: "Client avec nationalité américaine"
    },
    {
      cli: "CLI000010",
      nom: "JOHNSON Sarah",
      date_entree_relation: "2021-06-15",
      status_client: "Client Actif",
      pays_naissance: "US",
      nationalite: "US",
      adresse: "456 Michigan Avenue, Downtown, Chicago",
      pays_adresse: "US",
      telephone: "+13125559876",
      relation_client: "",
      type_relation: "",
      fatca_status: "À vérifier",
      fatca_date: null,
      fatca_uti: null,
      notes: "Client avec nationalité américaine"
    },
    {
      cli: "CLI000016",
      nom: "WILLIAMS Michael",
      date_entree_relation: "2019-05-15",
      status_client: "Client Actif",
      pays_naissance: "US",
      nationalite: "US",
      adresse: "789 Washington Street, Downtown, Boston",
      pays_adresse: "US",
      telephone: "+16175551234",
      relation_client: "",
      type_relation: "",
      fatca_status: "Confirmé",
      fatca_date: "2023-03-10",
      fatca_uti: "admin",
      notes: "Documentation W-9 reçue"
    },
    {
      cli: "CLI000017",
      nom: "BROWN Emily",
      date_entree_relation: "2022-07-22",
      status_client: "Client Actif",
      pays_naissance: "US",
      nationalite: "US",
      adresse: "456 Hollywood Blvd, Beverly Hills, Los Angeles",
      pays_adresse: "US",
      telephone: "+13235559876",
      relation_client: "",
      type_relation: "",
      fatca_status: "Confirmé",
      fatca_date: "2023-05-20",
      fatca_uti: "admin",
      notes: "Documentation W-9 reçue"
    },
    {
      cli: "CLI000018",
      nom: "DAVIS Robert",
      date_entree_relation: "2018-11-05",
      status_client: "Client Actif",
      pays_naissance: "US",
      nationalite: "US",
      adresse: "123 Michigan Avenue, Downtown, Chicago",
      pays_adresse: "US",
      telephone: "+13125551234",
      relation_client: "",
      type_relation: "",
      fatca_status: "Exclu",
      fatca_date: "2023-02-15",
      fatca_uti: "admin",
      notes: "Client non soumis à FATCA après vérification"
    }
  ],

  // Indicateurs FATCA
  fatcaIndicators: {
    nationality: 425,
    birthplace: 300,
    address: 250,
    phone: 180,
    proxy: 60
  },

  // Statistiques de correction par agence
  agencyCorrectionStats: [
    {
      agency_code: "01001",
      agency_name: "AGENCE GANHI",
      total_anomalies: 4801,
      fixed_anomalies: 3842,
      in_review_anomalies: 523,
      rejected_anomalies: 120,
      correction_rate: 80.0,
      last_updated: "2025-06-29T02:24:58.940Z"
    },
    {
      agency_code: "01002",
      agency_name: "AGENCE HAIE VIVE",
      total_anomalies: 3631,
      fixed_anomalies: 2905,
      in_review_anomalies: 453,
      rejected_anomalies: 100,
      correction_rate: 79.9,
      last_updated: "2025-06-29T02:24:58.940Z"
    },
    {
      agency_code: "01003",
      agency_name: "AGENCE CADJEHOUN",
      total_anomalies: 4843,
      fixed_anomalies: 3630,
      in_review_anomalies: 605,
      rejected_anomalies: 150,
      correction_rate: 75.0,
      last_updated: "2025-06-29T02:24:58.940Z"
    },
    {
      agency_code: "01004",
      agency_name: "AGENCE AKPAKPA",
      total_anomalies: 4471,
      fixed_anomalies: 3130,
      in_review_anomalies: 670,
      rejected_anomalies: 200,
      correction_rate: 70.0,
      last_updated: "2025-06-29T02:24:58.940Z"
    },
    {
      agency_code: "01005",
      agency_name: "AGENCE JONQUET",
      total_anomalies: 3194,
      fixed_anomalies: 2235,
      in_review_anomalies: 479,
      rejected_anomalies: 160,
      correction_rate: 70.0,
      last_updated: "2025-06-29T02:24:58.940Z"
    }
  ],

  // Statistiques de correction hebdomadaires
  weeklyCorrectionStats: [
    {
      year_week: "20251",
      week_label: "2025-W1",
      status: "detected",
      count: 142
    },
    {
      year_week: "20251",
      week_label: "2025-W1",
      status: "in_review",
      count: 87
    },
    {
      year_week: "20251",
      week_label: "2025-W1",
      status: "fixed",
      count: 65
    },
    {
      year_week: "20251",
      week_label: "2025-W1",
      status: "rejected",
      count: 12
    },
    {
      year_week: "20252",
      week_label: "2025-W2",
      status: "detected",
      count: 128
    },
    {
      year_week: "20252",
      week_label: "2025-W2",
      status: "in_review",
      count: 92
    },
    {
      year_week: "20252",
      week_label: "2025-W2",
      status: "fixed",
      count: 58
    },
    {
      year_week: "20252",
      week_label: "2025-W2",
      status: "rejected",
      count: 15
    },
    {
      year_week: "20253",
      week_label: "2025-W3",
      status: "detected",
      count: 135
    },
    {
      year_week: "20253",
      week_label: "2025-W3",
      status: "in_review",
      count: 78
    },
    {
      year_week: "20253",
      week_label: "2025-W3",
      status: "fixed",
      count: 62
    },
    {
      year_week: "20253",
      week_label: "2025-W3",
      status: "rejected",
      count: 18
    }
  ],

  // Historique des chargements de données
  dataLoadHistory: [
    {
      id: 1,
      table_name: "bkcli",
      records_count: 8765,
      load_date: "2025-06-28T00:00:00.000Z",
      load_status: "success",
      error_message: null,
      loaded_by: "admin",
      execution_time_ms: 45678
    },
    {
      id: 2,
      table_name: "bkcom",
      records_count: 12543,
      load_date: "2025-06-27T00:00:00.000Z",
      load_status: "success",
      error_message: null,
      loaded_by: "system",
      execution_time_ms: 32456
    },
    {
      id: 3,
      table_name: "bkadcli",
      records_count: 7654,
      load_date: "2025-06-26T00:00:00.000Z",
      load_status: "success",
      error_message: null,
      loaded_by: "batch_process",
      execution_time_ms: 28765
    },
    {
      id: 4,
      table_name: "bktelcli",
      records_count: 0,
      load_date: "2025-06-25T00:00:00.000Z",
      load_status: "error",
      error_message: "Erreur de connexion à la base de données",
      loaded_by: "system",
      execution_time_ms: 12345
    },
    {
      id: 5,
      table_name: "bkemacli",
      records_count: 5432,
      load_date: "2025-06-24T00:00:00.000Z",
      load_status: "success",
      error_message: null,
      loaded_by: "admin",
      execution_time_ms: 23456
    }
  ],

  // Utilisateurs par agence
  usersByAgency: [
    {
      agency_code: "01001",
      user_count: 5,
      last_activity: "2025-06-28T10:15:30.000Z"
    },
    {
      agency_code: "01002",
      user_count: 3,
      last_activity: "2025-06-27T14:25:10.000Z"
    },
    {
      agency_code: "01003",
      user_count: 4,
      last_activity: "2025-06-26T09:45:20.000Z"
    },
    {
      agency_code: "01004",
      user_count: 2,
      last_activity: "2025-06-25T16:35:40.000Z"
    },
    {
      agency_code: "01005",
      user_count: 3,
      last_activity: "2025-06-24T11:55:15.000Z"
    }
  ],

  // Données de suivi global
  globalTrackingData: [
    {
      agencyCode: "01001",
      agencyName: "AGENCE GANHI",
      flux: {
        total: 876,
        anomalies: 175,
        fiabilises: 140
      },
      stock: {
        actifs: 8765,
        anomalies: 1753,
        fiabilises: 1402
      },
      general: {
        actifs: 8765,
        anomalies: 1753,
        fiabilises: 1402
      },
      indicators: {
        tauxAnomalies: 20.0,
        tauxFiabilisation: 80.0
      }
    },
    {
      agencyCode: "01002",
      agencyName: "AGENCE HAIE VIVE",
      flux: {
        total: 765,
        anomalies: 153,
        fiabilises: 122
      },
      stock: {
        actifs: 7654,
        anomalies: 1531,
        fiabilises: 1225
      },
      general: {
        actifs: 7654,
        anomalies: 1531,
        fiabilises: 1225
      },
      indicators: {
        tauxAnomalies: 20.0,
        tauxFiabilisation: 80.0
      }
    },
    {
      agencyCode: "01003",
      agencyName: "AGENCE CADJEHOUN",
      flux: {
        total: 654,
        anomalies: 196,
        fiabilises: 137
      },
      stock: {
        actifs: 6543,
        anomalies: 1963,
        fiabilises: 1374
      },
      general: {
        actifs: 6543,
        anomalies: 1963,
        fiabilises: 1374
      },
      indicators: {
        tauxAnomalies: 30.0,
        tauxFiabilisation: 70.0
      }
    },
    {
      agencyCode: "01004",
      agencyName: "AGENCE AKPAKPA",
      flux: {
        total: 543,
        anomalies: 163,
        fiabilises: 98
      },
      stock: {
        actifs: 5432,
        anomalies: 1630,
        fiabilises: 978
      },
      general: {
        actifs: 5432,
        anomalies: 1630,
        fiabilises: 978
      },
      indicators: {
        tauxAnomalies: 30.0,
        tauxFiabilisation: 60.0
      }
    },
    {
      agencyCode: "01005",
      agencyName: "AGENCE JONQUET",
      flux: {
        total: 432,
        anomalies: 130,
        fiabilises: 65
      },
      stock: {
        actifs: 4321,
        anomalies: 1296,
        fiabilises: 648
      },
      general: {
        actifs: 4321,
        anomalies: 1296,
        fiabilises: 648
      },
      indicators: {
        tauxAnomalies: 30.0,
        tauxFiabilisation: 50.0
      }
    }
  ]
};

// Fonction pour générer des données paginées
export function getPaginatedData<T>(data: T[], page: number, limit: number) {
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;

  return {
    data: data.slice(startIndex, endIndex),
    page,
    limit,
    total: data.length
  };
}