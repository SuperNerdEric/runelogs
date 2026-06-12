import { GlobalStyles } from '@mui/material';
import { cssVariables } from './cssVariables';

export default function ThemeVariables() {
    return <GlobalStyles styles={{ ':root': cssVariables }} />;
}
