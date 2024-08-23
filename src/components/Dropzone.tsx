import React, {useCallback} from 'react';
import {useDropzone} from 'react-dropzone';
import {Button} from "@mui/material";
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

interface DropzoneProps {
    onParse: (fileContent: string) => void;
}

const Dropzone: React.FC<DropzoneProps> = ({onParse}) => {
    const onDrop = useCallback((acceptedFiles: any) => {
        acceptedFiles.forEach((file: File) => {
            const reader = new FileReader();

            if (file.type === 'text/plain') {
                reader.onload = () => {
                    const fileContent = reader.result as string;
                    onParse(fileContent);
                };

                // Read the file as text
                reader.readAsText(file);
            } else {
                console.log(`${file.name} is not a text file. Skipping.`);
            }
        });
    }, [onParse]);

    const {getRootProps, getInputProps} = useDropzone({onDrop});

    return (
        <div {...getRootProps()} style={{marginTop: '20px', textAlign: 'center'}}>
            <input {...getInputProps()} />
            <Button
                variant="contained"
                color="primary"
                component="span"
                startIcon={<CloudUploadIcon style={{color: 'grey', fontSize: '4em'}}/>}
                style={{background: 'white', color: 'black', borderRadius: '25px'}}
            >
                Upload file
            </Button>
        </div>
    );
};

export default Dropzone;
