import React from 'react';
import {Link as RouterLink} from 'react-router-dom';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {Icon} from '@iconify/react';
import {cn} from '@/lib/utils';

export type BreadcrumbSelectOption = {
    value: number;
    label: string;
};

export type BreadcrumbSegment = {
    label: string;
    href?: string;
    select?: {
        options: BreadcrumbSelectOption[];
        value: number;
        onChange: (index: number) => void;
    };
};

interface PageBreadcrumbsProps {
    segments: BreadcrumbSegment[];
    className?: string;
}

export const breadcrumbSelectClass = 'breadcrumb-select';

interface BreadcrumbSelectProps {
    segment: BreadcrumbSegment;
    className?: string;
    ariaLabel?: string;
}

export const BreadcrumbSelect: React.FC<BreadcrumbSelectProps> = ({
    segment,
    className,
    ariaLabel = 'Select fight',
}) => {
    const {options, value, onChange} = segment.select!;

    return (
        <div className="breadcrumb-select-wrap">
            <select
                className={cn(breadcrumbSelectClass, className)}
                value={value}
                onChange={(event: React.ChangeEvent<HTMLSelectElement>) => {
                    onChange(Number(event.target.value));
                }}
                aria-label={ariaLabel}
            >
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
            <Icon
                icon="mdi:chevron-down"
                className="breadcrumb-select-chevron"
                style={{fontSize: '1.125rem'}}
            />
        </div>
    );
};

const PageBreadcrumbs: React.FC<PageBreadcrumbsProps> = ({segments, className}) => {
    const ancestors = segments.slice(0, -1);
    const parent = ancestors.length > 0 ? ancestors[ancestors.length - 1] : undefined;

    return (
        <div className={cn('page-breadcrumbs', className)}>
            <Breadcrumb className="page-breadcrumbs__desktop">
                <BreadcrumbList>
                    {segments.map((segment, index) => {
                        const isLast = index === segments.length - 1;
                        const key = segment.select ? 'breadcrumb-select' : `${segment.label}-${index}`;

                        return (
                            <React.Fragment key={key}>
                                <BreadcrumbItem>
                                    {segment.select ? (
                                        <BreadcrumbSelect segment={segment}/>
                                    ) : isLast || !segment.href ? (
                                        <BreadcrumbPage className="breadcrumb-text">
                                            {segment.label}
                                        </BreadcrumbPage>
                                    ) : (
                                        <BreadcrumbLink asChild>
                                            <RouterLink to={segment.href} className="breadcrumb-link">
                                                {segment.label}
                                            </RouterLink>
                                        </BreadcrumbLink>
                                    )}
                                </BreadcrumbItem>
                                {!isLast && (
                                    <BreadcrumbSeparator>
                                        <Icon
                                            icon="mdi:chevron-right"
                                            style={{
                                                color: 'var(--color-text-muted)',
                                                fontSize: '1.125rem',
                                                verticalAlign: 'middle',
                                            }}
                                        />
                                    </BreadcrumbSeparator>
                                )}
                            </React.Fragment>
                        );
                    })}
                </BreadcrumbList>
            </Breadcrumb>

            {parent && (
                <nav className="page-breadcrumbs__mobile" aria-label="breadcrumb">
                    {parent.href ? (
                        <RouterLink
                            to={parent.href}
                            className="breadcrumb-mobile-link"
                            title={parent.label}
                        >
                            <Icon
                                icon="mdi:chevron-left"
                                style={{
                                    fontSize: '1.25rem',
                                    flexShrink: 0,
                                }}
                            />
                            <span className="breadcrumb-mobile-text">{parent.label}</span>
                        </RouterLink>
                    ) : (
                        <span className="breadcrumb-mobile-text" title={parent.label}>
                            {parent.label}
                        </span>
                    )}
                </nav>
            )}
        </div>
    );
};

export default PageBreadcrumbs;
