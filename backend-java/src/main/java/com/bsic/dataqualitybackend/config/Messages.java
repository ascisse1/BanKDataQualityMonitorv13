package com.bsic.dataqualitybackend.config;

public class Messages {

    public static class Auth {
        public static final String LOGIN_SUCCESS = "Connexion réussie";
        public static final String LOGOUT_SUCCESS = "Déconnexion réussie";
        public static final String INVALID_CREDENTIALS = "Nom d'utilisateur ou mot de passe invalide";
        public static final String USER_NOT_FOUND = "Utilisateur non trouvé";
    }

    public static class Ticket {
        public static final String CREATED_SUCCESS = "Ticket créé avec succès";
        public static final String UPDATED_SUCCESS = "Ticket mis à jour avec succès";
        public static final String NOT_FOUND = "Ticket non trouvé";
        public static final String ASSIGNED_SUCCESS = "Ticket assigné avec succès";
        public static final String CLOSED_SUCCESS = "Ticket clôturé avec succès";
    }

    public static class User {
        public static final String CREATED_SUCCESS = "Utilisateur créé avec succès";
        public static final String UPDATED_SUCCESS = "Utilisateur mis à jour avec succès";
        public static final String DELETED_SUCCESS = "Utilisateur supprimé avec succès";
        public static final String NOT_FOUND = "Utilisateur non trouvé";
        public static final String USERNAME_EXISTS = "Nom d'utilisateur déjà existant";
        public static final String EMAIL_EXISTS = "Email déjà existant";
    }

    public static class RPA {
        public static final String JOB_STARTED = "Job RPA démarré avec succès";
        public static final String JOB_COMPLETED = "Job RPA terminé avec succès";
        public static final String JOB_FAILED = "Échec du job RPA";
        public static final String JOB_NOT_FOUND = "Job RPA non trouvé";
        public static final String RETRY_SUCCESS = "Job RPA relancé avec succès";
    }

    public static class Workflow {
        public static final String STARTED_SUCCESS = "Workflow démarré avec succès";
        public static final String TASK_NOT_FOUND = "Tâche non trouvée";
        public static final String TASK_CLAIMED = "Tâche réclamée avec succès";
        public static final String TASK_COMPLETED = "Tâche complétée avec succès";
    }

    public static class Client {
        public static final String NOT_FOUND = "Client non trouvé";
    }

    public static class Validation {
        public static final String FAILED = "Échec de la validation";
    }

    public static class Error {
        public static final String UNEXPECTED = "Une erreur inattendue s'est produite";
        public static final String BAD_REQUEST = "Requête invalide";
        public static final String UNAUTHORIZED = "Non autorisé";
        public static final String FORBIDDEN = "Accès refusé";
        public static final String NOT_FOUND = "Ressource non trouvée";
        public static final String CONFLICT = "Conflit de données";
        public static final String INTERNAL_SERVER = "Erreur interne du serveur";
    }
}
