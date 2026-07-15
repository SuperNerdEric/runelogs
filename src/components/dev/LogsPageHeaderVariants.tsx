import React from "react";
import { Box, Typography } from "@mui/material";
import FolderOpenOutlinedIcon from "@mui/icons-material/FolderOpenOutlined";
import { colors, contentColumnSx, accountTextSx, media } from "../../theme";
import { formatDisplayUsername } from "../../utils/utils";

const SAMPLE_UPLOADER = "honorable";
const displayName = formatDisplayUsername(SAMPLE_UPLOADER);

const iconBoxSx = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  width: 56,
  height: 56,
  borderRadius: 2,
  bgcolor: colors.background.surfaceAlt,
  border: `1px solid ${colors.border.default}`,
} as const;

const headerRowSx = {
  display: "flex",
  alignItems: "center",
  gap: 1.5,
} as const;

const LogsIcon: React.FC = () => (
  <Box sx={iconBoxSx}>
    <FolderOpenOutlinedIcon
      sx={{ fontSize: 32, color: colors.upload.dragActive }}
    />
  </Box>
);

interface HeaderShellProps {
  children: React.ReactNode;
  textSx?: object;
}

const HeaderShell: React.FC<HeaderShellProps> = ({ children, textSx }) => (
  <Box sx={headerRowSx}>
    <LogsIcon />
    <Box sx={{ minWidth: 0, ...textSx }}>{children}</Box>
  </Box>
);

interface VariantFrameProps {
  number: number;
  name: string;
  children: React.ReactNode;
}

const VariantFrame: React.FC<VariantFrameProps> = ({
  number,
  name,
  children,
}) => (
  <Box
    sx={{
      p: 2.5,
      borderRadius: 2,
      bgcolor: colors.background.surface,
      border: `1px solid ${colors.border.default}`,
    }}
  >
    <Typography
      sx={{
        fontSize: "0.7rem",
        fontWeight: 700,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        color: colors.text.muted,
        mb: 2,
      }}
    >
      {number}. {name}
    </Typography>
    {children}
  </Box>
);

const Variant01Current: React.FC = () => (
  <HeaderShell>
    <Typography
      variant="h4"
      sx={{ m: 0, fontWeight: 600, color: colors.text.primary }}
    >
      Logs
    </Typography>
    <Typography
      sx={{
        ...accountTextSx,
        fontWeight: 500,
        fontSize: "1rem",
        mt: 0.25,
      }}
    >
      {displayName}
    </Typography>
  </HeaderShell>
);

const Variant02InlineMiddot: React.FC = () => (
  <HeaderShell>
    <Typography
      variant="h4"
      sx={{ m: 0, fontWeight: 600, color: colors.text.primary }}
    >
      Logs
      <Box
        component="span"
        sx={{ color: colors.text.muted, fontWeight: 400, mx: 1 }}
      >
        ·
      </Box>
      <Box component="span" sx={{ ...accountTextSx, fontWeight: 600 }}>
        {displayName}
      </Box>
    </Typography>
  </HeaderShell>
);

const Variant03InlineColon: React.FC = () => (
  <HeaderShell>
    <Typography
      variant="h4"
      sx={{ m: 0, fontWeight: 600, color: colors.text.primary }}
    >
      Logs:
      <Box
        component="span"
        sx={{
          ...accountTextSx,
          fontWeight: 600,
          ml: 1,
        }}
      >
        {displayName}
      </Box>
    </Typography>
  </HeaderShell>
);

const Variant04InlineNameSmaller: React.FC = () => (
  <HeaderShell>
    <Box
      sx={{ display: "flex", alignItems: "baseline", gap: 1, flexWrap: "wrap" }}
    >
      <Typography
        variant="h4"
        sx={{ m: 0, fontWeight: 600, color: colors.text.primary }}
      >
        Logs
      </Typography>
      <Typography
        sx={{
          ...accountTextSx,
          fontWeight: 600,
          fontSize: "1.125rem",
        }}
      >
        {displayName}
      </Typography>
    </Box>
  </HeaderShell>
);

const Variant05InlineNameSameSize: React.FC = () => (
  <HeaderShell>
    <Box
      sx={{ display: "flex", alignItems: "baseline", gap: 1, flexWrap: "wrap" }}
    >
      <Typography
        variant="h4"
        sx={{ m: 0, fontWeight: 600, color: colors.text.primary }}
      >
        Logs
      </Typography>
      <Typography
        variant="h4"
        sx={{
          m: 0,
          fontWeight: 600,
          ...accountTextSx,
        }}
      >
        {displayName}
      </Typography>
    </Box>
  </HeaderShell>
);

const Variant06EyebrowLogsNameHero: React.FC = () => (
  <HeaderShell>
    <Typography
      sx={{
        fontSize: "0.7rem",
        fontWeight: 700,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: colors.text.muted,
        mb: 0.5,
      }}
    >
      Logs
    </Typography>
    <Typography
      variant="h4"
      sx={{
        m: 0,
        fontWeight: 600,
        color: colors.text.primary,
      }}
    >
      {displayName}
    </Typography>
  </HeaderShell>
);

const Variant07NameHeroLogsCaption: React.FC = () => (
  <HeaderShell>
    <Typography
      variant="h4"
      sx={{
        m: 0,
        fontWeight: 600,
        ...accountTextSx,
      }}
    >
      {displayName}
    </Typography>
    <Typography
      sx={{ color: colors.text.muted, fontSize: "0.875rem", mt: 0.25 }}
    >
      Uploaded logs
    </Typography>
  </HeaderShell>
);

const Variant08NameHeroWhiteLogsCaption: React.FC = () => (
  <HeaderShell>
    <Typography
      variant="h4"
      sx={{
        m: 0,
        fontWeight: 600,
        color: colors.text.primary,
      }}
    >
      {displayName}
    </Typography>
    <Typography
      sx={{ color: colors.text.muted, fontSize: "0.875rem", mt: 0.25 }}
    >
      Logs
    </Typography>
  </HeaderShell>
);

const Variant09NameBelowLarger: React.FC = () => (
  <HeaderShell>
    <Typography
      variant="h4"
      sx={{ m: 0, fontWeight: 600, color: colors.text.primary }}
    >
      Logs
    </Typography>
    <Typography
      sx={{
        ...accountTextSx,
        fontWeight: 600,
        fontSize: "1.25rem",
        mt: 0.25,
      }}
    >
      {displayName}
    </Typography>
  </HeaderShell>
);

const Variant10NameBelowSmaller: React.FC = () => (
  <HeaderShell>
    <Typography
      variant="h4"
      sx={{ m: 0, fontWeight: 600, color: colors.text.primary }}
    >
      Logs
    </Typography>
    <Typography
      sx={{
        ...accountTextSx,
        fontWeight: 500,
        fontSize: "0.8125rem",
        mt: 0.25,
      }}
    >
      {displayName}
    </Typography>
  </HeaderShell>
);

const Variant11NameBelowBold: React.FC = () => (
  <HeaderShell>
    <Typography
      variant="h4"
      sx={{ m: 0, fontWeight: 600, color: colors.text.primary }}
    >
      Logs
    </Typography>
    <Typography
      sx={{
        ...accountTextSx,
        fontWeight: 700,
        fontSize: "1rem",
        mt: 0.25,
      }}
    >
      {displayName}
    </Typography>
  </HeaderShell>
);

const Variant12NameBelowMuted: React.FC = () => (
  <HeaderShell>
    <Typography
      variant="h4"
      sx={{ m: 0, fontWeight: 600, color: colors.text.primary }}
    >
      Logs
    </Typography>
    <Typography
      sx={{
        color: colors.text.muted,
        fontWeight: 500,
        fontSize: "1rem",
        mt: 0.25,
      }}
    >
      {displayName}
    </Typography>
  </HeaderShell>
);

const Variant13AtUsername: React.FC = () => (
  <HeaderShell>
    <Typography
      variant="h4"
      sx={{ m: 0, fontWeight: 600, color: colors.text.primary }}
    >
      Logs
    </Typography>
    <Typography sx={{ fontSize: "1rem", mt: 0.25 }}>
      <Box component="span" sx={{ color: colors.text.muted }}>
        @
      </Box>
      <Box
        component="span"
        sx={{ ...accountTextSx, textTransform: "lowercase", fontWeight: 500 }}
      >
        {SAMPLE_UPLOADER}
      </Box>
    </Typography>
  </HeaderShell>
);

const Variant14PossessiveTitle: React.FC = () => (
  <HeaderShell>
    <Typography
      variant="h4"
      sx={{
        m: 0,
        fontWeight: 600,
        color: colors.text.primary,
      }}
    >
      {displayName}&apos;s Logs
    </Typography>
  </HeaderShell>
);

const Variant15NameAboveLogs: React.FC = () => (
  <HeaderShell>
    <Typography
      sx={{
        ...accountTextSx,
        fontWeight: 600,
        fontSize: "1.125rem",
        m: 0,
      }}
    >
      {displayName}
    </Typography>
    <Typography
      variant="h4"
      sx={{ m: 0, fontWeight: 600, color: colors.text.primary, mt: 0.125 }}
    >
      Logs
    </Typography>
  </HeaderShell>
);

const Variant16NameRightInBlock: React.FC = () => (
  <HeaderShell
    textSx={{
      display: "flex",
      alignItems: "baseline",
      justifyContent: "space-between",
      gap: 2,
      width: "100%",
    }}
  >
    <Typography
      variant="h4"
      sx={{ m: 0, fontWeight: 600, color: colors.text.primary }}
    >
      Logs
    </Typography>
    <Typography
      sx={{
        ...accountTextSx,
        fontWeight: 600,
        fontSize: "1.125rem",
      }}
    >
      {displayName}
    </Typography>
  </HeaderShell>
);

const Variant17NameOnlyH4: React.FC = () => (
  <HeaderShell>
    <Typography
      variant="h4"
      sx={{
        m: 0,
        fontWeight: 600,
        ...accountTextSx,
      }}
    >
      {displayName}
    </Typography>
  </HeaderShell>
);

const Variant18LogsForName: React.FC = () => (
  <HeaderShell>
    <Typography
      variant="h4"
      sx={{ m: 0, fontWeight: 600, color: colors.text.primary }}
    >
      Logs for{" "}
      <Box component="span" sx={{ ...accountTextSx, fontWeight: 600 }}>
        {displayName}
      </Box>
    </Typography>
  </HeaderShell>
);

const Variant19StackedTight: React.FC = () => (
  <HeaderShell>
    <Typography
      variant="h4"
      sx={{
        m: 0,
        fontWeight: 600,
        color: colors.text.primary,
        lineHeight: 1.15,
      }}
    >
      Logs
    </Typography>
    <Typography
      sx={{
        ...accountTextSx,
        fontWeight: 600,
        fontSize: "1.125rem",
        lineHeight: 1.15,
        mt: 0,
      }}
    >
      {displayName}
    </Typography>
  </HeaderShell>
);

const Variant20StackedBothH4: React.FC = () => (
  <HeaderShell>
    <Typography
      variant="h4"
      sx={{
        m: 0,
        fontWeight: 600,
        color: colors.text.primary,
        lineHeight: 1.2,
      }}
    >
      Logs
    </Typography>
    <Typography
      variant="h4"
      sx={{
        m: 0,
        fontWeight: 600,
        lineHeight: 1.2,
        mt: 0.25,
        ...accountTextSx,
      }}
    >
      {displayName}
    </Typography>
  </HeaderShell>
);

const VARIANTS: { name: string; Component: React.FC }[] = [
  { name: "Current — subtitle below", Component: Variant01Current },
  { name: "Inline with middot", Component: Variant02InlineMiddot },
  { name: "Inline with colon", Component: Variant03InlineColon },
  { name: "Same row, name smaller", Component: Variant04InlineNameSmaller },
  {
    name: "Same row, name same h4 size",
    Component: Variant05InlineNameSameSize,
  },
  {
    name: "Small “Logs” label, name as hero",
    Component: Variant06EyebrowLogsNameHero,
  },
  {
    name: "Name hero + “Uploaded logs” caption",
    Component: Variant07NameHeroLogsCaption,
  },
  {
    name: "Name hero white + “Logs” caption",
    Component: Variant08NameHeroWhiteLogsCaption,
  },
  { name: "Name below, larger (1.25rem)", Component: Variant09NameBelowLarger },
  {
    name: "Name below, smaller (0.8125rem)",
    Component: Variant10NameBelowSmaller,
  },
  { name: "Name below, bold", Component: Variant11NameBelowBold },
  {
    name: "Name below, muted (no account color)",
    Component: Variant12NameBelowMuted,
  },
  { name: "@username below", Component: Variant13AtUsername },
  {
    name: "Possessive single line (“Honorable’s Logs”)",
    Component: Variant14PossessiveTitle,
  },
  { name: "Name above “Logs”", Component: Variant15NameAboveLogs },
  {
    name: "“Logs” left, name right in block",
    Component: Variant16NameRightInBlock,
  },
  { name: "Name only (no “Logs” label)", Component: Variant17NameOnlyH4 },
  { name: "“Logs for {name}”", Component: Variant18LogsForName },
  { name: "Stacked tight, no gap", Component: Variant19StackedTight },
  { name: "Stacked, both h4 size", Component: Variant20StackedBothH4 },
];

const LogsPageHeaderVariants: React.FC = () => (
  <Box
    sx={{
      ...contentColumnSx,
      mt: 2,
      px: 2,
      pb: 6,
      [media.mobileDown]: { px: 1 },
    }}
  >
    <Box sx={{ mb: 4 }}>
      <Typography
        variant="h4"
        sx={{ m: 0, fontWeight: 600, color: colors.text.primary, mb: 1 }}
      >
        Logs Page Header Variants
      </Typography>
      <Typography
        sx={{ color: colors.text.muted, fontSize: "0.95rem", maxWidth: 720 }}
      >
        20 layouts for username positioning and size on{" "}
        <CodeInline>/logs/:uploaderId</CodeInline>. Icon is fixed at 56×56 with
        standard rounding on every variant. Sample user:{" "}
        <Box component="span" sx={{ ...accountTextSx }}>
          {displayName}
        </Box>
        . Reply with a variant number to apply it.
      </Typography>
    </Box>

    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
        gap: 2,
      }}
    >
      {VARIANTS.map(({ name, Component }, index) => (
        <VariantFrame key={name} number={index + 1} name={name}>
          <Component />
        </VariantFrame>
      ))}
    </Box>
  </Box>
);

const CodeInline: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Box
    component="code"
    sx={{
      fontFamily: "monospace",
      fontSize: "0.85em",
      px: 0.75,
      py: 0.25,
      borderRadius: 1,
      bgcolor: colors.background.surfaceAlt,
      border: `1px solid ${colors.border.default}`,
    }}
  >
    {children}
  </Box>
);

export default LogsPageHeaderVariants;
