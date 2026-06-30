import { describe, it, expect } from 'vitest';
import { 
  validateTurkishId, 
  calcRankingScore, 
  runAutomatedDocChecker 
} from '../utils/validators';

describe('UTMS Business Rules - Verification & Validation (V&V)', () => {

  describe('Turkish National ID Validation (UC-1, UC-33)', () => {
    it('should validate correct Turkish ID checksums', () => {
      // Mathematically valid T.C. IDs
      expect(validateTurkishId('10000000146')).toBe(true);
      expect(validateTurkishId('12345678950')).toBe(true);
    });

    it('should reject invalid T.C. checksums', () => {
      expect(validateTurkishId('12345678902')).toBe(false); // seed scenario ID is mathematically invalid
      expect(validateTurkishId('65789012342')).toBe(false);
      expect(validateTurkishId('12345678900')).toBe(false);
      expect(validateTurkishId('12345678901')).toBe(false);
      expect(validateTurkishId('11111111111')).toBe(false);
    });

    it('should reject malformed T.C. inputs', () => {
      expect(validateTurkishId('123')).toBe(false);
      expect(validateTurkishId('1234567890A')).toBe(false);
      expect(validateTurkishId('02345678902')).toBe(false); // Starts with 0
      expect(validateTurkishId('')).toBe(false);
      expect(validateTurkishId(null)).toBe(false);
    });
  });

  describe('Ranking Score Calculations (UC-20, YGK Intibak)', () => {
    it('should compute score based on formula: (YKS/560)*90 + (GPA/4)*10', () => {
      // Test calculations
      // YKS: 560, GPA: 4.0 => (560/560)*90 + (4/4)*10 = 90 + 10 = 100
      expect(calcRankingScore('560', '4.00')).toBe(100.0);
      
      // YKS: 420, GPA: 3.20 => (420/560)*90 + (3.20/4.0)*10 = 67.5 + 8.0 = 75.5
      expect(calcRankingScore('420', '3.20')).toBe(75.5);
      
      // YKS: 510, GPA: 4.00 => (510/560)*90 + (4.00/4.0)*10 = 81.9643 + 10 = 91.9643
      expect(calcRankingScore('510', '4.00')).toBe(91.9643);
    });

    it('should handle null/empty values cleanly', () => {
      expect(calcRankingScore('', '3.50')).toBeNull();
      expect(calcRankingScore('430', '')).toBeNull();
      expect(calcRankingScore(null, '3.00')).toBeNull();
    });
  });

  describe('Automated Document Checker Rules (UC-4, UC-27)', () => {
    it('should pass an application with all required files and GPA >= 2.00', () => {
      const validApp = {
        currentGpa: '3.40',
        idNumber: '10000000146', // valid T.C. ID
        targetProgram: 'Computer Engineering',
        documents: [
          { slot: 1, filename: 'ogrenci_belgesi.pdf' },
          { slot: 2, filename: 'not_dokumu.pdf' },
          { slot: 3, filename: 'osym_sonuc.pdf' },
          { slot: 4, filename: 'ingilizce.pdf' } // english check passing
        ]
      };
      
      const errors = runAutomatedDocChecker(validApp);
      expect(errors.length).toBe(0);
    });

    it('should flag low GPA (< 2.00)', () => {
      const lowGpaApp = {
        currentGpa: '1.80',
        idNumber: '65789012342',
        targetProgram: 'Computer Engineering',
        documents: [
          { slot: 1 }, { slot: 2 }, { slot: 3 }, { slot: 4 }
        ]
      };
      
      const errors = runAutomatedDocChecker(lowGpaApp);
      expect(errors).toContainEqual(expect.objectContaining({
        field: 'current_gpa',
        type: 'field'
      }));
    });

    it('should flag missing required document slots', () => {
      const missingDocsApp = {
        currentGpa: '3.00',
        idNumber: '65789012342',
        targetProgram: 'Mechanical Engineering',
        documents: [
          { slot: 1 } // missing 2 and 3
        ]
      };
      
      const errors = runAutomatedDocChecker(missingDocsApp);
      expect(errors.some(e => e.slot === 2)).toBe(true);
      expect(errors.some(e => e.slot === 3)).toBe(true);
      expect(errors.some(e => e.slot === 1)).toBe(false); // Student certificate is present
    });

    it('should flag missing English certificate for CENG/SENG targets', () => {
      const englishTargetApp = {
        currentGpa: '3.00',
        idNumber: '65789012342',
        targetProgram: 'Computer Engineering',
        documents: [
          { slot: 1 }, { slot: 2 }, { slot: 3 } //  missing 4
        ]
      };
      
      const errors = runAutomatedDocChecker(englishTargetApp);
      expect(errors.some(e => e.slot === 4)).toBe(true);
    });
  });
});
