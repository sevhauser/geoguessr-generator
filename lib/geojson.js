import { promises as fs } from 'fs';

export async function readGeoJson(path) {
    const content = await fs.readFile(path);
    const parsed = JSON.parse(content.toString());
    if (!parsed || !parsed.elements) {
        return [];
    }

    const elements = parsed.elements;
    // Geojson results can include nodes, ways, or relations
    // Relations we do not have a way to handle, yet so we'll skip them
    // Ways do not have a location but a list of nodes, of which we only need one to avoid duplicates.

    const elementMap = new Map();
    const selectIds = [];
    elements.forEach((el, i) => {
        elementMap.set(el.id, i);
        if (el.type === 'node') {
            selectIds.push(el.id);
        } else if (el.type === 'way' && el.nodes.length > 0) {
            selectIds.push(el.nodes[0]);
        }
    });
    // Using a set filters out duplicate entries
    return [...new Set(selectIds)].map((id) => {
        const index = elementMap.get(id);
        if (isNaN(index)) {
            return null;
        }
        const { lat, lon } = elements[index];
        return ({ lat, lng: lon });
    }).filter((res) => !!res);
}
