import React, {useMemo, useRef, useState} from 'react';
import {ArrowLeft, ChevronRight, ListFilter} from 'lucide-react';
import {Popover, PopoverAnchor, PopoverContent} from '@/components/ui/popover';
import {useIsMobile} from '@/hooks/useMediaQuery';
import {cn} from '@/lib/utils';
import {Fight} from '../models/Fight';
import {LogTypes} from '../models/LogLine';
import {ActorFilter} from '../utils/actorFilter';
import {EquipmentFilter} from '../utils/equipmentFilter';
import {PrayerFilter} from '../utils/prayerFilter';
import {colors, layout} from '../theme';
import {getActorFromLog} from '../utils/actorUtils';
import {itemIdMap} from '../lib/itemIdMap';
import {prayerIdMap} from '../lib/prayerIdMap';
import {getPrayerImageUrl} from '../lib/prayerImages';
import {getItemImageUrl} from './replay/PlayerEquipment';

export type FilterOption =
    | { kind: 'source'; label: string; filter: ActorFilter }
    | { kind: 'target'; label: string; filter: ActorFilter }
    | { kind: 'equipment'; label: string; filter: EquipmentFilter }
    | { kind: 'prayer'; label: string; filter: PrayerFilter };

type FilterCategory = FilterOption['kind'];

type DisplayOption =
    | { type: 'category'; category: FilterCategory; label: string }
    | { type: 'item'; option: FilterOption; label: string }
    | { type: 'back'; label: string };

interface FilterSearchBarProps {
    fight: Fight;
    onSelectSourceFilter?: (filter: ActorFilter) => void;
    onSelectTargetFilter?: (filter: ActorFilter) => void;
    onSelectEquipmentFilter?: (filter: EquipmentFilter) => void;
    onSelectPrayerFilter?: (filter: PrayerFilter) => void;
}

const CATEGORY_LABELS: Record<FilterCategory, string> = {
    source: 'Source',
    target: 'Target',
    equipment: 'Equipment',
    prayer: 'Prayers',
};

const FILTER_ICON_COLUMN_WIDTH = 28;
const FILTER_ICON_MAX_SIZE = 22;

const getCategoryLabel = (option: FilterOption): string => CATEGORY_LABELS[option.kind];

const getDisplayOptionKey = (option: DisplayOption): string => {
    if (option.type === 'item') {
        return `${option.option.kind}-${option.label}`;
    }
    if (option.type === 'category') {
        return `category-${option.category}`;
    }
    return 'back';
};

const FilterSearchBar: React.FC<FilterSearchBarProps> = ({
    fight,
    onSelectSourceFilter,
    onSelectTargetFilter,
    onSelectEquipmentFilter,
    onSelectPrayerFilter,
}) => {
    const [inputValue, setInputValue] = useState('');
    const [open, setOpen] = useState(false);
    const [activeCategory, setActiveCategory] = useState<FilterCategory | null>(null);
    const keepOpenRef = useRef(false);
    const isMobile = useIsMobile();

    const itemOptions = useMemo(() => {
        const sourceNames = new Set<string>();
        const targetNames = new Set<string>();
        const equipmentItems = new Map<number, string>();
        const prayerItems = new Map<number, string>();

        for (const log of fight.data) {
            const source = getActorFromLog(log, 'source');
            const target = getActorFromLog(log, 'target');

            if (source?.name) {
                sourceNames.add(source.name);
            }
            if (target?.name) {
                targetNames.add(target.name);
            }

            if (log.type === LogTypes.PLAYER_EQUIPMENT && Array.isArray(log.playerEquipment)) {
                for (const itemIdStr of log.playerEquipment) {
                    const id = parseInt(itemIdStr, 10);
                    if (id > 0 && !equipmentItems.has(id)) {
                        equipmentItems.set(id, itemIdMap[id] || `Item ${id}`);
                    }
                }
            }

            if (log.type === LogTypes.PRAYER && Array.isArray(log.prayers)) {
                for (const prayerIdStr of log.prayers) {
                    const id = parseInt(prayerIdStr, 10);
                    if (id > 0 && !prayerItems.has(id)) {
                        prayerItems.set(id, prayerIdMap[id] || `Prayer ${id}`);
                    }
                }
            }

            if (log.type === LogTypes.OVERHEAD && log.overhead && log.overhead !== '-1') {
                const id = parseInt(log.overhead, 10);
                if (id > 0 && !prayerItems.has(id)) {
                    prayerItems.set(id, prayerIdMap[id] || `Prayer ${id}`);
                }
            }
        }

        const filterOptions: FilterOption[] = [];

        Array.from(sourceNames).sort((a, b) => a.localeCompare(b)).forEach((name) => {
            filterOptions.push({
                kind: 'source',
                label: name,
                filter: {name},
            });
        });

        Array.from(targetNames).sort((a, b) => a.localeCompare(b)).forEach((name) => {
            filterOptions.push({
                kind: 'target',
                label: name,
                filter: {name},
            });
        });

        Array.from(equipmentItems.entries())
            .sort(([, nameA], [, nameB]) => nameA.localeCompare(nameB))
            .forEach(([id, name]) => {
                filterOptions.push({
                    kind: 'equipment',
                    label: name,
                    filter: {id, name},
                });
            });

        Array.from(prayerItems.entries())
            .sort(([, nameA], [, nameB]) => nameA.localeCompare(nameB))
            .forEach(([id, name]) => {
                filterOptions.push({
                    kind: 'prayer',
                    label: name,
                    filter: {id, name},
                });
            });

        return filterOptions;
    }, [fight.data]);

    const goBackToCategories = () => {
        keepOpenRef.current = true;
        setActiveCategory(null);
        setInputValue('');
        setOpen(true);
    };

    const displayedOptions = useMemo((): DisplayOption[] => {
        const search = inputValue.trim().toLowerCase();

        if (search) {
            return itemOptions
                .filter((option) => option.label.toLowerCase().includes(search))
                .map((option) => ({
                    type: 'item' as const,
                    option,
                    label: option.label,
                }));
        }

        if (activeCategory) {
            const items = itemOptions
                .filter((option) => option.kind === activeCategory)
                .map((option) => ({
                    type: 'item' as const,
                    option,
                    label: option.label,
                }));

            return [{type: 'back' as const, label: 'Back'}, ...items];
        }

        const categories: FilterCategory[] = ['source', 'target', 'equipment', 'prayer'];
        return categories
            .filter((category) => itemOptions.some((option) => option.kind === category))
            .map((category) => ({
                type: 'category' as const,
                category,
                label: CATEGORY_LABELS[category],
            }));
    }, [activeCategory, inputValue, itemOptions]);

    const applyFilter = (option: FilterOption) => {
        if (option.kind === 'source') {
            onSelectSourceFilter?.(option.filter);
        } else if (option.kind === 'target') {
            onSelectTargetFilter?.(option.filter);
        } else if (option.kind === 'equipment') {
            onSelectEquipmentFilter?.(option.filter);
        } else {
            onSelectPrayerFilter?.(option.filter);
        }
    };

    const resetNavigation = () => {
        setActiveCategory(null);
        setInputValue('');
    };

    const handleOpenChange = (nextOpen: boolean) => {
        if (!nextOpen && keepOpenRef.current) {
            keepOpenRef.current = false;
            setOpen(true);
            return;
        }

        setOpen(nextOpen);
        if (!nextOpen) {
            setActiveCategory(null);
        }
    };

    const handleSelectCategory = (category: FilterCategory) => {
        keepOpenRef.current = true;
        setActiveCategory(category);
        setInputValue('');
        setOpen(true);
    };

    const handleSelectItem = (option: FilterOption) => {
        applyFilter(option);
        resetNavigation();
        setOpen(false);
    };

    if (!onSelectSourceFilter && !onSelectTargetFilter && !onSelectEquipmentFilter && !onSelectPrayerFilter) {
        return null;
    }

    const placeholder = activeCategory
        ? `Search ${CATEGORY_LABELS[activeCategory].toLowerCase()}...`
        : isMobile
            ? 'Filter'
            : 'Filter by source, targets, equipment, and more...';

    const noOptionsText = activeCategory ? 'No options' : 'No filter categories';

    return (
        <div
            className="filter-search-bar"
            style={{maxWidth: `${layout.contentMaxWidth}px`}}
        >
            <Popover open={open} onOpenChange={handleOpenChange}>
                <PopoverAnchor asChild>
                    <div className="filter-search-bar__anchor">
                        <div className="filter-search-bar__input-row">
                            <button
                                type="button"
                                className={cn(
                                    'filter-search-bar__start-icon',
                                    activeCategory && 'filter-search-bar__start-icon--back',
                                )}
                                aria-label={activeCategory ? 'Back to categories' : undefined}
                                onMouseDown={(event) => {
                                    if (!activeCategory) {
                                        return;
                                    }
                                    event.preventDefault();
                                    goBackToCategories();
                                }}
                            >
                                {activeCategory ? (
                                    <ArrowLeft size={20}/>
                                ) : (
                                    <ListFilter size={20}/>
                                )}
                            </button>
                            <input
                                type="text"
                                className="filter-search-bar__input"
                                value={inputValue}
                                placeholder={placeholder}
                                onChange={(event) => {
                                    setInputValue(event.target.value);
                                    setOpen(true);
                                }}
                                onFocus={() => setOpen(true)}
                                onKeyDown={(event) => {
                                    if (event.key === 'Backspace' && !inputValue && activeCategory) {
                                        event.preventDefault();
                                        goBackToCategories();
                                    }
                                }}
                            />
                        </div>
                    </div>
                </PopoverAnchor>
                <PopoverContent
                    align="start"
                    sideOffset={4}
                    className="filter-search-bar__dropdown"
                    onOpenAutoFocus={(event) => event.preventDefault()}
                >
                    <ul className="filter-search-bar__list" role="listbox">
                        {displayedOptions.length === 0 ? (
                            <li className="filter-search-bar__empty">{noOptionsText}</li>
                        ) : (
                            displayedOptions.map((option) => {
                                if (option.type === 'back') {
                                    return (
                                        <li key={getDisplayOptionKey(option)}>
                                            <button
                                                type="button"
                                                className="filter-search-bar__option filter-search-bar__option--back"
                                                onMouseDown={(event) => event.preventDefault()}
                                                onClick={() => goBackToCategories()}
                                            >
                                                <ArrowLeft size={16}/>
                                                <span>{option.label}</span>
                                            </button>
                                        </li>
                                    );
                                }

                                if (option.type === 'category') {
                                    return (
                                        <li key={getDisplayOptionKey(option)}>
                                            <button
                                                type="button"
                                                className="filter-search-bar__option filter-search-bar__option--category"
                                                onMouseDown={(event) => event.preventDefault()}
                                                onClick={() => handleSelectCategory(option.category)}
                                            >
                                                <span>{option.label}</span>
                                                <ChevronRight size={16} className="filter-search-bar__chevron"/>
                                            </button>
                                        </li>
                                    );
                                }

                                const showCategory = Boolean(inputValue.trim());
                                const isEquipment = option.option.kind === 'equipment';
                                const isPrayer = option.option.kind === 'prayer';
                                let imageUrl: string | undefined;
                                if (option.option.kind === 'equipment') {
                                    imageUrl = getItemImageUrl(option.option.filter.id);
                                } else if (option.option.kind === 'prayer') {
                                    imageUrl = getPrayerImageUrl(option.option.filter.id);
                                }
                                const showIconColumn = isEquipment || isPrayer;

                                return (
                                    <li key={getDisplayOptionKey(option)}>
                                        <button
                                            type="button"
                                            className="filter-search-bar__option filter-search-bar__option--item"
                                            onMouseDown={(event) => event.preventDefault()}
                                            onClick={() => handleSelectItem(option.option)}
                                        >
                                            {showIconColumn && (
                                                <span
                                                    className="filter-search-bar__icon-column"
                                                    style={{width: FILTER_ICON_COLUMN_WIDTH, minWidth: FILTER_ICON_COLUMN_WIDTH}}
                                                >
                                                    {imageUrl && (
                                                        <img
                                                            src={imageUrl}
                                                            alt=""
                                                            className="filter-search-bar__icon-image"
                                                            style={{
                                                                maxHeight: FILTER_ICON_MAX_SIZE,
                                                                maxWidth: FILTER_ICON_MAX_SIZE,
                                                                backgroundColor: isEquipment
                                                                    ? colors.background.tableHeadAlt
                                                                    : 'transparent',
                                                            }}
                                                        />
                                                    )}
                                                </span>
                                            )}
                                            <span className="filter-search-bar__option-text">
                                                {showCategory ? (
                                                    <>
                                                        <span className="filter-search-bar__option-primary">
                                                            {option.label}
                                                        </span>
                                                        <span className="filter-search-bar__option-secondary">
                                                            {getCategoryLabel(option.option)}
                                                        </span>
                                                    </>
                                                ) : (
                                                    <span className="filter-search-bar__option-primary">
                                                        {option.label}
                                                    </span>
                                                )}
                                            </span>
                                        </button>
                                    </li>
                                );
                            })
                        )}
                    </ul>
                </PopoverContent>
            </Popover>
        </div>
    );
};

export default FilterSearchBar;
