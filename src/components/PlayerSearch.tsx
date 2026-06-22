import React, {useEffect, useRef, useState} from 'react';
import {Box, List, ListItem, Paper, Popper, TextField} from '@mui/material';
import {useNavigate} from 'react-router-dom';
import {colors} from '../theme';

interface PlayerSearchProps {
    onSelect?: () => void;
    fullWidth?: boolean;
}

const PlayerSearch: React.FC<PlayerSearchProps> = ({ onSelect, fullWidth = false }) => {
    const [input, setInput] = useState('');
    const [results, setResults] = useState<string[]>([]);
    const [open, setOpen] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(0);
    const anchorRef = useRef<HTMLInputElement>(null);
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
                    setResults(data.matches.slice(0, 6) || []); // Limit to 6 results
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

    return (
        <Box
            position="relative"
            sx={{
                height: '40px',
                width: fullWidth ? '100%' : undefined,
                maxWidth: fullWidth ? '100%' : undefined,
                boxSizing: 'border-box',
            }}
        >
            <TextField
                inputRef={anchorRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search for a player"
                size="small"
                fullWidth={fullWidth}
                sx={{
                    input: {color: 'white', textAlign: 'left'},
                    backgroundColor: colors.background.surface,
                    width: fullWidth ? '100%' : 200,
                    maxWidth: '100%',
                    boxSizing: 'border-box',
                    ...(fullWidth ? {m: 0} : {}),
                }}
            />
            <Popper
                open={open && results.length > 0}
                anchorEl={anchorRef.current}
                placement="bottom-start"
                sx={{width: fullWidth ? '100%' : undefined, maxWidth: fullWidth ? '100%' : undefined, zIndex: 1300, boxSizing: 'border-box'}}
            >
                <Paper sx={{backgroundColor: colors.background.surfaceDropdown, width: fullWidth ? '100%' : 250, maxWidth: '100%', boxSizing: 'border-box'}}>
                    <List>
                        {results.map((name, idx) => (
                            <ListItem
                                key={name}
                                button
                                selected={idx === highlightedIndex}
                                onClick={() => handleClick(name)}
                                sx={{
                                    '&.Mui-selected': {backgroundColor: colors.background.surfaceSelected},
                                    '&:hover': {backgroundColor: colors.background.hover},
                                    color: 'white'
                                }}
                            >
                                {name}
                            </ListItem>
                        ))}
                    </List>
                </Paper>
            </Popper>
        </Box>
    );
};

export default PlayerSearch;
