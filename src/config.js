// @ts-check

/**
 * @file Configuration loader for INI files.
 */

import fs from 'fs/promises';
import ini from 'ini';

/**
 * Default configuration values.
 * @type {Object}
 */
const DEFAULT_CONFIG = {
  pattern: '</script>',
  flags: 'gi',
  separator: '_separator_',
};

/**
 * Load configuration from an INI file.
 *
 * @param {string} configPath - Path to the INI file.
 * @returns {Promise<Object>} Resolves with the merged configuration.
 */
export async function loadConfig(configPath) {
  try {
    const content = await fs.readFile(configPath, 'utf8');
    const parsed = ini.parse(content);

    // Merge with defaults (only existing keys in config override)
    return {
      pattern: parsed.pattern ?? DEFAULT_CONFIG.pattern,
      flags: parsed.flags ?? DEFAULT_CONFIG.flags,
      separator: parsed.separator ?? DEFAULT_CONFIG.separator,
    };
  } catch (error) {
    throw new Error(`Failed to load config file: ${error.message}`);
  }
}

/**
 * Get default configuration.
 *
 * @returns {Object} Default configuration.
 */
export function getDefaultConfig() {
  return { ...DEFAULT_CONFIG };
}