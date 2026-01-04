import { apiService } from './apiService';

export interface DuplicateCandidate {
  id: string;
  client_id_1: string;
  client_id_2: string;
  client_name_1: string;
  client_name_2: string;
  similarity_score: number;
  matching_fields: string[];
  client_type: 'individual' | 'corporate';
  status: 'pending' | 'confirmed' | 'rejected' | 'merged';
  created_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
}

export interface DuplicateDetail {
  client_1: ClientDetails;
  client_2: ClientDetails;
  similarity_analysis: SimilarityAnalysis;
}

export interface ClientDetails {
  id: string;
  nom: string;
  pre?: string;
  nid?: string;
  dna?: string;
  tel?: string;
  email?: string;
  adr?: string;
  nom_mere?: string;
  rccm?: string;
  raison_sociale?: string;
  forme_juridique?: string;
  num_compte: string;
  agence: string;
  created_at: string;
}

export interface SimilarityAnalysis {
  overall_score: number;
  field_scores: {
    field: string;
    score: number;
    value_1: string;
    value_2: string;
  }[];
  matching_fields: string[];
  suspicious_patterns: string[];
}

export interface DuplicateStats {
  total_duplicates: number;
  pending_review: number;
  confirmed: number;
  rejected: number;
  merged: number;
  by_type: {
    individual: number;
    corporate: number;
  };
  high_confidence: number;
}

class DuplicateDetectionService {
  async detectDuplicates(filters?: {
    client_type?: 'individual' | 'corporate';
    min_score?: number;
  }): Promise<DuplicateCandidate[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.client_type) params.append('client_type', filters.client_type);
      if (filters?.min_score) params.append('min_score', filters.min_score.toString());

      const response = await apiService.get<DuplicateCandidate[]>(
        `/api/duplicates/detect?${params.toString()}`
      );
      return response;
    } catch (error) {
      console.error('Error detecting duplicates:', error);
      return [];
    }
  }

  async getPendingDuplicates(filters?: {
    client_type?: 'individual' | 'corporate';
  }): Promise<DuplicateCandidate[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.client_type) params.append('client_type', filters.client_type);

      const response = await apiService.get<DuplicateCandidate[]>(
        `/api/duplicates/pending?${params.toString()}`
      );
      return response;
    } catch (error) {
      console.error('Error fetching pending duplicates:', error);
      return [];
    }
  }

  async getDuplicateDetail(duplicateId: string): Promise<DuplicateDetail | null> {
    try {
      return await apiService.get<DuplicateDetail>(`/api/duplicates/${duplicateId}`);
    } catch (error) {
      console.error('Error fetching duplicate detail:', error);
      return null;
    }
  }

  async confirmDuplicate(duplicateId: string, userId: string, comments: string): Promise<boolean> {
    try {
      await apiService.post(`/api/duplicates/${duplicateId}/confirm`, {
        user_id: userId,
        comments,
      });
      return true;
    } catch (error) {
      console.error('Error confirming duplicate:', error);
      return false;
    }
  }

  async rejectDuplicate(duplicateId: string, userId: string, reason: string): Promise<boolean> {
    try {
      await apiService.post(`/api/duplicates/${duplicateId}/reject`, {
        user_id: userId,
        reason,
      });
      return true;
    } catch (error) {
      console.error('Error rejecting duplicate:', error);
      return false;
    }
  }

  async mergeDuplicates(
    duplicateId: string,
    keepClientId: string,
    mergeClientId: string,
    userId: string,
    comments: string
  ): Promise<boolean> {
    try {
      await apiService.post(`/api/duplicates/${duplicateId}/merge`, {
        keep_client_id: keepClientId,
        merge_client_id: mergeClientId,
        user_id: userId,
        comments,
      });
      return true;
    } catch (error) {
      console.error('Error merging duplicates:', error);
      return false;
    }
  }

  async getDuplicateStats(): Promise<DuplicateStats | null> {
    try {
      return await apiService.get<DuplicateStats>('/api/duplicates/stats');
    } catch (error) {
      console.error('Error fetching duplicate stats:', error);
      return null;
    }
  }

  calculateLevenshteinDistance(str1: string, str2: string): number {
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();

    const len1 = s1.length;
    const len2 = s2.length;

    const matrix: number[][] = [];

    for (let i = 0; i <= len1; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= len2; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }

    return matrix[len1][len2];
  }

  calculateSimilarityScore(str1: string, str2: string): number {
    if (!str1 || !str2) return 0;

    const distance = this.calculateLevenshteinDistance(str1, str2);
    const maxLength = Math.max(str1.length, str2.length);

    if (maxLength === 0) return 100;

    return Math.round(((maxLength - distance) / maxLength) * 100);
  }

  normalizeString(str: string): string {
    return str
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, ' ');
  }

  extractPhoneticKey(name: string): string {
    const normalized = this.normalizeString(name);

    const soundexMap: { [key: string]: string } = {
      b: '1', f: '1', p: '1', v: '1',
      c: '2', g: '2', j: '2', k: '2', q: '2', s: '2', x: '2', z: '2',
      d: '3', t: '3',
      l: '4',
      m: '5', n: '5',
      r: '6',
    };

    let key = normalized[0] || '';
    let prevCode = soundexMap[key] || '';

    for (let i = 1; i < normalized.length && key.length < 4; i++) {
      const char = normalized[i];
      const code = soundexMap[char];

      if (code && code !== prevCode) {
        key += code;
        prevCode = code;
      } else if (char === ' ') {
        prevCode = '';
      }
    }

    return key.padEnd(4, '0');
  }

  getConfidenceLevel(score: number): { level: string; color: string; label: string } {
    if (score >= 90) {
      return { level: 'very_high', color: 'red', label: 'Très Élevée' };
    } else if (score >= 75) {
      return { level: 'high', color: 'orange', label: 'Élevée' };
    } else if (score >= 60) {
      return { level: 'medium', color: 'yellow', label: 'Moyenne' };
    } else {
      return { level: 'low', color: 'green', label: 'Faible' };
    }
  }

  formatMatchingFields(fields: string[]): string {
    const fieldLabels: { [key: string]: string } = {
      nom: 'Nom',
      pre: 'Prénom',
      nid: 'N° Pièce d\'identité',
      dna: 'Date de naissance',
      tel: 'Téléphone',
      email: 'Email',
      nom_mere: 'Nom de la mère',
      rccm: 'RCCM',
      raison_sociale: 'Raison sociale',
    };

    return fields.map(f => fieldLabels[f] || f).join(', ');
  }

  async runDuplicateDetection(
    clientType: 'individual' | 'corporate',
    batchSize: number = 1000
  ): Promise<{ detected: number; processed: number }> {
    try {
      const response = await apiService.post<{ detected: number; processed: number }>(
        '/api/duplicates/run-detection',
        {
          client_type: clientType,
          batch_size: batchSize,
        }
      );
      return response;
    } catch (error) {
      console.error('Error running duplicate detection:', error);
      return { detected: 0, processed: 0 };
    }
  }
}

export const duplicateDetectionService = new DuplicateDetectionService();
