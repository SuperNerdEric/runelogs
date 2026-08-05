import React, { useMemo, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Link,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckIcon from "@mui/icons-material/Check";

import { GearSetup } from "../../models/GearSetup";
import { buildBankTagExport } from "../../utils/gearSetup/bankTagLayout";
import { buildInventorySetupJson } from "../../utils/gearSetup/inventorySetup";
import inventorySetupsImportIcon from "../../assets/inventorySetupsImport.png";
import bankTagsNewTabIcon from "../../assets/bankTagsNewTab.png";
import inventorySetupsSidePanelIcon from "../../assets/gearSetupsIcon.png";

interface GearSetupExportModalProps {
  open: boolean;
  onClose: () => void;
  gearSetup: GearSetup;
  /** Name used for the exported bank tag tab / inventory setup. */
  name: string;
}

const INVENTORY_SETUPS_PLUGIN_URL =
  "https://runelite.net/plugin-hub/show/inventory-setups";
const BANK_TAGS_WIKI_URL =
  "https://github.com/runelite/runelite/wiki/Bank-Tags";

interface ExportPanelProps {
  description: React.ReactNode;
  value: string;
}

const ExportPanel: React.FC<ExportPanelProps> = ({ description, value }) => {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard may be unavailable (e.g. insecure context); ignore.
    }
  };

  return (
    <Box sx={{ pt: 1 }}>
      <Typography variant="body2" sx={{ mb: 1.5, color: "text.secondary" }}>
        {description}
      </Typography>
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1 }}>
        <Button
          size="small"
          variant="contained"
          startIcon={copied ? <CheckIcon /> : <ContentCopyIcon />}
          onClick={copy}
        >
          {copied ? "Copied!" : "Copy"}
        </Button>
      </Box>
      <TextField
        value={value}
        multiline
        minRows={4}
        maxRows={12}
        fullWidth
        InputProps={{ readOnly: true }}
        onFocus={(event) => event.target.select()}
        sx={{
          "& .MuiInputBase-input": {
            fontFamily: "monospace",
            fontSize: "12px",
            wordBreak: "break-all",
          },
        }}
      />
    </Box>
  );
};

const GearSetupExportModal: React.FC<GearSetupExportModalProps> = ({
  open,
  onClose,
  gearSetup,
  name,
}) => {
  const [tab, setTab] = useState(0);

  const bankTag = useMemo(
    () => buildBankTagExport(gearSetup, name),
    [gearSetup, name],
  );
  const inventorySetup = useMemo(
    () => buildInventorySetupJson(gearSetup, name),
    [gearSetup, name],
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pr: 6 }}>
        Export gear setup
        <IconButton
          onClick={onClose}
          sx={{ position: "absolute", right: 8, top: 8 }}
          aria-label="Close"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <Tabs
        value={tab}
        onChange={(_event, value) => setTab(value)}
        variant="fullWidth"
        sx={{ borderBottom: 1, borderColor: "divider" }}
      >
        <Tab label="Bank Tag Layout" />
        <Tab label="Inventory Setups" />
      </Tabs>
      <DialogContent>
        {tab === 0 && (
          <ExportPanel
            value={bankTag}
            description={
              <>
                An import string for the{" "}
                <Link
                  href={BANK_TAGS_WIKI_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Bank Tags
                </Link>{" "}
                plugin. In RuneLite, open your bank, right-click the new tab
                button{" "}
                <Box
                  component="img"
                  src={bankTagsNewTabIcon}
                  alt="New tag tab"
                  sx={{
                    height: "1.6em",
                    width: "1.6em",
                    verticalAlign: "text-bottom",
                    mx: 0.25,
                  }}
                />{" "}
                and choose <em>Import tag tab</em> to paste it.
              </>
            }
          />
        )}
        {tab === 1 && (
          <ExportPanel
            value={inventorySetup}
            description={
              <>
                An import string for the{" "}
                <Link
                  href={INVENTORY_SETUPS_PLUGIN_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Inventory Setups
                </Link>{" "}
                plugin. In RuneLite, open the Inventory Setups side panel{" "}
                <Box
                  component="img"
                  src={inventorySetupsSidePanelIcon}
                  alt="Inventory Setups side panel"
                  sx={{
                    height: "1.6em",
                    width: "1.6em",
                    verticalAlign: "text-bottom",
                    mx: 0.25,
                  }}
                />
                , click the import button{" "}
                <Box
                  component="img"
                  src={inventorySetupsImportIcon}
                  alt="Import a new setup or section"
                  sx={{
                    height: "1.6em",
                    width: "1.6em",
                    verticalAlign: "text-bottom",
                    mx: 0.25,
                  }}
                />{" "}
                and choose <em>Import setup</em> to paste it.
              </>
            }
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default GearSetupExportModal;
