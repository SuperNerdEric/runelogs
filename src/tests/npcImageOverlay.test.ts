import { describe, expect, it } from "vitest";
import L from "leaflet";
import {
  fitAspectRatioInPixelBox,
  getNpcImageBounds,
} from "../lib/npcImageOverlay";
import { Position, RS_MAP_NATIVE_MAX_ZOOM } from "../utils/Position";

describe("fitAspectRatioInPixelBox", () => {
  it("limits by height when the image is wider than the box", () => {
    expect(fitAspectRatioInPixelBox(100, 100, 2)).toEqual({
      width: 100,
      height: 50,
    });
  });

  it("limits by width when the image is taller than the box", () => {
    expect(fitAspectRatioInPixelBox(100, 100, 0.5)).toEqual({
      width: 50,
      height: 100,
    });
  });

  it("fills the box when the aspect ratio matches", () => {
    expect(fitAspectRatioInPixelBox(120, 80, 1.5)).toEqual({
      width: 120,
      height: 80,
    });
  });

  it("fits wide and tall images inside a square npc tile box", () => {
    const tileSize = 3 * 32;

    expect(fitAspectRatioInPixelBox(tileSize, tileSize, 2)).toEqual({
      width: tileSize,
      height: tileSize / 2,
    });
    expect(fitAspectRatioInPixelBox(tileSize, tileSize, 0.5)).toEqual({
      width: tileSize / 2,
      height: tileSize,
    });
  });
});

describe("getNpcImageBounds", () => {
  function createMap(): { map: L.Map; container: HTMLDivElement } {
    const container = document.createElement("div");
    container.style.width = "800px";
    container.style.height = "600px";
    Object.defineProperty(container, "offsetWidth", {
      configurable: true,
      value: 800,
    });
    Object.defineProperty(container, "offsetHeight", {
      configurable: true,
      value: 600,
    });
    document.body.appendChild(container);

    const map = L.map(container, {
      center: [-79, -137],
      zoom: 10,
      attributionControl: false,
    });
    map.invalidateSize();

    return { map, container };
  }

  it("centers a fitted image inside the npc tile box", () => {
    const { map, container } = createMap();

    const tileBounds = new Position(200, 200, 0)
      .toLeaflet(map, undefined, 2)
      .getBounds();
    const imageBounds = getNpcImageBounds(map, 200, 200, 2, 0.5);

    const zoom = RS_MAP_NATIVE_MAX_ZOOM;
    const tileCenter = map.project(tileBounds.getCenter(), zoom);
    const imageCenter = map.project(imageBounds.getCenter(), zoom);

    expect(imageCenter.x).toBeCloseTo(tileCenter.x, 5);
    expect(imageCenter.y).toBeCloseTo(tileCenter.y, 5);

    map.remove();
    container.remove();
  });
});
