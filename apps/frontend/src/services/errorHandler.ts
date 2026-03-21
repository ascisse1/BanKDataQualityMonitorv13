import { logger } from './logger';
import { tracer } from './tracer';

/**
 * A centralized error handler for the application
 */
export class ErrorHandler {
  /**
   * Handle API errors
   * @param error The error object
   * @param context Additional context information
   * @returns A formatted error message
   */
  static handleApiError(error: unknown, context?: string): string {
    let errorMessage = 'Une erreur est survenue lors de la communication avec le serveur';
    
    if (error instanceof Error) {
      errorMessage = error.message;
      logger.error('api', `API Error${context ? ` in ${context}` : ''}`, { 
        message: error.message,
        stack: error.stack
      });
      tracer.error('network', `API Error${context ? ` in ${context}` : ''}`, { 
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    } else if (typeof error === 'string') {
      errorMessage = error;
      logger.error('api', `API Error${context ? ` in ${context}` : ''}`, { message: error });
      tracer.error('network', `API Error${context ? ` in ${context}` : ''}`, { message: error });
    } else {
      logger.error('api', `Unknown API Error${context ? ` in ${context}` : ''}`, { error });
      tracer.error('network', `Unknown API Error${context ? ` in ${context}` : ''}`, { error });
    }
    
    // For network errors, provide a more user-friendly message
    if (errorMessage.includes('Failed to fetch') || errorMessage.includes('Network Error')) {
      return 'Impossible de communiquer avec le serveur. Veuillez vérifier votre connexion internet.';
    }
    
    // For timeout errors
    if (errorMessage.includes('timeout') || errorMessage.includes('Timeout')) {
      return 'La requête a pris trop de temps. Veuillez réessayer ultérieurement.';
    }
    
    return errorMessage;
  }

  /**
   * Handle validation errors
   * @param error The error object
   * @param context Additional context information
   * @returns A formatted error message
   */
  static handleValidationError(error: unknown, context?: string): string {
    let errorMessage = 'Erreur de validation des données';
    
    if (error instanceof Error) {
      errorMessage = error.message;
      logger.error('validation', `Validation Error${context ? ` in ${context}` : ''}`, { 
        message: error.message,
        stack: error.stack
      });
      tracer.error('business', `Validation Error${context ? ` in ${context}` : ''}`, { 
        message: error.message,
        stack: error.stack
      });
    } else if (typeof error === 'string') {
      errorMessage = error;
      logger.error('validation', `Validation Error${context ? ` in ${context}` : ''}`, { message: error });
      tracer.error('business', `Validation Error${context ? ` in ${context}` : ''}`, { message: error });
    } else {
      logger.error('validation', `Unknown Validation Error${context ? ` in ${context}` : ''}`, { error });
      tracer.error('business', `Unknown Validation Error${context ? ` in ${context}` : ''}`, { error });
    }
    
    return errorMessage;
  }

  /**
   * Handle authentication errors
   * @param error The error object
   * @param context Additional context information
   * @returns A formatted error message
   */
  static handleAuthError(error: unknown, context?: string): string {
    let errorMessage = 'Erreur d\'authentification';
    
    if (error instanceof Error) {
      errorMessage = error.message;
      logger.error('security', `Auth Error${context ? ` in ${context}` : ''}`, { 
        message: error.message,
        stack: error.stack
      });
      tracer.error('auth', `Auth Error${context ? ` in ${context}` : ''}`, { 
        message: error.message,
        stack: error.stack
      });
    } else if (typeof error === 'string') {
      errorMessage = error;
      logger.error('security', `Auth Error${context ? ` in ${context}` : ''}`, { message: error });
      tracer.error('auth', `Auth Error${context ? ` in ${context}` : ''}`, { message: error });
    } else {
      logger.error('security', `Unknown Auth Error${context ? ` in ${context}` : ''}`, { error });
      tracer.error('auth', `Unknown Auth Error${context ? ` in ${context}` : ''}`, { error });
    }
    
    // For token expiration, provide a more user-friendly message
    if (errorMessage.includes('expired') || errorMessage.includes('invalid token')) {
      return 'Votre session a expiré. Veuillez vous reconnecter.';
    }
    
    return errorMessage;
  }

  /**
   * Handle database errors
   * @param error The error object
   * @param context Additional context information
   * @returns A formatted error message
   */
  static handleDatabaseError(error: unknown, context?: string): string {
    let errorMessage = 'Erreur de base de données';
    
    if (error instanceof Error) {
      errorMessage = error.message;
      logger.error('database', `Database Error${context ? ` in ${context}` : ''}`, { 
        message: error.message,
        stack: error.stack
      });
      tracer.error('database', `Database Error${context ? ` in ${context}` : ''}`, { 
        message: error.message,
        stack: error.stack
      });
    } else if (typeof error === 'string') {
      errorMessage = error;
      logger.error('database', `Database Error${context ? ` in ${context}` : ''}`, { message: error });
      tracer.error('database', `Database Error${context ? ` in ${context}` : ''}`, { message: error });
    } else {
      logger.error('database', `Unknown Database Error${context ? ` in ${context}` : ''}`, { error });
      tracer.error('database', `Unknown Database Error${context ? ` in ${context}` : ''}`, { error });
    }
    
    // Don't expose SQL errors to the user
    return 'Une erreur est survenue lors de l\'accès aux données. Veuillez réessayer ultérieurement.';
  }

  /**
   * Determine if an error is a network error
   * @param error The error to check
   * @returns True if it's a network error
   */
  static isNetworkError(error: unknown): boolean {
    if (error instanceof Error) {
      return error.message.includes('Failed to fetch') || 
             error.message.includes('Network Error') ||
             error.message.includes('NetworkError') ||
             error.name === 'AbortError';
    }
    return false;
  }

  /**
   * Determine if an error is a timeout error
   * @param error The error to check
   * @returns True if it's a timeout error
   */
  static isTimeoutError(error: unknown): boolean {
    if (error instanceof Error) {
      return error.message.includes('timeout') || 
             error.message.includes('Timeout') ||
             error.name === 'TimeoutError';
    }
    return false;
  }

  /**
   * Determine if an error is an authentication error
   * @param error The error to check
   * @returns True if it's an authentication error
   */
  static isAuthError(error: unknown): boolean {
    if (error instanceof Error) {
      return error.message.includes('unauthorized') || 
             error.message.includes('Unauthorized') ||
             error.message.includes('forbidden') ||
             error.message.includes('Forbidden') ||
             error.message.includes('token') ||
             error.message.includes('Token') ||
             error.message.includes('401') ||
             error.message.includes('403');
    }
    return false;
  }
}