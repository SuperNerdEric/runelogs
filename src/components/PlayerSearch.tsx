import React, {useEffect, useRef, useState} from 'react';
import {Box, List, ListItem, Paper, Popper, TextField} from '@mui/material';
import {useNavigate} from 'react-router-dom';

interface PlayerSearchProps {
    onSelect?: () => void;
}

const PlayerSearch: React.FC<PlayerSearchProps> = ({ onSelect }) => {
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
            fetch(`https://api.runelogs.com/player-search/${encodeURIComponent(input)}`)
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
        <Box position="relative">
            <TextField
                inputRef={anchorRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search for a player"
                size="small"
                sx={{
                    input: {color: 'white'},
                    backgroundColor: '#141414',
                    width: 200,
                }}
            />
            <Popper open={open && results.length > 0} anchorEl={anchorRef.current} placement="bottom-start">
                <Paper sx={{backgroundColor: '#1f1f1f', width: 250}}>
                    <List>
                        {results.map((name, idx) => (
                            <ListItem
                                key={name}
                                button
                                selected={idx === highlightedIndex}
                                onClick={() => handleClick(name)}
                                sx={{
                                    '&.Mui-selected': {backgroundColor: '#2e2e2e'},
                                    '&:hover': {backgroundColor: '#333'},
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
