import chai from 'chai';
import { before } from 'mocha';
import * as tmp from 'tmp';
import fs from 'fs';
import { testables } from '../src/textWatermarking';
import { calculateWatermark } from '../src/makeHashes';

const {
  hexToBin, embedWatermark, rotateWatermarkToStartAndPurgeMarker, extractWatermark,
} = testables;

describe('Transform hexadecimal to binary', () => {
  it('should take a hexadecimal string and return the correct binary string', () => {
    const hex = 'ff00ff';
    const bin = '111111110000000011111111';
    chai.expect(hexToBin(hex)).to.be.equal(bin);
  });
});

describe('Watermark embedding', async () => {
  let original: tmp.FileResult;
  let watermarked: tmp.FileResult;
  let watermark: Buffer;
  it('should not visibly change the text', () => {
    original = tmp.fileSync({ keep: true });
    fs.writeFileSync(original.fd, 'Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Duis autem vel eum iriure dolor in hendrerit in vulputate velit esse molestie consequat, vel illum dolore eu feugiat nulla facilisis at vero eros et accumsan et iusto odio dignissim qui blandit praesent luptatum zzril delenit augue duis dolore te feugait nulla facilisi. Lorem ipsum dolor sit amet,', { encoding: 'utf-8' });
    watermarked = tmp.fileSync({ keep: true });
    calculateWatermark(Buffer.from('Some Info'), Buffer.from('Some Salt')).then((value) => {
      watermark = value;
      embedWatermark(original.name, watermark, watermarked.name);
    });
    const originalContent = fs.readFileSync(original.fd, { encoding: 'utf-8' });
    const watermarkedContent = fs.readFileSync(watermarked.fd, { encoding: 'utf-8' });
    chai.expect(originalContent).to.be.equal(watermarkedContent);
    original.removeCallback();
    watermarked.removeCallback();
  });
  it('should have a different hexadecimal representation', () => {
    original = tmp.fileSync({ keep: true });
    fs.writeFileSync(original.fd, 'Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Duis autem vel eum iriure dolor in hendrerit in vulputate velit esse molestie consequat, vel illum dolore eu feugiat nulla facilisis at vero eros et accumsan et iusto odio dignissim qui blandit praesent luptatum zzril delenit augue duis dolore te feugait nulla facilisi. Lorem ipsum dolor sit amet,', { encoding: 'utf-8' });
    watermarked = tmp.fileSync({ keep: true });
    calculateWatermark(Buffer.from('Some Info'), Buffer.from('Some Salt')).then((value) => {
      watermark = value;
      embedWatermark(original.name, watermark, watermarked.name);
    });
    const originalContent = Buffer.from(fs.readFileSync(original.fd, { encoding: 'utf-8' })).toString('hex');
    const watermarkedContent = Buffer.from(fs.readFileSync(watermarked.fd, { encoding: 'utf-8' })).toString('hex');
    chai.expect(originalContent).to.not.be.equal(watermarkedContent);
    original.removeCallback();
    watermarked.removeCallback();
  });
});

// describe('Rotation of watermark based on marker and purging of marker');

describe('Extraction of watermark', () => {
  let original: tmp.FileResult;
  let watermarked: tmp.FileResult;
  let watermark: Buffer;
  before((done) => {
    original = tmp.fileSync({ keep: true });
    fs.writeFileSync(original.fd, 'Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Duis autem vel eum iriure dolor in hendrerit in vulputate velit esse molestie consequat, vel illum dolore eu feugiat nulla facilisis at vero eros et accumsan et iusto odio dignissim qui blandit praesent luptatum zzril delenit augue duis dolore te feugait nulla facilisi. Lorem ipsum dolor sit amet,', { encoding: 'utf-8' });
    watermarked = tmp.fileSync({ keep: true });
    calculateWatermark(Buffer.from('Some Info'), Buffer.from('Some Salt')).then((value) => {
      watermark = value;
      embedWatermark(original.name, watermark, watermarked.name);
      done();
    });
  });
  after(() => {
    original.removeCallback();
    watermarked.removeCallback();
  });
  it('should extract the embedded watermark', () => {
    const extractedWatermark = extractWatermark(watermarked.name);
    chai.expect(extractedWatermark).to.be.equal(watermark.toString('hex'));
  });
});
