export class Normalizer {
  private static floors: any[];
  constructor(floors: any) {
    Normalizer.floors = floors;
  }

  public normalizeFloorName(floorIdentifier: string): string {
    const floor = Normalizer.floors.find(
      (f: any) =>
        f.key === floorIdentifier ||
        f.name.toLowerCase() === floorIdentifier.toLowerCase() ||
        f.aliases.some((a: any) => a.toLowerCase() === floorIdentifier.toLowerCase())
    );
    return floor ? floor.name : floorIdentifier;
  }

  public createRouteKey(floor: string, from: string, to: string): string {
    const normalizedFloor = this.normalizeFloorName(floor);
    return `${normalizedFloor}:${from}:${to}`;
  }
}
