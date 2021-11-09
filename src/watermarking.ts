import * as argon2 from 'argon2';
import Buffer from 'buffer';

export async function calculateSalt(creatorId: Buffer, license: Buffer): Promise<Buffer> {
  const hashOptions: argon2.Options & { raw: true } = {
    hashLength: 128,
    type: argon2.argon2id,
    salt: creatorId,
    saltLength: creatorId.length,
    raw: true,
  };
  return argon2.hash(license, hashOptions);
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
    const hashOptions: argon2.Options & { raw: true; } = {
      hashLength: 128,
      type: argon2.argon2id,
      salt,
      saltLength: salt.length,
      raw: true,
    };
    return argon2.hash(blob, hashOptions);
  }
  if (args.length === 3) {
    const blob: Buffer = args[0];
    const creatorId: Buffer = args[1];
    const license: Buffer = args[2];
    const salt = await calculateSalt(creatorId, license);
    const hashOptions: argon2.Options & { raw: true } = {
      hashLength: 128,
      type: argon2.argon2id,
      salt,
      saltLength: salt.length,
      raw: true,
    };
    return argon2.hash(blob, hashOptions);
  }
  Error('Wrong number of arguments. Expect two or three.');
  return new Promise(() => {});
}
