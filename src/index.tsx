import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './App.css';
import {SnackbarProvider} from 'notistack';
import reportWebVitals from './reportWebVitals';
import {Auth0Provider} from "@auth0/auth0-react";
import {BrowserRouter, Route, Routes} from 'react-router-dom';
import TopBar from "./components/TopBar";
import Upload from "./components/Upload";
import Log from "./components/Log/Log";
import Logs from "./components/Logs";
import theme from './theme';
import {ThemeProvider} from "@mui/material";
import Leaderboard from "./components/Leaderboard";
import Encounter from "./components/Encounter";
import Player from "./components/Player";

const domain = "auth.runelogs.com";
const clientId = "vNPXVhAvOj2ES9kqi5WPs80SnX8FPKqv";

const root = ReactDOM.createRoot(
    document.getElementById('root') as HTMLElement
);
root.render(
    <React.StrictMode>
        <SnackbarProvider anchorOrigin={{vertical: 'top', horizontal: 'center'}}>
            <Auth0Provider
                domain={domain}
                clientId={clientId}
                authorizationParams={{
                    redirect_uri: window.location.origin,
                    audience: "https://api.runelogs.com",
                    scope: "openid profile email offline_access"
                }}
                cacheLocation="localstorage"
                useRefreshTokens={true}
            >
                <ThemeProvider theme={theme}>
                    <BrowserRouter>
                        <div className="app-layout">
                            <TopBar/>
                            <Routes>
                                <Route path="/" element={<Leaderboard/>}/>
                                <Route path="/player/:playerName" element={<Player/>}/>
                                <Route path="/encounter/:id" element={<Encounter />} />
                                <Route path="/upload" element={<Upload/>}/>
                                <Route path="/log/:logId" element={<Log/>}/>
                                <Route path="/logs/:uploaderId" element={<Logs/>}/>
                            </Routes>
                        </div>
                    </BrowserRouter>
                </ThemeProvider>
            </Auth0Provider>
        </SnackbarProvider>
    </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
