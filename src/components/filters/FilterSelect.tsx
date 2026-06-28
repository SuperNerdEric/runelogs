import React from 'react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {useIsMobile} from '@/hooks/useMediaQuery';
import {cn} from '@/lib/utils';
import {
    FILTER_FIELD_ICON_SIZE,
    FILTER_FIELD_ICON_SIZE_MOBILE,
    filterFieldWithIconClass,
    filterMenuPaperClass,
    filterSelectClass,
    filterSelectCompactClass,
} from './filterStyles';
import FilterFieldIcon, {FilterFieldKind} from './FilterFieldIcon';

export interface FilterSelectOption<T extends string | number> {
    value: T;
    label: React.ReactNode;
}

const FIELD_LABELS: Record<FilterFieldKind, string> = {
    content: 'Content',
    fight: 'Fight',
    team: 'Team size',
};

interface FilterSelectProps<T extends string | number> {
    field?: FilterFieldKind;
    value: T;
    options: FilterSelectOption<T>[];
    onChange: (value: T) => void;
    compact?: boolean;
    className?: string;
}

function FilterSelect<T extends string | number>({
    field,
    value,
    options,
    onChange,
    compact = false,
    className,
}: FilterSelectProps<T>) {
    const isMobile = useIsMobile();
    const fieldIconSize = isMobile ? FILTER_FIELD_ICON_SIZE_MOBILE : FILTER_FIELD_ICON_SIZE;
    const accessibleLabel = field ? FIELD_LABELS[field] : undefined;

    const selectClassName = cn(
        compact ? filterSelectCompactClass : filterSelectClass,
        className,
    );

    const select = (
        <Select
            value={String(value)}
            onValueChange={(nextValue) => {
                const matched = options.find((option) => String(option.value) === nextValue);
                if (matched) {
                    onChange(matched.value);
                }
            }}
        >
            <SelectTrigger
                className={selectClassName}
                aria-label={accessibleLabel}
            >
                <SelectValue />
            </SelectTrigger>
            <SelectContent className={filterMenuPaperClass}>
                {options.map((option) => (
                    <SelectItem key={String(option.value)} value={String(option.value)}>
                        {option.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );

    if (field !== 'team') {
        return select;
    }

    return (
        <div className={filterFieldWithIconClass}>
            <span
                className="filter-field-with-icon__icon"
                title={FIELD_LABELS.team}
            >
                <FilterFieldIcon field="team" size={fieldIconSize}/>
            </span>
            {select}
        </div>
    );
}

export default FilterSelect;
