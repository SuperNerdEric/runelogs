import React, {useCallback} from 'react';
import {useDropzone} from 'react-dropzone';
import {CloudUpload} from 'lucide-react';
import {Button} from '@/components/ui/button';

interface DropzoneProps {
    onParse: (fileContent: string) => void;
}

const Dropzone: React.FC<DropzoneProps> = ({onParse}) => {
    const onDrop = useCallback((acceptedFiles: File[]) => {
        acceptedFiles.forEach((file: File) => {
            const reader = new FileReader();

            if (file.type === 'text/plain') {
                reader.onload = () => {
                    const fileContent = reader.result as string;
                    onParse(fileContent);
                };

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
                type="button"
                variant="default"
                className="rounded-full bg-white text-black hover:bg-white/90"
                asChild
            >
                <span className="inline-flex items-center gap-2">
                    <CloudUpload className="size-16 text-neutral-500" aria-hidden />
                    Upload file
                </span>
            </Button>
        </div>
    );
};

export default Dropzone;
