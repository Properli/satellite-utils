import * as argon2 from 'argon2';
import Buffer from 'buffer';

export async function calculateWatermark(creatorId: Buffer, license: Buffer): Promise<Buffer> {
  const hashOptions: argon2.Options & { raw: true } = {
    hashLength: 64,
    type: argon2.argon2id,
    salt: creatorId,
    saltLength: creatorId.length,
    raw: true,
  };
  return argon2.hash(license, hashOptions);
}

export async function calculateContractId(
  blob: Buffer,
  watermark: Buffer
): Promise<Buffer>;

export async function calculateContractId(
  blob: Buffer,
  creatorId: Buffer,
  license: Buffer
): Promise<Buffer>;

export async function calculateContractId(...args: any[]): Promise<Buffer> {
  let contractId: Promise<Buffer>;
  switch (args.length) {
    case 2:
      contractId = (
        blob: Buffer = args[0],
        watermark: Buffer = args[1],
      ): Promise<Buffer> => {
        const hashOptions: argon2.Options & { raw: true; } = {
          hashLength: 128,
          type: argon2.argon2id,
          salt: watermark,
          saltLength: watermark.length,
          raw: true,
        };
        return argon2.hash(blob, hashOptions);
      };
      break;
    case 3:
      contractId = (async (
        blob: Buffer = args[0],
        creatorId: Buffer = args[1],
        license: Buffer = args[2],
      ) => {
        const watermark = await calculateWatermark(creatorId, license);
        const hashOptions: argon2.Options & { raw: true } = {
          hashLength: 128,
          type: argon2.argon2id,
          salt: watermark,
          saltLength: watermark.length,
          raw: true,
        };
        return argon2.hash(blob, hashOptions);
      });
      break;
    default:
      Error('Wrong number of arguments. Expect two or three.');
      break;
  }
  return contractId;
}
