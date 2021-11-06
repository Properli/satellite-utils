/* eslint-disable func-names */
/* eslint-disable prefer-arrow-callback */
import chai from 'chai';
import { randomBytes } from 'crypto';
import { calculateSalt, calculateWatermark } from '../src/index';
import 'mocha';

describe('calculate salt', () => {
  it('should calculate the same salt for the same inputs twice', async () => {
    const creatorIdBuffer = Buffer.from(randomBytes(128));
    const licenseBuffer = Buffer.from('GPL 3.0');
    chai.expect((await calculateSalt(creatorIdBuffer, licenseBuffer)).toString('hex'))
      .to.be.equal((await calculateSalt(creatorIdBuffer, licenseBuffer)).toString('hex'));
  });
});

describe('calculate watermark', function () {
  this.timeout(15000);
  it('should calculate the same watermark for the same inputs twice', async () => {
    const creatorIdBuffer = Buffer.from(randomBytes(128));
    const licenseBuffer = Buffer.from(randomBytes(256));
    chai.expect((await calculateWatermark(creatorIdBuffer, licenseBuffer)).toString('hex'))
      .to.be.equal((await calculateWatermark(creatorIdBuffer, licenseBuffer)).toString('hex'));
  });
  it('should be able to take two (large) inputs', async () => {
    const saltBuffer = Buffer.from(randomBytes(128));
    const blobBuffer = Buffer.from(randomBytes(2 * (10 ** 9))); // 2GB -> can take up to 2**32-1
    const first = await calculateWatermark(blobBuffer, saltBuffer);
    const second = await calculateWatermark(blobBuffer, saltBuffer);
    chai.expect(first.toString('hex')).to.be.equal(second.toString('hex'));
  });
  it('should be able to take three (large) inputs', async () => {
    const creatorIdBuffer = Buffer.from(randomBytes(128));
    const licenseBuffer = Buffer.from(randomBytes(256));
    const blobBuffer = await Buffer.from(randomBytes(2 * (10 ** 9)));
    const first = await calculateWatermark(blobBuffer, creatorIdBuffer, licenseBuffer);
    const second = await calculateWatermark(blobBuffer, creatorIdBuffer, licenseBuffer);
    chai.expect(first.toString('hex')).to.be.equal(second.toString('hex'));
  });
});
