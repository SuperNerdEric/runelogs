import {useCombobox} from 'downshift';
import {fuzzyFilter} from 'fuzzbunny';
import React, {useMemo, useRef, useState,} from 'react';
import {Virtuoso, VirtuosoHandle} from 'react-virtuoso';

type ComboboxItem = { label: string, version?: string, value: string | number };

interface IComboboxProps<T> {
    id: string;
    items: T[];
    placeholder?: string;
    onSelectedItemChange?: (item: T | null | undefined) => void;
}

const Combobox = <T extends ComboboxItem>(props: IComboboxProps<T>) => {
    const {
        id,
        items,
        onSelectedItemChange,
        placeholder,
    } = props;
    const [inputValue, setInputValue] = useState<string>('');
    const inputRef = useRef<HTMLInputElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const virtuosoRef = useRef<VirtuosoHandle>(null);
    const [listHeight, setListHeight] = useState(200);

    const preprocessedItems = useMemo(() => items.map((item) => ({
        item,
        valueToFilter: `${item.label} ${item.version ? item.version : ''}`
    })), [items]);

    const filteredItems = useMemo(() => {
        // When the input value changes, change the filtered items
        if (inputValue) {
            let newFilteredItems = fuzzyFilter(preprocessedItems, inputValue, {fields: ['valueToFilter']}).map((match) => match.item.item);

            return newFilteredItems;
        }

        return items;
    }, [inputValue, items, preprocessedItems]);

    const {
        getInputProps,
        getItemProps,
        getMenuProps,
        highlightedIndex,
        isOpen,
        reset,
        setHighlightedIndex,
    } = useCombobox({
        id,
        items: filteredItems,
        inputValue,
        onInputValueChange: ({inputValue: newValue}) => {
            setInputValue(newValue || '');
            setHighlightedIndex(0);
        },
        onSelectedItemChange: ({selectedItem}) => {
            if (onSelectedItemChange) {
                onSelectedItemChange(selectedItem);
            }
            reset();
        },
        scrollIntoView: () => {
        },
        onHighlightedIndexChange: (changes) => {
            if (
                virtuosoRef.current
                && changes.type !== useCombobox.stateChangeTypes.MenuMouseLeave
                && changes.highlightedIndex !== undefined
            ) {
                virtuosoRef.current.scrollIntoView({index: changes.highlightedIndex});
            }
        }
    });

    return (
        <div>
            <input
                className='combobox-input'
                {...getInputProps({
                    ref: inputRef, open: isOpen, type: 'text', placeholder: (placeholder || 'Search...'),
                })}
            />
            <div
                className={`combobox ${(isOpen && filteredItems.length) ? 'opacity-100' : 'opacity-0'}`}
                {...getMenuProps({
                    ref: menuRef,
                })}
            >
                {!isOpen || !filteredItems.length ? null : (
                    <div style={{height: listHeight, maxHeight: '500px', width: 250}}>
                        <Virtuoso
                            ref={virtuosoRef}
                            data={filteredItems}
                            totalListHeightChanged={setListHeight}
                            itemContent={(i, d) => {
                                return (
                                    <div
                                        className={
                                            `${(highlightedIndex === i) ? 'combobox-hover' : ''}`
                                        }
                                        {...getItemProps({
                                            index: i,
                                            item: d,
                                        })}
                                    >
                                        {d.label}
                                    </div>
                                );
                            }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default Combobox;
