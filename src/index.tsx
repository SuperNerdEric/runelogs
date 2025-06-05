import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './components/App';
import {SnackbarProvider} from 'notistack';
import reportWebVitals from './reportWebVitals';
import {Auth0Provider} from "@auth0/auth0-react";
import {BrowserRouter} from 'react-router-dom';

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
                <BrowserRouter>
                    <App/>
                </BrowserRouter>
            </Auth0Provider>
        </SnackbarProvider>
    </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
