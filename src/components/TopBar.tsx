import React from 'react';
import {AppBar, Toolbar} from "@mui/material";
import GitHubIcon from "@mui/icons-material/GitHub";
import DeleteIcon from '@mui/icons-material/Delete';
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
                </div>
                <div style={{display: 'flex', alignItems: 'center'}}>
                    {showDeleteButton && (
                        <DeleteIcon
                            onClick={onDeleteData}
                            style={{fontSize: 35, cursor: 'pointer', color: 'white', marginRight: '30px'}}
                        />
                    )}
                    <a href="https://github.com/SuperNerdEric/runelogs" target="_blank" style={{textDecoration: "none"}}
                       rel="noreferrer">
                        <GitHubIcon style={{
                            fontSize: 35,
                            color: "white"
                        }}/>
                    </a>
                </div>
            </Toolbar>
        </AppBar>
    );
};

export default TopBar;
