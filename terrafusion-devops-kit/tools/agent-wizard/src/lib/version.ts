/**
 * Version information for the TerraFusion Agent Control CLI
 */

export class Version {
  /**
   * Current version of the CLI
   */
  static readonly current = '1.0.0';

  /**
   * Minimum compatible agent manifest version
   */
  static readonly minManifestVersion = '1.0.0';

  /**
   * Check if the given version is compatible with the current version
   * @param version Version to check
   * @returns True if compatible
   */
  static isCompatible(version: string): boolean {
    const [major, minor] = version.split('.').map(Number);
    const [currentMajor, currentMinor] = Version.current.split('.').map(Number);

    // Major version must match
    if (major !== currentMajor) {
      return false;
    }

    // Minor version must be less than or equal to current
    return minor <= currentMinor;
  }

  /**
   * Check if a newer version is available
   * @returns Promise resolving to version info
   */
  static async checkForUpdate(): Promise<{ hasUpdate: boolean; latest: string; current: string }> {
    try {
      // In a real implementation, this would check a version endpoint
      // For the prototype, we'll just simulate no update
      return {
        hasUpdate: false,
        latest: Version.current,
        current: Version.current,
      };
    } catch (error) {
      // Failed to check, assume no update
      return {
        hasUpdate: false,
        latest: Version.current,
        current: Version.current,
      };
    }
  }
}