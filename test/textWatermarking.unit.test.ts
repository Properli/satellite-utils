import test from 'ava';
import mock from 'mock-fs';
import fs from 'fs';
import _ from 'lodash';
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

test('rotateWatermarkToStartAndPurgeMarker should not rotate a correct watermark and return it without start marker', (t) => {
  const watermarkWithMarker: string[] = _.fill(Array(41), '1').concat(_.fill(Array(40), '0'));
  const watermarkWithoutMarker: string[] = rotateWatermarkToStartAndPurgeMarker(watermarkWithMarker);
  t.deepEqual(watermarkWithoutMarker, _.fill(Array(40), '0'));
});

test('rotateWatermarkToStartAndPurgeMarker should error if the marker is too short', (t) => {
  const watermarkWithMarker: string[] = _.fill(Array(40), '1').concat(_.fill(Array(40), '0'));
  t.throws(
    () => rotateWatermarkToStartAndPurgeMarker(watermarkWithMarker),
    { message: 'Watermark length was 80 but should have been 81.' },
  );
});

test('rotateWatermarkToStartAndPurgeMarker should error if the supplied watermark is shorter than 81', (t) => {
  const watermarkWithMarker: string[] = _.fill(Array(41), '1').concat(_.fill(Array(39), '0'));
  t.throws(
    () => rotateWatermarkToStartAndPurgeMarker(watermarkWithMarker),
    { message: 'Watermark length was 80 but should have been 81.' },
  );
});

test('rotateWatermarkToStartAndPurgeMarker should error if the total length is ok but the marker is incorrect', (t) => {
  const watermarkWithMarker: string[] = _.fill(Array(40), '1').concat(_.fill(Array(41), '0'));
  t.throws(
    () => rotateWatermarkToStartAndPurgeMarker(watermarkWithMarker),
    { message: 'No watermark found' },
  );
});

test('rotateWatermarkToStartAndPurgeMarker will take any watermark length with a correct marker no matter the length but will always return 40 bits', (t) => {
  const watermarkWithMarker: string[] = _.fill(Array(41), '1').concat(_.fill(Array(42069), '0'));
  const watermarkWithoutMarker: string[] = rotateWatermarkToStartAndPurgeMarker(watermarkWithMarker);
  t.is(watermarkWithoutMarker.length, 40);
});

test('rotateWatermarkToStartAndPurgeMarker returns correct watermark with marker at the start', (t) => {
  const watermarkWithMarker: string[] = _.fill(Array(41), '1').concat(_.fill(Array(40), '0'));
  const watermarkWithoutMarker: string[] = rotateWatermarkToStartAndPurgeMarker(watermarkWithMarker);
  t.deepEqual(watermarkWithoutMarker, _.fill(Array(40), '0'));
});

test('rotateWatermarkToStartAndPurgeMarker returns correct watermark with marker in the middle', (t) => {
  const watermarkWithMarker: string[] = _.fill(Array(20), '0').concat(_.fill(Array(41), '1')).concat(_.fill(Array(20), '0'));
  const watermarkWithoutMarker: string[] = rotateWatermarkToStartAndPurgeMarker(watermarkWithMarker);
  t.deepEqual(watermarkWithoutMarker, _.fill(Array(40), '0'));
});

test('rotateWatermarkToStartAndPurgeMarker returns correct watermark with marker at the end', (t) => {
  const watermarkWithMarker: string[] = _.fill(Array(40), '0').concat(_.fill(Array(41), '1'));
  const watermarkWithoutMarker: string[] = rotateWatermarkToStartAndPurgeMarker(watermarkWithMarker);
  t.deepEqual(watermarkWithoutMarker, _.fill(Array(40), '0'));
});

test('rotateWatermarkToStartAndPurgeMarker returns correct watermark with marker broken between start and end', (t) => {
  const watermarkWithMarker: string[] = _.fill(Array(20), '1').concat(_.fill(Array(40), '0')).concat(_.fill(Array(21), '1'));
  const watermarkWithoutMarker: string[] = rotateWatermarkToStartAndPurgeMarker(watermarkWithMarker);
  t.deepEqual(watermarkWithoutMarker, _.fill(Array(40), '0'));
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
  // normalization info: http://www.unicode.org/reports/tr15/#Norm_Forms
  t.is(originalContent.normalize('NFKD'), watermarkedContent.normalize('NFKD'));
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

test.serial('Extraction of watermark', async (t) => {
  mock({
    'original.txt': 'Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Duis autem vel eum iriure dolor in hendrerit in vulputate velit esse molestie consequat, vel illum dolore eu feugiat nulla facilisis at vero eros et accumsan et iusto odio dignissim qui blandit praesent luptatum zzril delenit augue duis dolore te feugait nulla facilisi. Lorem ipsum dolor sit amet,',
    'watermarked.txt': '',
  });
  const watermark = await calculateWatermark(Buffer.from('Some Info'), Buffer.from('Some Salt'));
  await embedWatermark(`${process.cwd()}/original.txt`, watermark, `${process.cwd()}/watermarked.txt`);
  const extractedWatermark = await extractWatermark(`${process.cwd()}/watermarked.txt`);
  t.is(watermark.toString('hex'), extractedWatermark);
  mock.restore();
});
