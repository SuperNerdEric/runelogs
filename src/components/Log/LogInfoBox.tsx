import { Link as RouterLink } from 'react-router-dom';
import { Box, Typography, Link } from '@mui/material';

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
            {new Date(uploadedAt).toLocaleDateString('en-US', {
                month: '2-digit',
                day: '2-digit',
                year: 'numeric'
            })}
        </Typography>

        <Typography className="log-info-label">Log ID</Typography>
        <Typography className="log-info-value">{logId}</Typography>
    </Box>
);

export default LogInfoBox;
