import ReactGA from 'react-ga4';

const TRACKING_ID = "G-XL7FZPRS36";

export const initGA = () => {
    ReactGA.initialize(TRACKING_ID);
};

export const trackPageview = (path: string) => {
    ReactGA.send({ hitType: 'pageview', page: path });
};
