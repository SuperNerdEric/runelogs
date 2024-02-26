import React from 'react';
import {AppBar, Toolbar} from "@mui/material";
import DeleteIcon from '@mui/icons-material/Delete';
import {Icon} from '@iconify/react';
import logo from '../assets/Logo.png';

interface TopBarProps {
    onDeleteData?: () => void;
    showDeleteButton: boolean;
}

const TopBar: React.FC<TopBarProps> = ({onDeleteData, showDeleteButton}) => {
    return (
        <AppBar position="static" style={{background: '#141414'}}>
            <Toolbar style={{
                display: 'flex',
                justifyContent: 'space-between',
            }}>
                <div style={{display: 'flex', alignItems: 'center'}}>
                    <img
                        src={logo}
                        alt="Runelogs.com"
                        style={{
                            marginRight: '5px',
                            height: '25px',
                            verticalAlign: 'middle',
                        }}
                    />
                    <p style={{margin: '0', color: 'white', fontSize: '25px'}}>Runelogs</p>
                    <Icon
                        icon="clarity:beta-solid"
                        style={{
                            marginLeft: '10px'
                        }}
                    />
                </div>
                <div style={{display: 'flex', alignItems: 'center',}}>
                    {showDeleteButton && (
                        <DeleteIcon
                            onClick={onDeleteData}
                            style={{fontSize: 35, cursor: 'pointer', color: 'white', marginRight: '30px'}}
                        />
                    )}
                    <a href="https://discord.gg/ZydwX7AJEd" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '15px' }}>
                        <Icon
                            icon="logos:discord-icon"
                            style={{
                                width: '35px',
                                height: '35px',
                            }}
                        />
                    </a>
                    <a href="https://github.com/SuperNerdEric/runelogs" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon
                            icon="bi:github"
                            style={{
                                width: '35px',
                                height: '33px',
                            }}
                        />
                    </a>
                </div>
            </Toolbar>
        </AppBar>
    );
};

export default TopBar;
