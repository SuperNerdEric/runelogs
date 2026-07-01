import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './App.css';
import {SnackbarProvider} from 'notistack';
import {Auth0Provider} from "@auth0/auth0-react";
import {BrowserRouter, Navigate, Route, Routes, useParams} from 'react-router-dom';
import TopBar from "./components/TopBar";
import SiteFooter from "./components/SiteFooter";
import Upload from "./components/Upload";
import Log from "./components/Log/Log";
import Logs from "./components/Logs";
import LogsPageHeaderVariants from "./components/dev/LogsPageHeaderVariants";
import theme from './theme';
import ThemeVariables from './theme/ThemeVariables';
import {ThemeProvider} from "@mui/material";
import Encounter from "./components/Encounter";
import FightGroupSummary from "./components/FightGroupSummary";
import Player from "./components/Player";
import Home from "./components/Home";
import Help from "./components/Help";
import Privacy from "./components/Privacy";
import About from "./components/About";
import Blog from "./components/Blog";
import BlogPostPage from "./components/BlogPostPage";
import LeaderboardsPage from "./components/LeaderboardsPage";
import RecentEncountersPage from "./components/RecentEncountersPage";
import LiveLog from "./components/LiveLog";
import Login from "./components/Login";
import Logout from "./components/Logout";
import MyProfile from "./components/MyProfile";
import Admin from "./components/Admin";
import {initGA} from "./Analytics";
import usePageTracking from "./hooks/usePageTracking";
import SessionGuard from "./components/SessionGuard";
import {UserProfileProvider} from "./hooks/useUserProfile";
import {getRunSummaryHref, RUN_SUMMARY_PATH} from "./utils/encounterTableRow";

const domain = "auth.runelogs.com";
const clientId = "vNPXVhAvOj2ES9kqi5WPs80SnX8FPKqv";

const root = ReactDOM.createRoot(
    document.getElementById('root') as HTMLElement
);

initGA();

function FightGroupUrlRedirect() {
    const {id} = useParams<{id: string}>();
    return <Navigate to={getRunSummaryHref(id!)} replace/>;
}

function AppRoutes() {
    usePageTracking();

    return (
        <div className="app-layout">
            <TopBar/>
            <main className="app-main-content">
                <Routes>
                <Route path="/" element={<Home/>}/>
                <Route path="/login" element={<Login />} />
                <Route path="/logout" element={<Logout />} />
                <Route path="/help" element={<Help/>}/>
                <Route path="/about" element={<About/>}/>
                <Route path="/blog" element={<Blog/>}/>
                <Route path="/blog/:slug" element={<BlogPostPage/>}/>
                <Route path="/privacy" element={<Privacy/>}/>
                <Route path="/player/:playerName" element={<Player/>}/>
                <Route path="/encounter/:id" element={<Encounter />} />
                <Route path="/encounter/aggregate/:id" element={<Encounter />} />
                <Route path={`${RUN_SUMMARY_PATH}/:id`} element={<FightGroupSummary />} />
                <Route path="/fight-group/:id" element={<FightGroupUrlRedirect />} />
                <Route path="/upload" element={<Upload/>}/>
                <Route path="/leaderboards" element={<LeaderboardsPage/>}/>
                <Route path="/recent-encounters" element={<RecentEncountersPage/>}/>
                <Route path="/live-log" element={<LiveLog/>}/>
                <Route path="/profile" element={<MyProfile/>}/>
                <Route path="/profile/:profileId" element={<MyProfile/>}/>
                <Route path="/log/:logId" element={<Log/>}/>
                <Route path="/logs/:uploaderId" element={<Logs/>}/>
                <Route path="/admin" element={<Admin/>}/>
                <Route path="/dev/logs-header-variants" element={<LogsPageHeaderVariants/>}/>
            </Routes>
            </main>
            <SiteFooter/>
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
                    <ThemeVariables />
                    <BrowserRouter>
                        <SessionGuard />
                        <UserProfileProvider>
                            <AppRoutes />
                        </UserProfileProvider>
                    </BrowserRouter>
                </ThemeProvider>
            </Auth0Provider>
        </SnackbarProvider>
    </React.StrictMode>
);
