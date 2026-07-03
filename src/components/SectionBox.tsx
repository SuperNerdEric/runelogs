import { Box, BoxProps } from "@mui/material";
import { colors, layout } from "../theme";

const SectionBox = (props: BoxProps) => (
  <Box
    {...props}
    sx={{
      p: 2,
      bgcolor: colors.background.surface,
      border: `3px solid ${colors.border.default}`,
      boxSizing: "border-box",
      marginBottom: "10px",
      borderRadius: "5px",
      overflowX: "auto",
      maxWidth: layout.contentMaxWidth,
      width: "100%",
      "@media (max-width: 768px)": {
        border: `1px solid ${colors.border.default}`,
        maxWidth: "98vw",
        width: "100%",
        overflowX: "auto",
      },
      ...props.sx,
    }}
  />
);

export default SectionBox;
