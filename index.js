import 'dotenv/config';
import path from 'path';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { readCoordinates, writeCoordinates } from './lib/spreadsheet.js';
import { fetchClosestStreetView } from './lib/streetview.js';

const argv = yargs(hideBin(process.argv))
  .usage('Usage: $0 --source [csv-path] --out [result-csv-path]')
  .alias('s', 'source')
  .nargs('s', 1)
  .describe('s', 'The source file containing coordinates')
  .alias('o', 'out')
  .nargs('o', 1)
  .describe('o', 'The path to the output CSV-file')
  .alias('r', 'radius')
  .nargs('r', 1)
  .describe('r', 'The radius the locations should be searched within')
  .default({ r: 50 })
  .demandOption(['s', 'o']).argv;

async function run(sourceFile, targetFile, radius) {
  const sourcePath = path.resolve(sourceFile);
  const targetPath = path.resolve(targetFile);
  const records = await readCoordinates(sourcePath);
  console.log(`Matching ${records.length} locations`);
  const results = [];
  for (const record of records) {
    const location = await fetchClosestStreetView(record, radius);
    if (location) {
      results.push(location);
    } else {
      console.log('No match found', record);
    }
  }
  console.log(`${records.length} locations, ${results.length} matches, ${records.length - results.length} failures`);
  await writeCoordinates(targetPath, results);
  console.log(`Wrote result to ${targetPath}`);
}

const { source, target, radius } = argv;
run(source, target, radius);
