import {Link as RouterLink} from 'react-router-dom';
import {Box, Link, Typography} from '@mui/material';
import {format} from "date-fns";

interface Props {
    uploaderId: string;
    uploadedAt: string;
    logId: string;
}

const LogInfoBox: React.FC<Props> = ({uploaderId, uploadedAt, logId}) => (
    <Box className="log-info-box">
        <Typography className="log-info-label">Uploader</Typography>
        <Link
            component={RouterLink}
            to={`/logs/${uploaderId}`}
            className="log-info-value"
            underline="hover"
        >
            {uploaderId}
        </Link>

        <Typography className="log-info-label">Uploaded</Typography>
        <Typography className="log-info-value">
            {format(new Date(uploadedAt), 'PPpp')}
        </Typography>

        <Typography className="log-info-label">Log ID</Typography>
        <Typography className="log-info-value">{logId}</Typography>
    </Box>
);

export default LogInfoBox;
