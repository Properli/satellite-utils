import * as argon2 from 'argon2';
import Buffer from 'buffer';

/**
 * Calculate 128 byte hash of creatorId as salt and license as main input
 * @param creatorId Buffer that holds a creatorId
 * @param license Buffer that holds the license
 * @returns Buffer Promise that resolves with a 128 byte long hash
 */
export async function calculateCreatorIdAndLicenseHash(creatorId: Buffer, license: Buffer): Promise<Buffer> {
  const hashOptions: argon2.Options & { raw: true } = {
    hashLength: 128,
    type: argon2.argon2id,
    salt: creatorId,
    saltLength: creatorId.length,
    raw: true,
  };
  return argon2.hash(license, hashOptions);
}

/**
 * Private convenience function that calculates argon2 hashes of varying length from a salt and main input
 * @param hashLength the length in bytes that the returned hash will have
 * @param salt the hash's salt
 * @param input the main input
 * @returns argon2 hash of hashLength length
 */
async function calculateHash(hashLength: number, salt: Buffer, input: Buffer): Promise<Buffer> {
  const hashOptions: argon2.Options & { raw: true; } = {
    hashLength,
    type: argon2.argon2id,
    salt,
    saltLength: salt.length,
    raw: true,
  };
  return argon2.hash(input, hashOptions);
}

/**
 * Calculates a watermark that can be used to register digital goods on properli's LawCompliersAgreement smart contract
 * @param blob Buffer that has size <2^(32-1)
 * @param salt Buffer that has size <2^(32-1)
 */
export async function calculateWatermark(
  blob: Buffer,
  salt: Buffer
): Promise<Buffer>;

/**
 * Calculates a watermark that can be used to register digital goods on properli's LawCompliersAgreement smart contract
 * @param blob Buffer that has size <2^(32-1)
 * @param creatorId a unique identifier for the issuing creator of the digital good
 * @param license the license under which the digital good should be published
 */
export async function calculateWatermark(
  blob: Buffer,
  creatorId: Buffer,
  license: Buffer
): Promise<Buffer>;

/**
 * Calculates a watermark that can be used to register digital goods on properli's LawCompliersAgreement smart contract.
 * @returns Promise Buffer that resolves with a hash that can be used watermark a digital good and register it on properli's LawCompliersAgreement smart contract.
 */
export async function calculateWatermark(...args: any[]): Promise<Buffer> {
  if (args.length === 2) {
    const blob: Buffer = args[0];
    const salt: Buffer = args[1];
    return calculateHash(5, salt, blob);
  }
  if (args.length === 3) {
    const blob: Buffer = args[0];
    const creatorId: Buffer = args[1];
    const license: Buffer = args[2];
    const salt = await calculateCreatorIdAndLicenseHash(creatorId, license);
    return calculateHash(5, salt, blob);
  }
  return new Promise(() => {});
}

/**
 * export object that is used for testing only
 */
export const testables = {
  calculateCreatorIdAndLicenseHash,
  calculateHash,
  calculateWatermark,
};
