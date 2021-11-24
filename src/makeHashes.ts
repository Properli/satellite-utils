import * as argon2 from 'argon2';
import Buffer from 'buffer';

// eslint-disable-next-line max-len
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

export async function calculateLongAddress(longSalt: Buffer, creatorIdAndLicenseHash: Buffer): Promise<Buffer>;

export async function calculateLongAddress(longSalt: Buffer, creatorId: Buffer, license: Buffer): Promise<Buffer>;

export async function calculateLongAddress(...args: any[]): Promise<Buffer> {
  if (args.length === 2) {
    return calculateHash(256, args[0], args[1]);
  }
  if (args.length === 3) {
    return calculateCreatorIdAndLicenseHash(args[1], args[2]).then((hash: Buffer) => calculateHash(256, args[0], hash));
  }
  return new Promise<Buffer>(() => {});
}

export async function calculateWatermark(
  blob: Buffer,
  salt: Buffer
): Promise<Buffer>;

export async function calculateWatermark(
  blob: Buffer,
  creatorId: Buffer,
  license: Buffer
): Promise<Buffer>;

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

export const testables = {
  calculateCreatorIdAndLicenseHash,
  calculateWatermark,
};
