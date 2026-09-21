import { Item } from '@savant/core';

export interface VarietyValidationResult {
  valid: boolean;
  violations: string[];
}

/**
 * Validates session item sequence against the Anti-Boredom variety rules (§11.3):
 * 1. Never > 4 consecutive items of the same format.
 * 2. Every session contains >= 3 distinct formats (>= 2 for 10-min sessions).
 * 3. Every session contains >= 2 domains.
 */
export function validateVarietyRules(items: Item[], sessionMinutes: number): VarietyValidationResult {
  const violations: string[] = [];
  if (items.length === 0) {
    return { valid: false, violations: ['Session has no items'] };
  }

  // Check consecutive formats
  let consecutiveCount = 1;
  for (let i = 1; i < items.length; i++) {
    if (items[i].format === items[i - 1].format) {
      consecutiveCount++;
      if (consecutiveCount > 4) {
        violations.push(`Violation: ${consecutiveCount} consecutive items of format '${items[i].format}' (max allowed is 4).`);
        break;
      }
    } else {
      consecutiveCount = 1;
    }
  }

  // Check distinct formats
  const distinctFormats = new Set(items.map(it => it.format));
  const minRequiredFormats = sessionMinutes <= 10 ? 2 : 3;
  if (distinctFormats.size < minRequiredFormats) {
    violations.push(`Violation: Session has ${distinctFormats.size} formats, but requires at least ${minRequiredFormats}.`);
  }

  // Check distinct domains
  const distinctDomains = new Set(items.map(it => it.domain));
  if (distinctDomains.size < 2 && items.length >= 3) {
    violations.push(`Violation: Session contains only ${distinctDomains.size} domain (${Array.from(distinctDomains).join(', ')}), requires at least 2.`);
  }

  return {
    valid: violations.length === 0,
    violations
  };
}
