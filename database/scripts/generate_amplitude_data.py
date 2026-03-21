#!/usr/bin/env python3
"""
AMPLITUDE CBS - Large Scale Seed Data Generator for Informix
Generates realistic banking data for BSIC Mali

Usage:
    python generate_amplitude_data.py                    # Default: 100K clients
    python generate_amplitude_data.py --env dev         # 1K clients for dev
    python generate_amplitude_data.py --env test        # 10K clients for test
    python generate_amplitude_data.py --env demo        # 100K clients for demo
    python generate_amplitude_data.py --clients 5000    # Custom number
"""

import random
from datetime import datetime, timedelta
import os
import argparse

# Environment configurations
ENV_CONFIGS = {
    "dev": {"clients": 1000, "suffix": "1k"},
    "test": {"clients": 10000, "suffix": "10k"},
    "demo": {"clients": 100000, "suffix": "100k"},
    "prod": {"clients": 100000, "suffix": "100k"},
}

def parse_args():
    parser = argparse.ArgumentParser(description="Generate Amplitude CBS seed data")
    parser.add_argument("--env", choices=["dev", "test", "demo", "prod"], default=None,
                        help="Environment preset (dev=1K, test=10K, demo=100K)")
    parser.add_argument("--clients", type=int, default=None,
                        help="Total number of clients to generate")
    parser.add_argument("--output", type=str, default=None,
                        help="Output filename (without path)")
    return parser.parse_args()

# Parse arguments
args = parse_args()

# Determine configuration
if args.env:
    config = ENV_CONFIGS[args.env]
    TOTAL_CLIENTS = config["clients"]
    OUTPUT_SUFFIX = config["suffix"]
elif args.clients:
    TOTAL_CLIENTS = args.clients
    OUTPUT_SUFFIX = f"{TOTAL_CLIENTS // 1000}k" if TOTAL_CLIENTS >= 1000 else str(TOTAL_CLIENTS)
else:
    TOTAL_CLIENTS = 100000
    OUTPUT_SUFFIX = "100k"

# Calculate split (80% individuals, 20% companies)
NUM_CLIENTS_PARTICULIERS = int(TOTAL_CLIENTS * 0.8)
NUM_CLIENTS_ENTREPRISES = TOTAL_CLIENTS - NUM_CLIENTS_PARTICULIERS

# Output filename
if args.output:
    OUTPUT_FILE = args.output
else:
    OUTPUT_FILE = f"amplitude_seed_data_{OUTPUT_SUFFIX}_informix.sql"

# Realistic Malian data
NOMS_MALIENS = [
    "TRAORE", "DIALLO", "COULIBALY", "KEITA", "KONE", "TOURE", "DIARRA", "SANGARE",
    "SIDIBE", "SISSOKO", "DEMBELE", "CAMARA", "CISSE", "SYLLA", "FOFANA", "SACKO",
    "MAIGA", "BAGAYOKO", "DOUMBIA", "SAMAKE", "DIABATE", "SANOGO", "SANOU", "BAMBA",
    "KONATE", "HAIDARA", "DICKO", "BA", "SOW", "FALL", "DIOP", "NDIAYE",
    "KANE", "BARRY", "DOUCOURE", "DABO", "TANDIA", "TALL", "THIAM", "OUOLOGUEM",
    "BATHILY", "DAOU", "DIAKITE", "NIARE", "KASSOGUE", "GOITA", "GUINDO", "TOGO",
    "BERTHE", "KOULIBALY", "MARIKO", "SOUMARE", "MARICO", "DIAWARA", "SIMPARA", "SAGARA",
    "TRAORE", "KOUYATE", "CISSOUMA", "TANGARA", "TOGOLA", "DAGNOKO", "FANE", "DOUMBO",
    "GUIRO", "TAMBOURA", "BORE", "KANSAYE", "OUATTARA", "DRAME", "NIANGADO", "BOUARE",
    "KONE", "DIAKITE", "COULIBALY", "SANGARÉ", "DIALLO", "KEÏTA", "CISSÉ", "SISSOKO"
]

PRENOMS_MASCULINS = [
    "Ibrahim", "Seydou", "Mamadou", "Drissa", "Moussa", "Amadou", "Bakary", "Modibo",
    "Oumar", "Abdoulaye", "Boubacar", "Cheick", "Daouda", "Yacouba", "Adama", "Souleymane",
    "Ousmane", "Issa", "Mahamadou", "Sidy", "Tidiane", "Lassana", "Salif", "Alassane",
    "Demba", "Aliou", "Baba", "Hamidou", "Ibrahima", "Kalifa", "Mady", "Nana",
    "Sadio", "Samba", "Seku", "Siaka", "Tiemoko", "Yaya", "Zoumana", "Brehima",
    "Djibril", "Fode", "Gaoussou", "Hamady", "Karamoko", "Ladji", "Malick", "Niankoro",
    "Oumarou", "Sambou", "Sekou", "Siriman", "Sotigui", "Tiefing", "Youssouf", "Abdramane",
    "Bassidi", "Cheickna", "Diakaridia", "Fagnan", "Harouna", "Karim", "Madou", "Nfaly"
]

PRENOMS_FEMININS = [
    "Fatou", "Aminata", "Awa", "Mariam", "Rokia", "Fanta", "Aissata", "Bintou",
    "Kadiatou", "Fatoumata", "Oumou", "Safiatou", "Djénéba", "Korotoumou", "Nana",
    "Salimata", "Sanata", "Sitan", "Tata", "Tenin", "Hawa", "Kadia", "Maimouna",
    "Nassira", "Ramata", "Sadio", "Sali", "Saran", "Sissoko", "Sogona", "Assetou",
    "Binta", "Coumba", "Diarratou", "Fatouma", "Haby", "Inna", "Jeanne", "Kadidia",
    "Lala", "Mama", "Nene", "Ouma", "Penda", "Ramatou", "Safiata", "Tanti",
    "Yaye", "Adja", "Bah", "Chata", "Djeneba", "Fily", "Gnima", "Hadiata"
]

# Malian cities with regions
VILLES = [
    ("Bamako", "Bamako", "District de Bamako"),
    ("Sikasso", "Sikasso", "Sikasso"),
    ("Mopti", "Mopti", "Mopti"),
    ("Koutiala", "Koutiala", "Sikasso"),
    ("Kayes", "Kayes", "Kayes"),
    ("Segou", "Segou", "Segou"),
    ("Gao", "Gao", "Gao"),
    ("Kati", "Kati", "Koulikoro"),
    ("Koulikoro", "Koulikoro", "Koulikoro"),
    ("Tombouctou", "Tombouctou", "Tombouctou"),
    ("San", "San", "Segou"),
    ("Niono", "Niono", "Segou"),
    ("Kidal", "Kidal", "Kidal"),
    ("Bougouni", "Bougouni", "Sikasso"),
    ("Yanfolila", "Yanfolila", "Sikasso"),
    ("Kolokani", "Kolokani", "Koulikoro"),
    ("Banamba", "Banamba", "Koulikoro"),
    ("Dioila", "Dioila", "Koulikoro"),
    ("Kangaba", "Kangaba", "Koulikoro"),
    ("Nioro du Sahel", "Nioro", "Kayes"),
    ("Yelimane", "Yelimane", "Kayes"),
    ("Kenieba", "Kenieba", "Kayes"),
    ("Bafoulabe", "Bafoulabe", "Kayes"),
    ("Djenne", "Djenne", "Mopti"),
    ("Bandiagara", "Bandiagara", "Mopti")
]

# Bamako neighborhoods
QUARTIERS_BAMAKO = [
    "Hamdallaye ACI 2000", "Badalabougou", "Hippodrome", "Quinzambougou",
    "Niarela", "Missira", "Lafiabougou", "Kalaban Coura", "Sebenikoro",
    "Djelibougou", "Sotuba", "Magnambougou", "Faladie", "Bamako Coura",
    "Medina Coura", "Bolibana", "Dravela", "Baco Djicoroni", "Torokorobougou",
    "Daoudabougou", "Sabalibougou", "Garantiguibougou", "Yirimadio", "Niamakoro"
]

AGENCES = ["00100", "00200", "00300", "00400", "00500", "00600", "00700", "00800"]

PROFESSIONS = [
    ("CAD", "Cadre"), ("EMP", "Employe"), ("COM", "Commercant"), ("ING", "Ingenieur"),
    ("DIR", "Directeur"), ("ENS", "Enseignant"), ("MED", "Medecin"), ("AVT", "Avocat"),
    ("AGR", "Agriculteur"), ("INF", "Informaticien"), ("TEC", "Technicien"),
    ("SEC", "Secretaire"), ("ART", "Artisan"), ("ETU", "Etudiant"), ("RET", "Retraite"),
    ("LIB", "Liberal"), ("BAN", "Banquier"), ("CPT", "Comptable"), ("CHF", "Chauffeur"),
    ("GEN", "Gerant")
]

EMPLOYEURS = [
    "ORANGE MALI", "MALITEL", "TELECEL MALI", "BSIC MALI", "BDM SA", "BMS SA", "ECOBANK MALI",
    "EDM SA", "SOMAGEP", "SOTRAMA", "AIR MALI", "AZAR SA", "CFAO MOTORS MALI",
    "TOTAL MALI", "VIVO ENERGY MALI", "BRAMALI", "GRANDS MOULINS DU MALI",
    "COMATEX", "HUICOMA", "CMDT", "OFFICE DU NIGER", "SOTELMA",
    "CHU POINT G", "CHU GABRIEL TOURE", "EDUCATION NATIONALE", "TRESOR PUBLIC", "INDEPENDANT",
    "SOMAPIL", "TOGUNA AGRO", "KATI CIVILS", "PMU MALI", "BIM SA", "ORABANK MALI"
]

FORMES_JURIDIQUES = [
    ("SA", "Societe Anonyme"), ("SR", "SARL"), ("SS", "SAS"), ("EI", "Entreprise Individuelle"),
    ("SC", "Societe Civile"), ("SN", "SNC"), ("GI", "GIE")
]

SECTEURS = [
    "COM01", "BTP01", "TRS01", "AGR01", "SAN01", "HTL01", "SRV01", "ENG01",
    "RST01", "IND01", "FIN01", "TEL01", "EDU01", "IMM01", "MIN01"
]

TYPES_ENTREPRISES = [
    "GROUPE", "SOCIETE", "ENTREPRISE", "ETABLISSEMENT", "COMPAGNIE", "CABINET",
    "AGENCE", "BUREAU", "CENTRE", "INSTITUT"
]

ACTIVITES_ENTREPRISES = [
    "NEGOCE", "CONSTRUCTION", "TRANSPORT", "COMMERCE", "IMPORT EXPORT",
    "AGRICULTURE", "PHARMACIE", "HOTEL", "RESTAURANT", "CONSEIL",
    "ENERGIE", "TELECOMMUNICATIONS", "IMMOBILIER", "INDUSTRIE", "SERVICES"
]


def random_date(start_year, end_year):
    """Generate a random date between two years in Informix MDY format"""
    start = datetime(start_year, 1, 1)
    end = datetime(end_year, 12, 31)
    delta = end - start
    random_days = random.randint(0, delta.days)
    return (start + timedelta(days=random_days)).strftime("%m/%d/%Y")


def generate_phone():
    """Generate Malian phone number"""
    prefixes = ["70", "71", "72", "73", "74", "75", "76", "77", "78", "79", "66", "65"]
    return f"+223 {random.choice(prefixes)}{random.randint(100000, 999999)}"


def generate_phone_fixe():
    """Generate Malian landline"""
    return f"+223 20{random.randint(200000, 299999)}"


def generate_client_code(index):
    """Generate client code"""
    return f"CLI{index:012d}"


def generate_account_number(index):
    """Generate account number"""
    return f"{index:011d}"


def generate_nidn(birth_date, sex):
    """Generate Malian national ID number (NINA format)
    birth_date is in MM/DD/YYYY format"""
    month = birth_date[0:2]
    year = birth_date[8:10]  # Last 2 digits of year
    serial = random.randint(1000000, 9999999)
    return f"ML{sex[0]}{year}{month}{serial}"


def escape_sql(s):
    """Escape single quotes for SQL"""
    if s is None:
        return None
    return s.replace("'", "''")


def generate_particuliers(start_index, count):
    """Generate individual clients"""
    clients = []
    for i in range(count):
        idx = start_index + i
        cli = generate_client_code(idx)
        nom = random.choice(NOMS_MALIENS)
        sex = random.choice(["M", "F"])

        if sex == "M":
            pre = random.choice(PRENOMS_MASCULINS)
            lib = "M."
        else:
            pre = random.choice(PRENOMS_FEMININS)
            lib = random.choice(["Mme", "Mle"])

        dna = random_date(1960, 2000)
        ville_info = random.choice(VILLES)
        age = random.choice(AGENCES)
        ges = f"{random.randint(1, 10):03d}"

        sit = random.choice(["C", "M", "D", "V"])
        nbenf = random.randint(0, 6) if sit in ["M", "D", "V"] else 0

        nidn = generate_nidn(dna, sex)

        dou = random_date(2010, 2024)
        dmo = random_date(2023, 2024)

        clients.append({
            "cli": cli, "nom": nom, "tcli": "1", "lib": lib, "pre": pre,
            "sext": sex, "dna": dna, "viln": ville_info[0], "payn": "MLI",
            "nat": "MLI", "res": "MLI", "sit": sit, "nbenf": nbenf,
            "nidn": nidn, "age": age, "ges": ges, "tax": "O", "lang": "FRA",
            "ichq": random.choice(["N", "N", "N", "N", "Y"]),  # 20% interdits
            "icb": random.choice(["N", "N", "N", "N", "Y"]),
            "utic": "ADMIN", "dou": dou, "dmo": dmo
        })
    return clients


def generate_entreprises(start_index, count):
    """Generate company clients"""
    clients = []
    for i in range(count):
        idx = start_index + i
        cli = generate_client_code(idx)

        type_ent = random.choice(TYPES_ENTREPRISES)
        activite = random.choice(ACTIVITES_ENTREPRISES)
        nom = f"{type_ent} {activite}"[:36]
        rso = f"{type_ent} {activite} CI"[:65]

        fju_info = random.choice(FORMES_JURIDIQUES)
        sig = "".join([w[0] for w in nom.split()[:4]])[:20]

        datc = random_date(2000, 2020)
        year = datc[6:10]  # MM/DD/YYYY format - year is at position 6-10
        nrc = f"ML-BKO-{year}-B-{random.randint(10000, 99999)}"
        vrc = f"{datc[0:2]}/{datc[3:5]}/{int(year) + 5}"  # Expiry date in MDY format
        nidf = f"NIF{year}{random.randint(10000, 99999)}"
        npa = f"PT{year}{random.randint(10000, 99999)}"

        age = random.choice(AGENCES)
        ges = f"{random.randint(1, 10):03d}"
        sec = random.choice(SECTEURS)

        dou = random_date(2010, 2024)
        dmo = random_date(2023, 2024)

        clients.append({
            "cli": cli, "nom": escape_sql(nom), "tcli": "2", "rso": escape_sql(rso),
            "sig": sig, "datc": datc, "fju": fju_info[0], "nrc": nrc,
            "vrc": vrc, "nidf": nidf, "npa": npa, "vpa": vrc, "sec": sec,
            "age": age, "ges": ges, "tax": "O", "lang": "FRA",
            "ichq": "N", "icb": "N", "utic": "ADMIN", "dou": dou, "dmo": dmo
        })
    return clients


def generate_accounts(clients):
    """Generate accounts for clients"""
    accounts = []
    account_idx = 1

    for client in clients:
        cli = client["cli"]
        age = client["age"]
        tcli = client["tcli"]

        # Determine number of accounts (1-3 for individuals, 1-5 for companies)
        if tcli == "1":
            num_accounts = random.choices([1, 2, 3], weights=[70, 25, 5])[0]
            cha_base = "371000000"
            typ_base = "CCP"
        else:
            num_accounts = random.choices([1, 2, 3, 4, 5], weights=[40, 30, 15, 10, 5])[0]
            cha_base = "371100000"
            typ_base = "CCE"

        for acc_num in range(num_accounts):
            ncp = generate_account_number(account_idx)
            suf = f"{acc_num:02d}"
            dev = "XOF"

            if acc_num == 0:
                cha = cha_base
                typ = typ_base
            else:
                # Additional accounts: savings, term deposit
                cha = random.choice(["372000000", "373000000"])
                typ = random.choice(["CEP", "DAT"])

            clc = f"{random.randint(10, 99)}"
            inti = client["nom"][:30]

            # Generate realistic balance
            if tcli == "1":
                sde = round(random.uniform(-500000, 15000000), 4)
            else:
                sde = round(random.uniform(1000000, 200000000), 4)

            dou = client["dou"]
            dmo = random_date(2024, 2024)
            ddm = dmo

            accounts.append({
                "ncp": ncp, "suf": suf, "age": age, "dev": dev, "cha": cha,
                "clc": clc, "cli": cli, "inti": escape_sql(inti), "typ": typ,
                "sde": sde, "sva": sde, "dou": dou, "dmo": dmo, "ddm": ddm,
                "ife": "N", "cfe": "N", "utic": "ADMIN"
            })
            account_idx += 1

    return accounts


def generate_addresses(clients):
    """Generate addresses for clients"""
    addresses = []

    for client in clients:
        cli = client["cli"]

        if client["tcli"] == "1":
            ville_info = random.choice(VILLES)
            if ville_info[0] == "Bamako":
                adr1 = random.choice(QUARTIERS_BAMAKO)
            else:
                adr1 = f"Quartier {random.choice(['Centre', 'Commerce', 'Residentiel', 'Nord', 'Sud'])}"
            adr2 = f"Lot {random.randint(1, 500)}"
        else:
            ville_info = random.choice(VILLES[:5])  # Companies mostly in big cities
            adr1 = f"Zone {random.choice(['Industrielle', 'Commerciale', 'ACI', 'Sotuba'])}"
            adr2 = f"Immeuble {random.choice(['Alpha', 'BCEAO', 'Le Djoliba', 'Les Tours', 'Central'])}"

        bp = f"BP {random.randint(100, 9999)}"
        cpos = f"{random.randint(1, 50):02d} {bp}"

        email_prefix = client["nom"].lower().replace(" ", ".").replace("'", "")
        email = f"{email_prefix}{random.randint(1, 999)}@{'gmail.com' if random.random() > 0.5 else 'email.ml'}"

        addresses.append({
            "cli": cli, "typ": "01", "lang": "FRA",
            "adr1": escape_sql(adr1)[:30], "adr2": escape_sql(adr2)[:30],
            "ville": ville_info[0], "dep": ville_info[1], "reg": ville_info[2],
            "cpos": cpos[:10], "cpay": "MLI", "email": email[:50], "bpos": bp
        })

    return addresses


def generate_profiles(clients):
    """Generate professional profiles for individual clients"""
    profiles = []

    for client in clients:
        if client["tcli"] != "1":
            continue

        cli = client["cli"]
        prf_info = random.choice(PROFESSIONS)

        if prf_info[0] in ["ETU", "RET"]:
            emp = None
            demb = None
            demp = None
        else:
            emp = random.choice(EMPLOYEURS)
            demb = random_date(2005, 2023)
            demp = random.choice(VILLES)[0]

        trev = f"{random.randint(1, 10):02d}"

        profiles.append({
            "cli": cli, "prf": prf_info[0], "emp": emp,
            "demb": demb, "trev": trev, "demp": demp
        })

    return profiles


def generate_contacts(clients):
    """Generate contacts for all clients"""
    contacts = []

    for client in clients:
        cli = client["cli"]

        if client["tcli"] == "1":
            nom = client["nom"]
            pre = client.get("pre", "")
            tel = generate_phone()
        else:
            nom = random.choice(NOMS_MALIENS)
            pre = random.choice(PRENOMS_MASCULINS + PRENOMS_FEMININS)
            tel = generate_phone_fixe()

        email_prefix = f"{pre.lower()}.{nom.lower()}".replace(" ", "").replace("'", "")
        email = f"{email_prefix}@email.ml"

        contacts.append({
            "cli": cli, "nom": escape_sql(nom), "pre": escape_sql(pre),
            "tel": tel, "email": email[:50]
        })

    return contacts


def generate_emails(clients):
    """Generate emails for clients"""
    emails = []

    for client in clients:
        cli = client["cli"]
        nom = client["nom"].lower().replace(" ", ".").replace("'", "")

        # Personal email
        domains = ["gmail.com", "yahoo.fr", "outlook.com", "hotmail.com"]
        email_per = f"{nom}{random.randint(1, 999)}@{random.choice(domains)}"
        emails.append({"cli": cli, "typ": "PER", "email": email_per[:50], "atrf": "N"})

        # Professional email (50% chance)
        if random.random() > 0.5:
            if client["tcli"] == "1":
                emp = random.choice(EMPLOYEURS).lower().replace(" ", "")
                email_pro = f"{nom[0]}{nom}@{emp}.ci"
            else:
                email_pro = f"contact@{nom[:15]}.ci"
            emails.append({"cli": cli, "typ": "PRO", "email": email_pro[:50], "atrf": "N"})

    return emails


def write_insert_bkcli(f, clients):
    """Write INSERT statements for bkcli"""
    f.write("\n-- ============================================================================\n")
    f.write("-- BKCLI - Clients\n")
    f.write("-- ============================================================================\n\n")

    for c in clients:
        if c["tcli"] == "1":
            f.write(f"INSERT INTO bkcli (cli, nom, tcli, lib, pre, sext, dna, viln, payn, nat, res, sit, nbenf, nidn, age, ges, tax, lang, ichq, icb, utic, dou, dmo) VALUES ('{c['cli']}', '{c['nom']}', '{c['tcli']}', '{c['lib']}', '{c['pre']}', '{c['sext']}', '{c['dna']}', '{c['viln']}', '{c['payn']}', '{c['nat']}', '{c['res']}', '{c['sit']}', {c['nbenf']}, '{c['nidn']}', '{c['age']}', '{c['ges']}', '{c['tax']}', '{c['lang']}', '{c['ichq']}', '{c['icb']}', '{c['utic']}', '{c['dou']}', '{c['dmo']}');\n")
        else:
            f.write(f"INSERT INTO bkcli (cli, nom, tcli, rso, sig, datc, fju, nrc, vrc, nidf, npa, vpa, sec, age, ges, tax, lang, ichq, icb, utic, dou, dmo) VALUES ('{c['cli']}', '{c['nom']}', '{c['tcli']}', '{c['rso']}', '{c['sig']}', '{c['datc']}', '{c['fju']}', '{c['nrc']}', '{c['vrc']}', '{c['nidf']}', '{c['npa']}', '{c['vpa']}', '{c['sec']}', '{c['age']}', '{c['ges']}', '{c['tax']}', '{c['lang']}', '{c['ichq']}', '{c['icb']}', '{c['utic']}', '{c['dou']}', '{c['dmo']}');\n")


def write_insert_bkcom(f, accounts):
    """Write INSERT statements for bkcom"""
    f.write("\n-- ============================================================================\n")
    f.write("-- BKCOM - Comptes\n")
    f.write("-- ============================================================================\n\n")

    for a in accounts:
        f.write(f"INSERT INTO bkcom (ncp, suf, age, dev, cha, clc, cli, inti, typ, sde, sva, dou, dmo, ddm, ife, cfe, utic) VALUES ('{a['ncp']}', '{a['suf']}', '{a['age']}', '{a['dev']}', '{a['cha']}', '{a['clc']}', '{a['cli']}', '{a['inti']}', '{a['typ']}', {a['sde']}, {a['sva']}, '{a['dou']}', '{a['dmo']}', '{a['ddm']}', '{a['ife']}', '{a['cfe']}', '{a['utic']}');\n")


def write_insert_bkadcli(f, addresses):
    """Write INSERT statements for bkadcli"""
    f.write("\n-- ============================================================================\n")
    f.write("-- BKADCLI - Adresses\n")
    f.write("-- ============================================================================\n\n")

    for a in addresses:
        f.write(f"INSERT INTO bkadcli (cli, typ, lang, adr1, adr2, ville, dep, reg, cpos, cpay, email, bpos) VALUES ('{a['cli']}', '{a['typ']}', '{a['lang']}', '{a['adr1']}', '{a['adr2']}', '{a['ville']}', '{a['dep']}', '{a['reg']}', '{a['cpos']}', '{a['cpay']}', '{a['email']}', '{a['bpos']}');\n")


def write_insert_bkprfcli(f, profiles):
    """Write INSERT statements for bkprfcli"""
    f.write("\n-- ============================================================================\n")
    f.write("-- BKPRFCLI - Profils Professionnels\n")
    f.write("-- ============================================================================\n\n")

    for p in profiles:
        emp_val = f"'{p['emp']}'" if p['emp'] else "NULL"
        demb_val = f"'{p['demb']}'" if p['demb'] else "NULL"
        demp_val = f"'{p['demp']}'" if p['demp'] else "NULL"
        f.write(f"INSERT INTO bkprfcli (cli, prf, emp, demb, trev, demp) VALUES ('{p['cli']}', '{p['prf']}', {emp_val}, {demb_val}, '{p['trev']}', {demp_val});\n")


def write_insert_bkcntcli(f, contacts):
    """Write INSERT statements for bkcntcli"""
    f.write("\n-- ============================================================================\n")
    f.write("-- BKCNTCLI - Contacts\n")
    f.write("-- ============================================================================\n\n")

    for c in contacts:
        f.write(f"INSERT INTO bkcntcli (cli, nom, pre, tel, email) VALUES ('{c['cli']}', '{c['nom']}', '{c['pre']}', '{c['tel']}', '{c['email']}');\n")


def write_insert_bkemacli(f, emails):
    """Write INSERT statements for bkemacli"""
    f.write("\n-- ============================================================================\n")
    f.write("-- BKEMACLI - Emails\n")
    f.write("-- ============================================================================\n\n")

    for e in emails:
        f.write(f"INSERT INTO bkemacli (cli, typ, email, atrf) VALUES ('{e['cli']}', '{e['typ']}', '{e['email']}', '{e['atrf']}');\n")


def main():
    print("=" * 60)
    print("AMPLITUDE CBS - Large Scale Data Generator")
    print("=" * 60)

    # Generate clients
    print(f"\nGenerating {NUM_CLIENTS_PARTICULIERS} individual clients...")
    particuliers = generate_particuliers(1, NUM_CLIENTS_PARTICULIERS)

    print(f"Generating {NUM_CLIENTS_ENTREPRISES} company clients...")
    entreprises = generate_entreprises(NUM_CLIENTS_PARTICULIERS + 1, NUM_CLIENTS_ENTREPRISES)

    all_clients = particuliers + entreprises
    print(f"Total clients: {len(all_clients)}")

    # Generate related data
    print("\nGenerating accounts...")
    accounts = generate_accounts(all_clients)
    print(f"Total accounts: {len(accounts)}")

    print("Generating addresses...")
    addresses = generate_addresses(all_clients)
    print(f"Total addresses: {len(addresses)}")

    print("Generating professional profiles...")
    profiles = generate_profiles(all_clients)
    print(f"Total profiles: {len(profiles)}")

    print("Generating contacts...")
    contacts = generate_contacts(all_clients)
    print(f"Total contacts: {len(contacts)}")

    print("Generating emails...")
    emails = generate_emails(all_clients)
    print(f"Total emails: {len(emails)}")

    # Write to file
    output_path = os.path.join(os.path.dirname(__file__), OUTPUT_FILE)
    print(f"\nWriting to {output_path}...")

    with open(output_path, "w", encoding="utf-8") as f:
        f.write("-- ============================================================================\n")
        f.write("-- AMPLITUDE CBS - Large Scale Seed Data for INFORMIX\n")
        f.write("-- BSIC Bank - Mali\n")
        f.write(f"-- Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write(f"-- Total Records: {len(all_clients)} clients, {len(accounts)} accounts\n")
        f.write("-- ============================================================================\n")

        write_insert_bkcli(f, all_clients)
        write_insert_bkcom(f, accounts)
        write_insert_bkadcli(f, addresses)
        write_insert_bkprfcli(f, profiles)
        write_insert_bkcntcli(f, contacts)
        write_insert_bkemacli(f, emails)

        f.write("\n-- ============================================================================\n")
        f.write("-- End of Seed Data\n")
        f.write("-- ============================================================================\n")

    print("\n" + "=" * 60)
    print("DATA GENERATION COMPLETE")
    print("=" * 60)
    print(f"\nSummary:")
    print(f"  - Clients (bkcli):    {len(all_clients):,}")
    print(f"  - Accounts (bkcom):   {len(accounts):,}")
    print(f"  - Addresses (bkadcli): {len(addresses):,}")
    print(f"  - Profiles (bkprfcli): {len(profiles):,}")
    print(f"  - Contacts (bkcntcli): {len(contacts):,}")
    print(f"  - Emails (bkemacli):  {len(emails):,}")
    print(f"\nOutput file: {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
