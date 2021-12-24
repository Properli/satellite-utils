/* eslint-disable func-names */
/* eslint-disable prefer-arrow-callback */
import test from 'ava';
import { randomBytes } from 'crypto';
import { testables } from '../src/makeHashes';

const { calculateHash, calculateCreatorIdAndLicenseHash, calculateWatermark } = testables;

test('calculate salt should calculate the same salt for the same inputs twice', async (t) => {
  const creatorIdBuffer = Buffer.from(randomBytes(128));
  const licenseBuffer = Buffer.from('GPL 3.0');
  t.is(
    (await calculateCreatorIdAndLicenseHash(creatorIdBuffer, licenseBuffer)).toString('hex'),
    (await calculateCreatorIdAndLicenseHash(creatorIdBuffer, licenseBuffer)).toString('hex'),
  );
});

test('calculate hash should calculate the same hash for the same inputs twice', async (t) => {
  const creatorIdBuffer = Buffer.from(randomBytes(128));
  const licenseBuffer = Buffer.from(randomBytes(256));
  const first = await calculateHash(128, creatorIdBuffer, licenseBuffer);
  const second = await calculateHash(128, creatorIdBuffer, licenseBuffer);
  t.is(first.toString('hex'), second.toString('hex'));
});

test('calculate watermark should be able to take two (large) inputs', async (t) => {
  const saltBuffer = Buffer.from(randomBytes(128));
  const blobBuffer = Buffer.from(randomBytes(2 * (10 ** 9))); // 2GB -> can take up to 2**32-1
  const first = await calculateWatermark(blobBuffer, saltBuffer);
  const second = await calculateWatermark(blobBuffer, saltBuffer);
  t.is(first.toString('hex'), second.toString('hex'));
});

test('calculate watermark should be able to take three (large) inputs', async (t) => {
  const creatorIdBuffer = Buffer.from(randomBytes(128));
  const licenseBuffer = Buffer.from(randomBytes(256));
  const blobBuffer = await Buffer.from(randomBytes(2 * (10 ** 9)));
  const first = await calculateWatermark(blobBuffer, creatorIdBuffer, licenseBuffer);
  const second = await calculateWatermark(blobBuffer, creatorIdBuffer, licenseBuffer);
  t.is(first.toString('hex'), second.toString('hex'));
});
