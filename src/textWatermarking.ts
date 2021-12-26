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

/**
 * 'Normal' encodings of confusable characters when using utf8
 */
const confusableCharacters = [
  '\u002d', // -
  '\u003b', // ;
  '\u0043', // C
  '\u0044', // D
  '\u004b', // k
  '\u004c', // L
  '\u004d', // M
  '\u0056', // V
  '\u0058', // X
  '\u0063', // c
  '\u0064', // d
  '\u0069', // i
  // '\u006a', // j - omitted as normalizing strings does somehow not cover this confusable. It is likely that it is a confusable but not an equivalent by unicode standards and should therefore be treated with caution. TODO: further investigate
  '\u006c', // l
  '\u0076', // v
  '\u0078', // x
];

/**
 * 'Alternative' encoding of confusable characters
 */
const reverseConfusableCharacters: string[] = [
  '\u2010', // -
  '\u037e', // ;
  '\u216d', // C
  '\u216e', // D
  '\u212a', // k
  '\u216c', // L
  '\u216f', // M
  '\u2164', // V
  '\u2169', // X
  '\u217d', // c
  '\u217e', // d
  '\u2170', // i
  // '\u0458', // j
  '\u217c', // l
  '\u2174', // v
  '\u2179', // x
];

/**
 * All possible encodings of whitespace characters
 */
const confusableWhitespaces = [
  '\u0020', // space
  '\u2000', // en quad
  '\u2004', // three-per-em space
  '\u2005', // four-per-em space
  '\u2008', // punctuation space
  '\u2009', // thin space
  '\u202f', // narrow no-brak space
  '\u205f', // medium mathematical space
];

/**
 * The complete set of confusables: characters + whitespaces
 */
const confusables = confusableCharacters.concat(confusableWhitespaces);

/**
 * Iterable collection of 'normal' characters and their 'alternative' confusables.
 */
const confusableCharacterMapping: { [key: string]: string; } = {
  '\u002d': '\u2010', // -
  '\u003b': '\u037e', // ;
  '\u0043': '\u216d', // C
  '\u0044': '\u216e', // D
  '\u004b': '\u212a', // k
  '\u004c': '\u216c', // L
  '\u004d': '\u216f', // M
  '\u0056': '\u2164', // V
  '\u0058': '\u2169', // X
  '\u0063': '\u217d', // c
  '\u0064': '\u217e', // d
  '\u0069': '\u2170', // i
  // '\u006a': '\u0458', // j
  '\u006c': '\u217c', // l
  '\u0076': '\u2174', // v
  '\u0078': '\u2179', // x
};

/**
 * Iterable collection of the bit representation that is mapped to each confusable whitespace representation
 */
const confusableWhiteSpaceMapping: { [key: string]: string; } = {
  '000': '\u0020', // space
  '001': '\u2000', // en quad
  '010': '\u2004', // three-per-em space
  '011': '\u2005', // four-per-em space
  '100': '\u2008', // punctuation space
  '101': '\u2009', // thin space
  '110': '\u202f', // narrow no-brak space
  '111': '\u205f', // medium mathematical space
};

/**
 * Iterable collection of each whitespace representation and its corresponding bit representation in the watermark
 */
const reverseConfusableWhiteSpaceMapping: { [key: string]: string; } = {
  '\u0020': '000', // space
  '\u2000': '001', // en quad
  '\u2004': '010', // three-per-em space
  '\u2005': '011', // four-per-em space
  '\u2008': '100', // punctuation space
  '\u2009': '101', // thin space
  '\u202f': '110', // narrow no-brak space
  '\u205f': '111', // medium mathematical space
};

/**
 * Transform a string representing a hex number into a string representing its binary equivalent.
 * Taken from here http://stackoverflow.com/questions/45053624/ddg#45054052
 * @param hex hexadecimal number as string
 * @returns binary representation of hex as string
 */
function hexToBin(hex: string): string {
  return (parseInt(hex, 16).toString(2)).padStart(8, '0');
}

/**
 * Modified version of Rizzo et al.'s fine grain watermarking.
 * This version clearly indicates the beginning of a repeatable watermark by starting every iteration with watermark.lengthInBits+1 number of '1's.
 * In the custom case of 40 Bit of embeddable information, the watermark is actually 81 Bits long.
 * More on unicode in javascript here: https://dmitripavlutin.com/what-every-javascript-developer-should-know-about-unicode/
 * @param textFilePath path to utf8-encoded .txt file from which the encodable text should be taken
 * @param watermark Buffer containing the hexadecimal encoded watermark that should be embedded into the text from the textFilePath file
 * @param outputFilePath optional string indicating the name and destination of the textfile with embedded watermark. Defaults to '<textFilePath>-watermarked.txt'.
 * @returns Void Promise that resolves upon the finish of the write procedure
 */
export const embedWatermark = (textFilePath: string, watermark: Buffer, outputFilePath?: string) => new Promise<void>((resolve) => {
  const readStream = createReadStream(
    textFilePath, {
      highWaterMark: 1,
      encoding: 'utf8',
    },
  );
  const watermarkedFilePath = outputFilePath || `${textFilePath.split('.')[0]}-watermarked.${textFilePath.split('.')[1]}`;
  const writeStream = createWriteStream(
    watermarkedFilePath, {
      highWaterMark: 1,
      encoding: 'utf8',
    },
  );
  const watermarkBin = watermarkBinSeparator.concat(hexToBin(watermark.toString('hex')).split(''));
  let watermarkPointer = 0;
  let modifiedChunk;

  const exchangeConfusables = new Transform({
    transform(chunk: Buffer, encoding, callback) {
      modifiedChunk = chunk.toString('utf8');
      if (confusables.includes(modifiedChunk)) {
        if (confusableWhitespaces.includes(modifiedChunk)) {
          let whitespaceBits: string = '';
          for (
            let i = watermarkPointer;
            i < (watermarkPointer + 3);
            i += 1
          ) {
            whitespaceBits = whitespaceBits.concat(watermarkBin[i % watermarkBin.length]);
          }
          modifiedChunk = confusableWhiteSpaceMapping[whitespaceBits];
          watermarkPointer = (watermarkPointer + 3) % watermarkBin.length;
        } else if (watermarkBin[watermarkPointer] === '1') {
          modifiedChunk = confusableCharacterMapping[modifiedChunk];
          watermarkPointer = (watermarkPointer + 1) % watermarkBin.length;
        } else {
          watermarkPointer = (watermarkPointer + 1) % watermarkBin.length;
        }
      }
      this.push(modifiedChunk);
      callback();
    },
  });
  readStream.pipe(exchangeConfusables).pipe(writeStream);
  writeStream.on('finish', resolve);
});

/**
 * What the declaration says: searches for a marker and extracts one complete watermark in correct order.
 * @param watermarkArray string array that can contain an arbitrary amount of watermarks and markers
 * @returns string array that contains a single watermark
 */
function rotateWatermarkToStartAndPurgeMarker(watermarkArray: string[]): string[] {
  const watermarkJoinedArray = watermarkArray.join('').substring(0, 81).split('');
  if (watermarkJoinedArray.length !== 81) throw new Error(`Watermark length was ${watermarkJoinedArray.length} but should have been 81.`);
  let markerStart: number = 0;
  let markerEnd: number = markerStart + watermarkBinSeparator.length;
  let notFullySearched = true;
  while (notFullySearched) {
    if (// marker is at the beginning of bit sequence, e.g. ----||||
      markerStart === 0
      && watermarkJoinedArray.slice(markerStart, markerEnd).every((bit) => bit === '1')
    ) {
      return watermarkJoinedArray.slice(markerEnd);
    }
    if (// marker wraps around and frames the bit sequence, e.g. --||||--
      markerEnd < markerStart
      && watermarkJoinedArray.slice(markerStart).every((bit) => bit === '1')
      && watermarkJoinedArray.slice(0, markerEnd).every((bit) => bit === '1')
    ) {
      return watermarkJoinedArray.slice(markerEnd, markerStart);
    }
    if ( // marker is framed by bit sequence, e.g. ||----||
      markerStart !== 0
      && markerStart < markerEnd
      && watermarkJoinedArray.slice(markerStart, markerEnd).every((bit) => bit === '1')
    ) {
      return watermarkJoinedArray.slice(markerEnd).concat(watermarkJoinedArray.slice(0, markerStart));
    }
    if ( // marker is at the end of bit sequence, e.g. ||||----
      markerEnd === watermarkJoinedArray.length - 1
      && watermarkJoinedArray.slice(markerStart, markerEnd).every((bit) => bit === '1')
    ) {
      return watermarkJoinedArray.slice(0, markerStart);
    }
    markerStart = (markerStart + 1) % watermarkJoinedArray.length;
    markerEnd = (markerEnd + 1) % watermarkJoinedArray.length;
    if (markerStart === 0) notFullySearched = false;
  }
  throw new Error('No watermark found');
}

/**
 * Extracts a watermark as hexadecimal string from a file
 * @param textFilePath file path as string to file from which the watermark should be extracted
 * @returns String Promise that resolves once a watermark could be successfully read from a file or rejects with an error otherwise.
 */
export const extractWatermark = (textFilePath: string) => new Promise<string>((resolve, reject) => {
  const readStream = createReadStream(
    textFilePath, {
      highWaterMark: 1,
      encoding: 'utf-8',
    },
  );
  const watermarkArray: string[] = [];
  let watermark: string = '';

  readStream.on('open', () => {
    readStream
      .on('data', (chunk: string) => {
        const decodedChunk = chunk;
        if (watermarkArray.join('').length <= 81) {
          if (confusableWhitespaces.includes(decodedChunk)) {
            watermarkArray.push(reverseConfusableWhiteSpaceMapping[decodedChunk]);
          } else if (confusableCharacters.includes(decodedChunk)) {
            watermarkArray.push('0');
          } else if (reverseConfusableCharacters.includes(decodedChunk)) {
            watermarkArray.push('1');
          }
        } else {
          readStream.destroy();
        }
      })
      .on('close', () => {
        watermark = rotateWatermarkToStartAndPurgeMarker(watermarkArray).join('');
        resolve(parseInt(watermark, 2).toString(16));
      })
      .once('error', (err) => {
        reject(err);
      });
  });
});

/**
 * all functions from this file exported for testing purposes
 */
export const testables = {
  hexToBin,
  embedWatermark,
  rotateWatermarkToStartAndPurgeMarker,
  extractWatermark,
};
