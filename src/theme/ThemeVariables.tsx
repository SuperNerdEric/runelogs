import {cssVariables} from './cssVariables';

export default function ThemeVariables() {
    const cssText = `:root { ${Object.entries(cssVariables)
        .map(([key, value]) => `${key}: ${value};`)
        .join(' ')} }`;

    return <style>{cssText}</style>;
}
