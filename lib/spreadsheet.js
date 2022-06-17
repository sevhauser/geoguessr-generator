import { promises as fs } from 'fs';
import { parse, stringify } from 'csv/sync';

export async function readCoordinates(path) {
  const content = await fs.readFile(path);
  return parse(content, {
    skip_empty_lines: true,
  }).map(([lat, lng]) => ({ lat, lng }));
}

export async function writeCoordinates(path, coordinates) {
  const content = stringify(
    coordinates.map(({ lat, lng }) => [lat, lng]),
    { header: false },
  );
  await fs.writeFile(path, content);
}
