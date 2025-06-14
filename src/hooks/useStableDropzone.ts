import { useCallback, useState } from 'react';
import { useDropzone, DropzoneOptions } from 'react-dropzone';

/**
 * A custom dropzone hook that wraps `useDropzone` to provide stable `isDragActive` behavior,
 * even when the drop area contains nested children.
 *
 * The default isDragActive from react-dropzone can flicker when the dropzone has nested elements,
 * because dragenter and dragleave fire on each child node, briefly toggling the drag state as the cursor moves between them.
 *
 * This hook uses a counter to track nested dragenter and dragleave events, ensuring isDragActive stays true
 * while the drag is inside the dropzone and only resets when it fully leaves.
 */
export function useStableDropzone(options: DropzoneOptions) {
    const [, setDragCount] = useState(0);
    const [isDragActive, setIsDragActive] = useState(false);

    const handleDragEnter = useCallback(() => {
        setDragCount((count) => {
            const newCount = count + 1;
            if (newCount === 1) {
                setIsDragActive(true);
            }
            return newCount;
        });
    }, []);

    const handleDragLeave = useCallback(() => {
        setDragCount((count) => {
            const newCount = count - 1;
            if (newCount <= 0) {
                setIsDragActive(false);
                return 0;
            }
            return newCount;
        });
    }, []);

    // Reset drag state on drop to prevent isDragActive from getting stuck
    // if dragleave doesn't fire after a successful drop (common when cursor stays inside the dropzone).
    const wrappedOnDrop = useCallback<NonNullable<DropzoneOptions['onDrop']>>(
        (...args) => {
            setDragCount(0);
            setIsDragActive(false);
            options.onDrop?.(...args);
        },
        [options.onDrop]
    );

    const dropzone = useDropzone({
        ...options,
        onDrop: wrappedOnDrop,
    });

    const getRootProps = (propsOverride = {}) =>
        dropzone.getRootProps({
            ...propsOverride,
            onDragEnter: handleDragEnter,
            onDragLeave: handleDragLeave,
        });

    return {
        ...dropzone,
        isDragActive,
        getRootProps,
    };
}
