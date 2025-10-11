import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './App.css';
import {SnackbarProvider} from 'notistack';
import {Auth0Provider} from "@auth0/auth0-react";
import {BrowserRouter, Route, Routes} from 'react-router-dom';
import TopBar from "./components/TopBar";
import Upload from "./components/Upload";
import Log from "./components/Log/Log";
import Logs from "./components/Logs";
import theme from './theme';
import {ThemeProvider} from "@mui/material";
import Encounter from "./components/Encounter";
import Player from "./components/Player";
import Home from "./components/Home";
import Help from "./components/Help";
import Login from "./components/Login";
import Logout from "./components/Logout";
import {initGA} from "./Analytics";
import usePageTracking from "./hooks/usePageTracking";
import SessionGuard from "./components/SessionGuard";

const domain = "auth.runelogs.com";
const clientId = "vNPXVhAvOj2ES9kqi5WPs80SnX8FPKqv";

const root = ReactDOM.createRoot(
    document.getElementById('root') as HTMLElement
);

initGA();

function AppRoutes() {
    usePageTracking();

    return (
        <div className="app-layout">
            <TopBar/>
            <Routes>
                <Route path="/" element={<Home/>}/>
                <Route path="/login" element={<Login />} />
                <Route path="/logout" element={<Logout />} />
                <Route path="/help" element={<Help/>}/>
                <Route path="/player/:playerName" element={<Player/>}/>
                <Route path="/encounter/:id" element={<Encounter />} />
                <Route path="/encounter/aggregate/:id" element={<Encounter />} />
                <Route path="/upload" element={<Upload/>}/>
                <Route path="/log/:logId" element={<Log/>}/>
                <Route path="/logs/:uploaderId" element={<Logs/>}/>
            </Routes>
        </div>
    );
}

root.render(
    <React.StrictMode>
        <SnackbarProvider anchorOrigin={{vertical: 'top', horizontal: 'center'}}>
            <Auth0Provider
                domain={domain}
                clientId={clientId}
                authorizationParams={{
                    redirect_uri: window.location.origin,
                    audience: "https://api.runelogs.com",
                    scope: "openid profile email offline_access create:logs"
                }}
                cacheLocation="localstorage"
                useRefreshTokens={true}
            >
                <ThemeProvider theme={theme}>
                    <BrowserRouter>
                        <SessionGuard />
                        <AppRoutes />
                    </BrowserRouter>
                </ThemeProvider>
            </Auth0Provider>
        </SnackbarProvider>
    </React.StrictMode>
);
