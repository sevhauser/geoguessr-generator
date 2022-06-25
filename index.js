import 'dotenv/config';
import path from 'path';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { readGeoJson } from './lib/geojson.js';
import { readCoordinates, writeCoordinates } from './lib/spreadsheet.js';
import { fetchClosestStreetView } from './lib/streetview.js';

const argv = yargs(hideBin(process.argv))
  .usage('Usage: $0 --type geojson --source [source-file-path] --out [result-csv-path]')
  .scriptName('geoguessr-generator')
  .option('source', {
    alias: 's',
    describe: 'The source file containing coordinates',
    nargs: 1,
  })
  .option('out', {
    alias: 'o',
    describe: 'The path to the output CSV-file',
    nargs: 1,
  })
  .option('type', {
    alias: 't',
    describe: 'The source file type',
    nargs: 1,
    choices: ['csv', 'geojson'],
  })
  .option('radius', {
    alias: 'r',
    describe: 'The radius the locations should be searched within (in meters)',
    nargs: 1,
  })
  .default({ r: 50 })
  .demandOption(['s', 'o', 't']).argv;

function getReader(type) {
  switch (type) {
    case 'geojson':
      return readGeoJson;
    case 'csv':
      return readCoordinates;
    default:
      throw new Error(`Unknown reader type: ${type}`);
  }
}

async function runInBatch(values, fn, cb, { batchSize = 50, onProgress = () => {} } = {}) {
  const remaining = [...values];
  do {
    onProgress(Math.min(remaining.length, batchSize), remaining.length);
    const batch = remaining.splice(0, batchSize).map((val) => fn(val));
    const result = await Promise.allSettled(batch);
    cb(result.map((r) => r.value));
  } while (remaining.length > 0);
}

async function run(sourceFile, targetFile, radius, type) {
  const sourcePath = path.resolve(sourceFile);
  const targetPath = path.resolve(targetFile);

  const reader = getReader(type);

  const records = await reader(sourcePath);
  console.log(`Matching ${records.length} locations with radius ${radius}`);
  const results = [];
  await runInBatch(
    records,
    async (record) => {
      const location = await fetchClosestStreetView(record, radius);
      if (location) {
        return location;
      }
      console.log('No match found', record);
      return null;
    },
    (batch) => results.push(...batch.filter((res) => !!res)),
    {
      onProgress: (size, remaining) => console.log(`Processing ${size} of remaining ${remaining}`),
    },
  );

  console.log(`${records.length} locations, ${results.length} matches, ${records.length - results.length} failures`);
  await writeCoordinates(targetPath, results);
  console.log(`Wrote result to ${targetPath}`);
}

const { source, out, radius, type } = argv;
run(source, out, radius, type);
