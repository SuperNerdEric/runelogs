import React, {useEffect, useRef, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {Popover, PopoverAnchor, PopoverContent} from '@/components/ui/popover';
import {cn} from '@/lib/utils';

interface PlayerSearchProps {
    onSelect?: () => void;
    fullWidth?: boolean;
}

const PlayerSearch: React.FC<PlayerSearchProps> = ({onSelect, fullWidth = false}) => {
    const [input, setInput] = useState('');
    const [results, setResults] = useState<string[]>([]);
    const [open, setOpen] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();
    const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

    useEffect(() => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        if (!input) {
            setResults([]);
            setOpen(false);
            return;
        }

        timeoutRef.current = setTimeout(() => {
            fetch(`${import.meta.env.VITE_API_URL}/player-search/${encodeURIComponent(input)}`)
                .then(res => res.json())
                .then(data => {
                    setResults(data.matches.slice(0, 6) || []);
                    setOpen(true);
                    setHighlightedIndex(0);
                });
        }, 300);
    }, [input]);

    const clearSearch = () => {
        setInput('');
        setResults([]);
        setOpen(false);
        onSelect?.();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!open || results.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setHighlightedIndex((prev) => (prev + 1) % results.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHighlightedIndex((prev) => (prev - 1 + results.length) % results.length);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            navigate(`/player/${results[highlightedIndex]}`);
            clearSearch();
        } else if (e.key === 'Escape') {
            setOpen(false);
        }
    };

    const handleClick = (name: string) => {
        navigate(`/player/${name}`);
        clearSearch();
    };

    const showResults = open && results.length > 0;

    return (
        <Popover open={showResults} onOpenChange={setOpen}>
            <div
                className={cn(
                    'player-search',
                    fullWidth && 'player-search--full',
                )}
            >
                <PopoverAnchor asChild>
                    <input
                        ref={inputRef}
                        type="search"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Search for a player"
                        className="player-search__input"
                        autoComplete="off"
                        spellCheck={false}
                    />
                </PopoverAnchor>
                <PopoverContent
                    align="start"
                    sideOffset={0}
                    variant="playerSearch"
                    onOpenAutoFocus={(e) => e.preventDefault()}
                >
                    <ul className="player-search__list" role="listbox">
                        {results.map((name, idx) => (
                            <li
                                key={name}
                                role="option"
                                aria-selected={idx === highlightedIndex}
                                className={cn(
                                    'player-search__option',
                                    idx === highlightedIndex && 'player-search__option--highlighted',
                                )}
                                onMouseEnter={() => setHighlightedIndex(idx)}
                                onClick={() => handleClick(name)}
                            >
                                {name}
                            </li>
                        ))}
                    </ul>
                </PopoverContent>
            </div>
        </Popover>
    );
};

export default PlayerSearch;
