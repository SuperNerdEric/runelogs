import React, { useEffect, useSyncExternalStore } from "react";
import { Marker, useMap } from "react-leaflet";
import L from "leaflet";
import { Position } from "../../utils/Position";
import { npcIdMap } from "../../lib/npcIdMap";
import { GamePosition } from "./GameState";
import { ReplayCombat } from "./replayCombat";
import {
  areCombatSpritesReady,
  CompositeSprite,
  getHealthBarSprite,
  getHitsplatSprite,
  getHpTextSprite,
  getPercentTextSprite,
  subscribeCombatSpritesReady,
} from "../../lib/combatSprites";

interface CombatOverlayProps {
  playerPositions: { [playerName: string]: GamePosition };
  npcPositions: { [npcKey: string]: GamePosition };
  combat: ReplayCombat;
}

// Combat overlays are UI, not world geometry: rather than ImageOverlays that scale 1:1 with the
// tile grid (unreadably small when zoomed out), they render as Leaflet markers with a divIcon at a
// mostly-fixed on-screen pixel size. A gentle, dampened zoom scale is layered on via a CSS variable
// (see below) so they grow/shrink a little with zoom without the extreme tile-relative scaling.
const HEALTH_BAR_HEIGHT_PX = 15;
// Fixed on-screen bar width (the sprite is stretched to fit), kept independent of the rendered
// height so shortening the bar only trims vertical padding (not width).
const HEALTH_BAR_WIDTH_PX = 50;
const PERCENT_HEIGHT_PX = 15;
const HP_TEXT_HEIGHT_PX = 15;
const HITSPLAT_HEIGHT_PX = 28;
const HITSPLAT_GAP_PX = 2;
const LABEL_GAP_PX = 1;
/** Hitsplats stack in a grid above the entity: at most this many per row, and this many rows. */
const HITSPLATS_PER_ROW = 3;
const HITSPLAT_MAX_ROWS = 3;
/** Boss health bars are rendered this many times wider than regular entity bars. */
const BOSS_BAR_WIDTH_MULTIPLIER = 3;

// Dampened zoom scaling. At REFERENCE_ZOOM the overlays are their base pixel size; each zoom level
// away multiplies size by 2^(±DAMPING). Full tile-relative scaling would be DAMPING = 1 (2x per
// level); DAMPING = 0.5 gives roughly half that, so they scale "a little" without being extreme.
const REFERENCE_ZOOM = 10;
const ZOOM_SCALE_DAMPING = 0.5;
const MIN_COMBAT_SCALE = 0.4;
const MAX_COMBAT_SCALE = 2.5;

function combatScaleForZoom(zoom: number): number {
  const scale = Math.pow(2, (zoom - REFERENCE_ZOOM) * ZOOM_SCALE_DAMPING);
  return Math.max(MIN_COMBAT_SCALE, Math.min(MAX_COMBAT_SCALE, scale));
}

function useCombatSpritesReady(): boolean {
  return useSyncExternalStore(
    subscribeCombatSpritesReady,
    areCombatSpritesReady,
    areCombatSpritesReady,
  );
}

function npcSizeFromKey(npcKey: string): number {
  const npcId = Number(npcKey.split("|")[1]);
  return npcIdMap[npcId]?.size ?? 1;
}

function scaledWidth(sprite: CompositeSprite, heightPx: number): number {
  return Math.round(heightPx * sprite.aspect);
}

function imgTag(sprite: CompositeSprite, heightPx: number, style = ""): string {
  return `<img src="${sprite.url}" style="width:${scaledWidth(sprite, heightPx)}px;height:${heightPx}px;image-rendering:pixelated;display:block;${style}"/>`;
}

interface MarkerItem {
  key: string;
  position: L.LatLng;
  icon: L.DivIcon;
}

const CombatOverlay: React.FC<CombatOverlayProps> = ({
  playerPositions,
  npcPositions,
  combat,
}) => {
  const map = useMap();
  const ready = useCombatSpritesReady();

  // Drive the dampened zoom scale through a CSS variable on the map container so the icons can
  // scale via `transform: scale(var(--combat-scale))` without recreating the marker DOM/images.
  // Updating on zoomend keeps positions animating smoothly while the size settles per zoom level.
  useEffect(() => {
    const container = map.getContainer();
    const applyScale = () => {
      container.style.setProperty(
        "--combat-scale",
        combatScaleForZoom(map.getZoom()).toFixed(4),
      );
    };
    applyScale();
    map.on("zoomend", applyScale);
    return () => {
      map.off("zoomend", applyScale);
    };
  }, [map]);

  if (!ready) {
    return null;
  }

  const healthMarkers: MarkerItem[] = [];
  const hitsplatMarkers: MarkerItem[] = [];

  const pushHealthBar = (
    keyPrefix: string,
    position: GamePosition,
    size: number,
    data: {
      fraction: number;
      isBoss?: boolean;
      hp?: { current: number; max: number };
    },
  ) => {
    const barSprite = getHealthBarSprite(data.fraction);
    if (!barSprite) {
      return;
    }
    const percentSprite = getPercentTextSprite(data.fraction * 100);
    const hpSprite = data.hp
      ? getHpTextSprite(data.hp.current, data.hp.max)
      : null;

    const barWidth =
      HEALTH_BAR_WIDTH_PX * (data.isBoss ? BOSS_BAR_WIDTH_MULTIPLIER : 1);

    // The percent label sits inside the bar (absolutely centred over it).
    const barBlock = `<div style="position:relative;width:${barWidth}px;height:${HEALTH_BAR_HEIGHT_PX}px;">
      <img src="${barSprite.url}" style="width:${barWidth}px;height:${HEALTH_BAR_HEIGHT_PX}px;image-rendering:pixelated;display:block;"/>
      ${
        percentSprite
          ? `<img src="${percentSprite.url}" style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:${scaledWidth(percentSprite, PERCENT_HEIGHT_PX)}px;height:${PERCENT_HEIGHT_PX}px;image-rendering:pixelated;"/>`
          : ""
      }
    </div>`;

    // ToB bosses additionally show exact "current / max" hitpoints, stacked just above the bar.
    const hpBlock = hpSprite
      ? imgTag(hpSprite, HP_TEXT_HEIGHT_PX, `margin-bottom:${LABEL_GAP_PX}px;`)
      : "";

    const totalWidth = Math.max(
      barWidth,
      hpSprite ? scaledWidth(hpSprite, HP_TEXT_HEIGHT_PX) : 0,
    );
    const totalHeight =
      HEALTH_BAR_HEIGHT_PX + (hpSprite ? HP_TEXT_HEIGHT_PX + LABEL_GAP_PX : 0);

    const icon = L.divIcon({
      className: "rl-combat-marker",
      // Scale about the bottom-centre (the anchor) so the bar stays hugged to the footprint's top.
      html: `<div style="display:flex;flex-direction:column;align-items:center;width:${totalWidth}px;transform:scale(var(--combat-scale,1));transform-origin:50% 100%;">${hpBlock}${barBlock}</div>`,
      iconSize: [totalWidth, totalHeight],
      // Anchor the bottom-centre of the stack to the entity's north edge, so the bar hugs the top
      // of the footprint regardless of zoom.
      iconAnchor: [totalWidth / 2, totalHeight],
    });

    healthMarkers.push({
      key: `${keyPrefix}-hp`,
      position: Position.toLatLng(
        map,
        position.x + size / 2,
        position.y + size,
      ),
      icon,
    });
  };

  for (const [npcKey, data] of Object.entries(combat.npcHealthBars)) {
    const position = npcPositions[npcKey];
    if (position) {
      pushHealthBar(`npc-${npcKey}`, position, npcSizeFromKey(npcKey), data);
    }
  }
  for (const [playerName, data] of Object.entries(combat.playerHealthBars)) {
    const position = playerPositions[playerName];
    if (position) {
      pushHealthBar(`player-${playerName}`, position, 1, data);
    }
  }

  // Group hitsplats by target so multiple splats on one entity render as a centred row.
  const hitsplatsByTarget = new Map<
    string,
    { position: GamePosition; size: number; sprites: CompositeSprite[] }
  >();
  for (const splat of combat.hitsplats) {
    const position = splat.isPlayer
      ? playerPositions[splat.targetKey]
      : npcPositions[splat.targetKey];
    if (!position) {
      continue;
    }
    const sprite = getHitsplatSprite(splat.hitsplatName, splat.amount);
    if (!sprite) {
      continue;
    }
    const size = splat.isPlayer ? 1 : npcSizeFromKey(splat.targetKey);

    let group = hitsplatsByTarget.get(splat.targetKey);
    if (!group) {
      group = { position, size, sprites: [] };
      hitsplatsByTarget.set(splat.targetKey, group);
    }
    group.sprites.push(sprite);
  }

  for (const [targetKey, group] of hitsplatsByTarget.entries()) {
    // Show at most a HITSPLATS_PER_ROW x HITSPLAT_MAX_ROWS grid of the most recent hitsplats.
    const visible = group.sprites.slice(
      0,
      HITSPLATS_PER_ROW * HITSPLAT_MAX_ROWS,
    );
    const rows: CompositeSprite[][] = [];
    for (let i = 0; i < visible.length; i += HITSPLATS_PER_ROW) {
      rows.push(visible.slice(i, i + HITSPLATS_PER_ROW));
    }

    const rowWidth = (row: CompositeSprite[]) =>
      row.reduce(
        (sum, sprite) => sum + scaledWidth(sprite, HITSPLAT_HEIGHT_PX),
        0,
      ) +
      HITSPLAT_GAP_PX * (row.length - 1);

    const totalWidth = Math.max(...rows.map(rowWidth));
    const totalHeight =
      rows.length * HITSPLAT_HEIGHT_PX + HITSPLAT_GAP_PX * (rows.length - 1);

    const rowsHtml = rows
      .map((row) => {
        const imgs = row
          .map((sprite) => imgTag(sprite, HITSPLAT_HEIGHT_PX))
          .join("");
        return `<div style="display:flex;flex-direction:row;align-items:center;justify-content:center;gap:${HITSPLAT_GAP_PX}px;">${imgs}</div>`;
      })
      .join("");

    const icon = L.divIcon({
      className: "rl-combat-marker",
      // Scale about the centre (the anchor) so the grid stays centred on the entity.
      html: `<div style="display:flex;flex-direction:column;align-items:center;gap:${HITSPLAT_GAP_PX}px;width:${totalWidth}px;transform:scale(var(--combat-scale,1));transform-origin:50% 50%;">${rowsHtml}</div>`,
      iconSize: [totalWidth, totalHeight],
      iconAnchor: [totalWidth / 2, totalHeight / 2],
    });

    hitsplatMarkers.push({
      key: `hitsplat-${targetKey}`,
      position: Position.toLatLng(
        map,
        group.position.x + group.size / 2,
        group.position.y + group.size / 2,
      ),
      icon,
    });
  }

  return (
    <>
      {healthMarkers.map((item) => (
        <Marker
          key={item.key}
          position={item.position}
          icon={item.icon}
          interactive={false}
          keyboard={false}
          pane="healthbars"
        />
      ))}
      {hitsplatMarkers.map((item) => (
        <Marker
          key={item.key}
          position={item.position}
          icon={item.icon}
          interactive={false}
          keyboard={false}
          pane="hitsplats"
        />
      ))}
    </>
  );
};

export default CombatOverlay;
