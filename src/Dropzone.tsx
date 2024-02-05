import React, {useCallback} from 'react'
import {useDropzone} from 'react-dropzone'

interface DropzoneProps {
    onParse: (fileContent: string) => void;
}

const Dropzone: React.FC<DropzoneProps> = ({ onParse }) => {
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
    },[onParse])
    const {getRootProps, getInputProps, isDragActive} = useDropzone({onDrop})

    return (
        <div {...getRootProps()}>
            <input {...getInputProps()} />
            {
                isDragActive ?
                    <p>Drop the files here ...</p> :
                    <p>Drag 'n' drop some files here, or click to select files</p>
            }
        </div>
    )
}

export default Dropzone;