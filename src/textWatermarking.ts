/* eslint-disable quote-props */
/**
 * TODO: attribute Rizzo, Bertini, and Montesi as authors of the watermarking technique
 */

import { createReadStream, createWriteStream } from 'fs';
import { Transform } from 'stream';
import * as _ from 'lodash';

/**
 * Used to initialize the beginning of a watermark. Must be watermark.lengthInBits+1.
 */
const watermarkBinSeparator: string[] = _.fill(Array(41), '1');

const confusableCharacters = [
  '2d', // -
  '3b', // ;
  '43', // C
  '44', // D
  '4b', // k
  '4c', // L
  '4d', // M
  '56', // V
  '58', // X
  '63', // c
  '64', // d
  '69', // i
  '6a', // j
  '6c', // l
  '76', // v
  '78', // x
];

const reverseConfusableCharacters: string[] = [
  '2010', // -
  '037e', // ;
  '216d', // C
  '216e', // D
  '212a', // k
  '216c', // L
  '216f', // M
  '2164', // V
  '2169', // X
  '217d', // c
  '217e', // d
  '2170', // i
  '0458', // j
  '217c', // l
  '2174', // v
  '2179', // x
];

const confusableWhitespaces = [
  '0020', // space
  '2000', // en quad
  '2004', // three-per-em space
  '2005', // four-per-em space
  '2008', // punctuation space
  '2009', // thin space
  '202f', // narrow no-brak space
  '205f', // medium mathematical space
];

const confusables = confusableCharacters.concat(confusableWhitespaces);

const confusableCharacterMapping: { [key: string]: string; } = {
  '2d': '2010', // -
  '3b': '037e', // ;
  '43': '216d', // C
  '44': '216e', // D
  '4b': '212a', // k
  '4c': '216c', // L
  '4d': '216f', // M
  '56': '2164', // V
  '58': '2169', // X
  '63': '217d', // c
  '64': '217e', // d
  '69': '2170', // i
  '6a': '0458', // j
  '6c': '217c', // l
  '76': '2174', // v
  '78': '2179', // x
};

const confusableWhiteSpaceMapping: { [key: string]: string; } = {
  '000': '0020', // space
  '001': '2000', // en quad
  '010': '2004', // three-per-em space
  '011': '2005', // four-per-em space
  '100': '2008', // punctuation space
  '101': '2009', // thin space
  '110': '202f', // narrow no-brak space
  '111': '205f', // medium mathematical space
};

const reverseConfusableWhiteSpaceMapping: { [key: string]: string; } = {
  '0020': '000', // space
  '2000': '001', // en quad
  '2004': '010', // three-per-em space
  '2005': '011', // four-per-em space
  '2008': '100', // punctuation space
  '2009': '101', // thin space
  '202f': '110', // narrow no-brak space
  '205f': '111', // medium mathematical space
};

/**
 * http://stackoverflow.com/questions/45053624/ddg#45054052
 */
function hexToBin(hex: string): string {
  return (parseInt(hex, 16).toString(2)).padStart(8, '0');
}

/**
 * Modified version of Rizzo et al.'s fine grain watermarking.
 * This version clearly indicates the beginning of a repeatable watermark by starting every iteration with watermark.lengthInBits+1 number of '1's.
 * In the custom case of 40 Bit of embeddable information, the watermark is actually 81 Bits long.
 * @param textFilePath
 * @param watermark
 */
export function embedWatermark(textFilePath: string, watermark: Buffer) {
  const readStream = createReadStream(
    textFilePath, {
      highWaterMark: 1,
      encoding: 'hex',
    },
  );
  const watermarkedFilePath = `${textFilePath.split('.')[0]}-watermarked.${textFilePath.split('.')[1]}`;
  const writeStream = createWriteStream(
    watermarkedFilePath, {
      highWaterMark: 1,
      encoding: 'utf-8',
    },
  );
  const watermarkBin = watermarkBinSeparator.concat(hexToBin(watermark.toString('hex')).split(''));
  let watermarkPointer = 0;
  let modifiedChunk;

  const exchangeConfusables = new Transform({
    transform(chunk: string, encoding, callback) {
      modifiedChunk = chunk;
      if (confusables.includes(chunk)) {
        if (confusableWhitespaces.includes(chunk)) {
          let whitespaceBits: string = '';
          for (
            let i = watermarkPointer;
            i < ((watermarkPointer + 3) % watermarkBin.length);
            (i + 1) % watermarkBin.length
          ) {
            whitespaceBits = whitespaceBits.concat(watermarkBin[i]);
          }
          modifiedChunk = confusableWhiteSpaceMapping[whitespaceBits];
          watermarkPointer = (watermarkPointer + 3) % watermarkBin.length;
        } else if (watermarkBin[watermarkPointer] === '1') {
          modifiedChunk = confusableCharacterMapping[chunk];
        } else {
          watermarkPointer = (watermarkPointer + 1) % watermarkBin.length;
        }
      }
      this.push(modifiedChunk);
      callback();
    },
  });

  readStream.pipe(exchangeConfusables).pipe(writeStream);
}

function rotateWatermarkToStartAndPurgeMarker(watermarkArray: string[]): string[] {
  let markerStart: number = 0;
  let markerEnd: number = markerStart + watermarkBinSeparator.length;
  let markerFound: boolean = false;
  // Locate Marker
  while (!markerFound) {
    if (watermarkArray.slice(markerStart, markerEnd).every((bit) => bit === '1')) {
      markerFound = true;
    } else {
      markerStart = (markerStart + 1) % watermarkArray.length;
      if (markerStart === 0) throw new Error('No watermark found');
      markerEnd = (markerEnd + 1) % watermarkArray.length;
    }
  }
  // re-establish bit-sequence order
  if (markerStart === 0) { // marker is at the beginning of bit sequence, e.g. ----||||
    return watermarkArray.slice(markerEnd);
  }
  if (markerEnd < markerStart) { // marker wraps around and frames the bit sequence, e.g. --||||--
    return watermarkArray.slice(markerEnd, markerStart);
  }
  if (markerStart !== 0 && markerStart < markerEnd) { // marker is framed by bit sequence, e.g. ||----||
    return watermarkArray.slice(markerEnd).concat(watermarkArray.slice(0, markerStart));
  }
  if (markerEnd === watermarkArray.length - 1) { // marker is at the end of bit sequence, e.g. ||||----
    return watermarkArray.slice(0, markerStart);
  }
  // else I forgot a case...
  throw new Error('Marker has unexpected position. Pls file an issue.');
}

/**
 *
 * @param textFilePath
 */
export function extractWatermark(textFilePath: string): number {
  const readStream = createReadStream(
    textFilePath, {
      highWaterMark: 1,
      encoding: 'hex',
    },
  );
  const watermarkArray: string[] = [];
  let watermark: string = '';

  readStream
    .on('data', (chunk: string) => {
      if (watermarkArray.length <= 81) {
        if (confusableWhitespaces.includes(chunk)) {
          watermarkArray.push(reverseConfusableWhiteSpaceMapping[chunk]);
        } else if (confusableCharacters.includes(chunk)) {
          watermarkArray.push('0');
        } else if (reverseConfusableCharacters.includes(chunk)) {
          watermarkArray.push('1');
        }
      } else {
        readStream.destroy();
      }
    })
    .on('close', () => {
      [watermark] = rotateWatermarkToStartAndPurgeMarker(watermarkArray).flat(Infinity);
    });
  return parseInt(watermark, 2);
}
