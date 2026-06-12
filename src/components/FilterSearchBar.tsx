import React, {useMemo, useRef, useState} from 'react';
import {
    Autocomplete,
    Box,
    InputAdornment,
    ListItemIcon,
    ListItemText,
    TextField,
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import {Fight} from "../models/Fight";
import {LogTypes} from "../models/LogLine";
import {ActorFilter} from "../utils/actorFilter";
import {EquipmentFilter} from "../utils/equipmentFilter";
import {colors} from "../theme";
import {getActorFromLog} from "../utils/actorUtils";
import {itemIdMap} from "../lib/itemIdMap";
import {getItemImageUrl} from "./replay/PlayerEquipment";

export type FilterOption =
    | { kind: 'source'; label: string; filter: ActorFilter }
    | { kind: 'target'; label: string; filter: ActorFilter }
    | { kind: 'equipment'; label: string; filter: EquipmentFilter };

type FilterCategory = FilterOption['kind'];

type DisplayOption =
    | { type: 'category'; category: FilterCategory; label: string }
    | { type: 'item'; option: FilterOption; label: string };

interface FilterSearchBarProps {
    fight: Fight;
    onSelectSourceFilter?: (filter: ActorFilter) => void;
    onSelectTargetFilter?: (filter: ActorFilter) => void;
    onSelectEquipmentFilter?: (filter: EquipmentFilter) => void;
}

const CATEGORY_LABELS: Record<FilterCategory, string> = {
    source: 'Source',
    target: 'Target',
    equipment: 'Equipment',
};

const getCategoryLabel = (option: FilterOption): string => CATEGORY_LABELS[option.kind];

const FilterSearchBar: React.FC<FilterSearchBarProps> = ({
    fight,
    onSelectSourceFilter,
    onSelectTargetFilter,
    onSelectEquipmentFilter,
}) => {
    const [inputValue, setInputValue] = useState('');
    const [open, setOpen] = useState(false);
    const [activeCategory, setActiveCategory] = useState<FilterCategory | null>(null);
    const keepOpenRef = useRef(false);

    const itemOptions = useMemo(() => {
        const sourceNames = new Set<string>();
        const targetNames = new Set<string>();
        const equipmentItems = new Map<number, string>();

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

        return filterOptions;
    }, [fight.data]);

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
            return itemOptions
                .filter((option) => option.kind === activeCategory)
                .map((option) => ({
                    type: 'item' as const,
                    option,
                    label: option.label,
                }));
        }

        const categories: FilterCategory[] = ['source', 'target', 'equipment'];
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
        } else {
            onSelectEquipmentFilter?.(option.filter);
        }
    };

    const resetNavigation = () => {
        setActiveCategory(null);
        setInputValue('');
    };

    if (!onSelectSourceFilter && !onSelectTargetFilter && !onSelectEquipmentFilter) {
        return null;
    }

    return (
        <Box sx={{width: '100%', maxWidth: '1000px', mb: 1}}>
            <Autocomplete
                open={open}
                onOpen={() => setOpen(true)}
                onClose={(_, reason) => {
                    if (keepOpenRef.current) {
                        keepOpenRef.current = false;
                        return;
                    }
                    if (reason === 'selectOption') {
                        return;
                    }
                    setOpen(false);
                    setActiveCategory(null);
                }}
                options={displayedOptions}
                inputValue={inputValue}
                onInputChange={(_, newValue, reason) => {
                    if (reason === 'reset') {
                        setInputValue('');
                        return;
                    }
                    setInputValue(newValue);
                }}
                getOptionLabel={(option) => option.label}
                isOptionEqualToValue={(option, value) =>
                    option.type === value.type && option.label === value.label
                }
                filterOptions={(options) => options}
                noOptionsText={activeCategory ? 'No options' : 'No filter categories'}
                onChange={(_, option) => {
                    if (!option) {
                        return;
                    }

                    if (option.type === 'category') {
                        keepOpenRef.current = true;
                        setActiveCategory(option.category);
                        setInputValue('');
                        setOpen(true);
                        return;
                    }

                    applyFilter(option.option);
                    resetNavigation();
                    setOpen(false);
                }}
                renderOption={(props, option) => {
                    if (option.type === 'category') {
                        const {key, onClick: _onClick, ...optionProps} = props;
                        return (
                            <Box
                                component="li"
                                key={key}
                                {...optionProps}
                                onClick={(event) => {
                                    event.preventDefault();
                                    event.stopPropagation();
                                    keepOpenRef.current = true;
                                    setActiveCategory(option.category);
                                    setInputValue('');
                                    setOpen(true);
                                }}
                                sx={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}
                            >
                                <ListItemText primary={option.label}/>
                                <ListItemIcon sx={{minWidth: 'auto', color: 'grey'}}>
                                    <ChevronRightIcon fontSize="small"/>
                                </ListItemIcon>
                            </Box>
                        );
                    }

                    const showCategory = Boolean(inputValue.trim());
                    const isEquipment = option.option.kind === 'equipment';

                    return (
                        <Box
                            component="li"
                            {...props}
                            key={`${option.option.kind}-${option.label}`}
                            sx={{display: 'flex', alignItems: 'center', gap: 1}}
                        >
                            {isEquipment && (
                                <Box
                                    component="img"
                                    src={getItemImageUrl(option.option.filter.id)}
                                    alt=""
                                    sx={{
                                        width: 22,
                                        height: 22,
                                        flexShrink: 0,
                                        backgroundColor: colors.background.tableHeadAlt,
                                    }}
                                />
                            )}
                            {showCategory ? (
                                <ListItemText
                                    primary={option.label}
                                    secondary={getCategoryLabel(option.option)}
                                    secondaryTypographyProps={{sx: {color: 'lightblue', fontSize: '0.75rem'}}}
                                />
                            ) : (
                                <ListItemText primary={option.label}/>
                            )}
                        </Box>
                    );
                }}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        placeholder={
                            activeCategory
                                ? `Search ${CATEGORY_LABELS[activeCategory].toLowerCase()}...`
                                : 'Search sources, targets, or equipment...'
                        }
                        size="small"
                        InputProps={{
                            ...params.InputProps,
                            startAdornment: (
                                <>
                                    <InputAdornment position="start">
                                        <FilterListIcon sx={{color: 'grey'}}/>
                                    </InputAdornment>
                                    {params.InputProps.startAdornment}
                                </>
                            ),
                        }}
                        sx={{
                            '& .MuiInputBase-root': {
                                bgcolor: colors.background.surface,
                                color: 'white',
                            },
                            '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'grey',
                            },
                            '& .MuiSvgIcon-root': {
                                color: 'grey',
                            },
                        }}
                    />
                )}
                componentsProps={{
                    popper: {
                        placement: 'bottom-start',
                        modifiers: [
                            {
                                name: 'flip',
                                enabled: true,
                                options: {
                                    fallbackPlacements: ['bottom-start', 'bottom', 'top-start', 'top'],
                                },
                            },
                        ],
                    },
                    paper: {
                        sx: {
                            bgcolor: colors.background.surfaceMenu,
                            color: 'white',
                        },
                    },
                }}
                blurOnSelect={false}
                clearOnBlur={false}
                handleHomeEndKeys
                value={null}
            />
        </Box>
    );
};

export default FilterSearchBar;
