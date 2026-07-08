import React from "react";
import { Box, Typography } from "@mui/material";
import { Icon } from "@iconify/react";

interface ExpandableMoreInfoProps {
  expanded: boolean;
  onToggle: () => void;
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  contentClassName?: string;
}

const ExpandableMoreInfo: React.FC<ExpandableMoreInfoProps> = ({
  expanded,
  onToggle,
  children,
  className,
  style,
  contentClassName,
}) => {
  return (
    <Box
      className={`expandable-more-info${className ? ` ${className}` : ""}`}
      style={style}
    >
      <Box
        component="button"
        type="button"
        className={`expandable-more-info__control${expanded ? " expandable-more-info__control--expanded" : ""}`}
        aria-expanded={expanded}
        onClick={onToggle}
      >
        <Box component="span" className="expandable-more-info__chip">
          <Icon
            icon="mdi:view-list"
            className="expandable-more-info__chip-icon"
          />
          <Typography
            component="span"
            className="expandable-more-info__chip-label"
          >
            {expanded ? "Less Info" : "More Info"}
          </Typography>
          <Icon
            icon="mdi:chevron-down"
            className={`expandable-more-info__chip-chevron${expanded ? " expandable-more-info__chip-chevron--expanded" : ""}`}
          />
        </Box>
      </Box>
      {expanded && children && (
        <Box
          className={
            contentClassName
              ? `expandable-more-info__content ${contentClassName}`
              : "expandable-more-info__content"
          }
        >
          {children}
        </Box>
      )}
    </Box>
  );
};

export default ExpandableMoreInfo;
