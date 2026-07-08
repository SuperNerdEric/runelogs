import React from "react";

import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
} from "@mui/material";

import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

import TableColumnHeaderTooltip from "../TableColumnHeaderTooltip";

interface SummarySectionProps {
  title: string;

  children: React.ReactNode;

  className?: string;

  titleTooltip?: string;

  titleAdornment?: React.ReactNode;

  defaultExpanded?: boolean;
}

const SummarySection: React.FC<SummarySectionProps> = ({
  title,

  children,

  className,

  titleTooltip,

  titleAdornment,

  defaultExpanded = true,
}) => {
  return (
    <Accordion
      className={`surface-card summary-section summary-section-accordion${className ? ` ${className}` : ""}`}

      defaultExpanded={defaultExpanded}

      disableGutters

      elevation={0}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}

        className="summary-section__title-bar encounter-title-bar"
      >
        <Box className="summary-section__title-row">
          {titleTooltip ? (
            <TableColumnHeaderTooltip label={title} tooltip={titleTooltip} />
          ) : (
            <span className="encounter-title-bar-name">{title}</span>
          )}

          {titleAdornment}
        </Box>
      </AccordionSummary>

      <AccordionDetails className="summary-section__body">
        {children}
      </AccordionDetails>
    </Accordion>
  );
};

export default SummarySection;
