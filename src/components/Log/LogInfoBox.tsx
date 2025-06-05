import React from 'react';
import {Link} from 'react-router-dom';
import {Box, Typography} from '@mui/material';

interface Props {
    uploaderId: string;
    uploadedAt: string;
    logId: string;
}

const LogInfoBox: React.FC<Props> = ({uploaderId, uploadedAt, logId}) => (
    <Box className="log-info-box">
        <Typography className="log-info-label">Uploader</Typography>
        <Link className="link log-info-value" to={`/logs/${uploaderId}`}>{uploaderId}</Link>

        <Typography className="log-info-label">Uploaded</Typography>
        <Typography className="log-info-value">
            {new Date(uploadedAt).toLocaleDateString('en-US', {month: '2-digit', day: '2-digit', year: 'numeric'})}
        </Typography>

        <Typography className="log-info-label">Log ID</Typography>
        <Typography className="log-info-value">{logId}</Typography>
    </Box>
);

export default LogInfoBox;
