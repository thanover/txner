import { parse } from 'csv-parse';
import fs from 'fs'
import { finished } from 'stream/promises';

export async function loadCSV(path: string) {
  let records: unknown[] = [];
  const parser = fs
    .createReadStream(path)
    .pipe(parse({
      columns: true
    }));
  parser.on('readable', function () {
    let record: unknown
    while ((record = parser.read()) !== null) {
      // Work with each record
      records.push(record);
    }
  });
  await finished(parser);
  return records;
};