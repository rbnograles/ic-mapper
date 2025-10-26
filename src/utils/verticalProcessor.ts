export async function loadVerticals(floor: string) {
  const module = await import(`@/Data/AyalaMalls/connectors/Vecticals.json`);
  return module.default || module;
}

// 4. Helper to find vertical connector between floors
// utils/verticalProcessor.ts (replace findVerticalConnector)
export function findVerticalConnector(
  verticalsData: any,
  fromFloor: string,
  toFloor: string,
  viaTypeOrId: string // could be "Stairs" or an id like "Ground_bldg_38" or "stairs_38_39"
) {
  if (!verticalsData || !Array.isArray(verticalsData.verticals)) return null;

  const candidates = verticalsData.verticals;

  const normalize = (v: any) => ({
    id: v.id ?? `${v.from}_${v.to}_${v.type}`,
    type: v.type ?? '',
    fromId: v.from ?? '',
    toId: v.to ?? '',
    fromLabel: v.labelFrom ?? v.type ?? v.from ?? '',
    toLabel: v.labelTo ?? v.type ?? v.to ?? '',
    raw: v,
  });

  // 1) Exact id match (via passed is connector id)
  const byId = candidates
    .map(normalize)
    .find(
      (c: { id: string; fromId: string; toId: string }) =>
        c.id === viaTypeOrId || c.fromId === viaTypeOrId || c.toId === viaTypeOrId
    );
  if (byId) return byId;

  // 2) Exact floor pairing + type match (from -> to)
  const byFloorAndType = candidates
    .map(normalize)
    .find((c: { fromId: string | string[]; toId: string | string[]; type: string }) => {
      const floorsMatch =
        (c.fromId.includes(fromFloor) && c.toId.includes(toFloor)) ||
        (c.fromId.includes(toFloor) && c.toId.includes(fromFloor));
      const typeMatch = c.type && viaTypeOrId && c.type.toLowerCase() === viaTypeOrId.toLowerCase();
      return floorsMatch && typeMatch;
    });
  if (byFloorAndType) return byFloorAndType;

  // 3) Type-only match (first match of requested type)
  const byTypeOnly = candidates
    .map(normalize)
    .find(
      (c: { type: string }) =>
        c.type && viaTypeOrId && c.type.toLowerCase() === viaTypeOrId.toLowerCase()
    );
  if (byTypeOnly) return byTypeOnly;

  // 4) Fall back: if only floor pairing exists (no type given)
  const byFloorOnly = candidates
    .map(normalize)
    .find(
      (c: { fromId: string | string[]; toId: string | string[] }) =>
        (c.fromId.includes(fromFloor) && c.toId.includes(toFloor)) ||
        (c.fromId.includes(toFloor) && c.toId.includes(fromFloor))
    );
  if (byFloorOnly) return byFloorOnly;

  // No match
  return null;
}

// Helper — return true when stepFloor (raw label) corresponds to selectedKey
export const floorMatches = (stepFloor: string | undefined | null, selectedKey: string) => {
  if (!stepFloor || !selectedKey) return false;

  const s = String(stepFloor).toLowerCase();
  const k = String(selectedKey).toLowerCase();

  // exact match (covers if you eventually normalize)
  if (s === k) return true;

  // contains (e.g. "ayala malls second floor" contains "second")
  if (s.includes(k) || k.includes(s)) return true;

  // match by clean name fragments (strip "floor" / numeric suffixes)
  const cleanedS = s.replace(/floor/g, '').replace(/\s+/g, ' ').trim();
  const cleanedK = k.replace(/floor/g, '').replace(/\s+/g, ' ').trim();
  if (cleanedS.includes(cleanedK) || cleanedK.includes(cleanedS)) return true;

  return false;
}
