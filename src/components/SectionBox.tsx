import React from 'react';
import {cn} from '@/lib/utils';
import {sectionBoxClass} from '../theme';

type SectionBoxProps = React.HTMLAttributes<HTMLDivElement>;

const SectionBox = ({className, ...props}: SectionBoxProps) => (
    <div className={cn(sectionBoxClass, className)} {...props} />
);

export default SectionBox;
