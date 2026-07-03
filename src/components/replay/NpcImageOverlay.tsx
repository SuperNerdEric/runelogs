import React, { useEffect, useState } from "react";
import { ImageOverlay, useMap } from "react-leaflet";
import L from "leaflet";
import {
  getNpcImageBounds,
  getNpcImageUrl,
  loadNpcAspectRatio,
} from "../../lib/npcImageOverlay";

interface NpcImageOverlayProps {
  npcId: number;
  x: number;
  y: number;
  size: number;
}

const NpcImageOverlay: React.FC<NpcImageOverlayProps> = ({
  npcId,
  x,
  y,
  size,
}) => {
  const map = useMap();
  const [imageBounds, setImageBounds] = useState<L.LatLngBounds | null>(null);

  useEffect(() => {
    let cancelled = false;

    loadNpcAspectRatio(npcId).then((aspectRatio) => {
      if (cancelled) {
        return;
      }
      setImageBounds(getNpcImageBounds(map, x, y, size, aspectRatio));
    });

    return () => {
      cancelled = true;
    };
  }, [map, npcId, x, y, size]);

  if (!imageBounds) {
    return null;
  }

  return (
    <ImageOverlay
      url={getNpcImageUrl(npcId)}
      bounds={imageBounds}
      opacity={1}
      interactive={false}
      pane="npcs"
    />
  );
};

export default NpcImageOverlay;
