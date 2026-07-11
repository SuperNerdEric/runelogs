import React, { useEffect, useState } from "react";
import { ImageOverlay } from "react-leaflet";
import { LatLngBounds } from "leaflet";
import { getRotatedClockwiseImageUrl } from "../../lib/rotateImageUrl";
import { SolLaserOrientation } from "../../lib/solLaserBeams";

interface SolLaserImageOverlayProps {
  url: string;
  bounds: LatLngBounds;
  opacity: number;
  orientation: SolLaserOrientation;
}

/**
 * Sol laser spotanim frames are dumped as west-east sprites. Vertical beams
 * need a 90° clockwise rotate so the stretch aligns north-south.
 */
const SolLaserImageOverlay: React.FC<SolLaserImageOverlayProps> = ({
  url,
  bounds,
  opacity,
  orientation,
}) => {
  const needsRotation = orientation === "vertical";
  const [displayUrl, setDisplayUrl] = useState<string | null>(
    needsRotation ? null : url,
  );

  useEffect(() => {
    let cancelled = false;

    if (!needsRotation) {
      setDisplayUrl(url);
      return;
    }

    setDisplayUrl(null);
    getRotatedClockwiseImageUrl(url)
      .then((rotatedUrl) => {
        if (!cancelled) {
          setDisplayUrl(rotatedUrl);
        }
      })
      .catch(() => {
        if (!cancelled) {
          // Fall back to the unrotated frame rather than hiding the beam.
          setDisplayUrl(url);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [url, needsRotation]);

  if (!displayUrl) {
    return null;
  }

  return (
    <ImageOverlay
      url={displayUrl}
      bounds={bounds}
      opacity={opacity}
      interactive={false}
      pane="objects"
    />
  );
};

export default SolLaserImageOverlay;
