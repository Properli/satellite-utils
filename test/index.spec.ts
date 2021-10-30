import chai from 'chai';
import { randomBytes } from 'crypto';
import { calculateWatermark } from '../src/index';
import 'mocha';

describe('calculate watermark', () => {
  it('should calculate the same watermark for the same inputs twice', async () => {
    const creatorIdBuffer = Buffer.from(randomBytes(128));
    const licenseBuffer = Buffer.from('GPL 3.0');
    chai.expect((await calculateWatermark(creatorIdBuffer, licenseBuffer)).toString('hex'))
      .to.be.equal((await calculateWatermark(creatorIdBuffer, licenseBuffer)).toString('hex'));
  });
});
