import test from 'ava';
import mock from 'mock-fs';
import fs from 'fs';
import { testables } from '../src/textWatermarking';
import { calculateWatermark } from '../src/makeHashes';

const {
  hexToBin, embedWatermark, rotateWatermarkToStartAndPurgeMarker, extractWatermark,
} = testables;

test('Hexadecimal to binary calculation should take a hexadecimal string and return the correct binary string', (t) => {
  const hex = 'ff00ff';
  const bin = '111111110000000011111111';
  t.is(hexToBin(hex), bin);
});

test.serial('Watermark embedding should make text equal to original with normalization', async (t) => {
  mock({
    'original.txt': 'Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Duis autem vel eum iriure dolor in hendrerit in vulputate velit esse molestie consequat, vel illum dolore eu feugiat nulla facilisis at vero eros et accumsan et iusto odio dignissim qui blandit praesent luptatum zzril delenit augue duis dolore te feugait nulla facilisi. Lorem ipsum dolor sit amet,',
    'watermarked.txt': '',
  });
  const watermark = await calculateWatermark(Buffer.from('Some Info'), Buffer.from('Some Salt'));
  await embedWatermark(`${process.cwd()}/original.txt`, watermark, `${process.cwd()}/watermarked.txt`);
  const originalContent = fs.readFileSync(`${process.cwd()}/original.txt`, { encoding: 'utf-8' });
  const watermarkedContent = fs.readFileSync(`${process.cwd()}/watermarked.txt`, { encoding: 'utf-8' });
  t.is(originalContent.normalize(), watermarkedContent.normalize());
  mock.restore();
});

test.serial('Watermark embedding should make text not equal to original without normalization', async (t) => {
  mock({
    'original.txt': 'Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Duis autem vel eum iriure dolor in hendrerit in vulputate velit esse molestie consequat, vel illum dolore eu feugiat nulla facilisis at vero eros et accumsan et iusto odio dignissim qui blandit praesent luptatum zzril delenit augue duis dolore te feugait nulla facilisi. Lorem ipsum dolor sit amet,',
    'watermarked.txt': '',
  });
  const watermark = await calculateWatermark(Buffer.from('Some Info'), Buffer.from('Some Salt'));
  await embedWatermark(`${process.cwd()}/original.txt`, watermark, `${process.cwd()}/watermarked.txt`);
  const originalContent = fs.readFileSync(`${process.cwd()}/original.txt`, { encoding: 'hex' });
  const watermarkedContent = fs.readFileSync(`${process.cwd()}/watermarked.txt`, { encoding: 'hex' });
  t.not(originalContent, watermarkedContent);
  mock.restore();
});

// describe('Rotation of watermark based on marker and purging of marker');
/*
describe('Extraction of watermark', () => {
  let original: tmp.FileResult;
  let watermarked: tmp.FileResult;
  let watermark: Buffer;
  it('should read the embedded watermark', () => {
    original = tmp.fileSync({ keep: true });
    fs.writeFileSync(original.fd, 'Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Duis autem vel eum iriure dolor in hendrerit in vulputate velit esse molestie consequat, vel illum dolore eu feugiat nulla facilisis at vero eros et accumsan et iusto odio dignissim qui blandit praesent luptatum zzril delenit augue duis dolore te feugait nulla facilisi. Lorem ipsum dolor sit amet,', { encoding: 'utf-8' });
    watermarked = tmp.fileSync({ keep: true });
    return calculateWatermark(Buffer.from('Some Info'), Buffer.from('Some Salt')).then((value) => {
      watermark = value;
      embedWatermark(original.name, watermark, watermarked.name);
      const extractedWatermark = extractWatermark(watermarked.name);
      original.removeCallback();
      watermarked.removeCallback();
      chai.expect(extractedWatermark).to.be.equal(watermark.toString('hex'));
    });
  });
}); */
