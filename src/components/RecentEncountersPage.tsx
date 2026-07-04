import React, { useMemo } from "react";
import { Box, Typography } from "@mui/material";
import { useSearchParams } from "react-router-dom";
import HistoryIcon from "@mui/icons-material/History";
import OverallRecentEncounters from "./OverallRecentEncounters";
import { colors, contentColumnSx, media } from "../theme";
import { usePageMeta } from "../hooks/usePageMeta";
import { getRecentEncountersPageMeta } from "../utils/recentEncountersPageMeta";

const RecentEncountersPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const pageMeta = useMemo(
    () => getRecentEncountersPageMeta(searchParams),
    [searchParams],
  );
  usePageMeta(pageMeta);

  return (
    <Box
      sx={{
        ...contentColumnSx,
        mt: 2,
        px: 2,
        pb: 4,
        [media.mobileDown]: { px: 1 },
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          mb: 3,
          pt: 1,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 56,
            height: 56,
            borderRadius: 2,
            bgcolor: colors.background.surfaceAlt,
            border: `1px solid ${colors.border.default}`,
          }}
        >
          <HistoryIcon sx={{ fontSize: 32, color: colors.text.rune }} />
        </Box>
        <Typography
          variant="h4"
          sx={{ m: 0, fontWeight: 600, color: colors.text.primary }}
        >
          Recent Encounters
        </Typography>
      </Box>

      <OverallRecentEncounters entriesPerPage={50} />
    </Box>
  );
};

export default RecentEncountersPage;
