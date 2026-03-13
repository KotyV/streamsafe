import { minimatch } from 'minimatch';
import * as path from 'path';

export class SensitiveDetector {
  private patterns: string[];

  constructor(patterns: string[]) {
    this.patterns = patterns;
  }

  updatePatterns(patterns: string[]): void {
    this.patterns = patterns;
  }

  isSensitive(filePath: string): boolean {
    const normalized = filePath.replace(/\\/g, '/');
    const basename = path.basename(normalized);

    return this.patterns.some((pattern) => {
      // Match against full path
      if (minimatch(normalized, pattern, { dot: true })) {
        return true;
      }
      // Match against basename only (for patterns like "**/.env")
      const patternBase = path.basename(pattern);
      if (minimatch(basename, patternBase, { dot: true })) {
        return true;
      }
      return false;
    });
  }
}
