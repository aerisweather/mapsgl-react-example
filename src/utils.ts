export const loadScript = (src: string): Promise<any> => new Promise<any>((resolve, reject) => {
    const script: HTMLScriptElement = document.createElement('script');
    script.type = 'text/javascript';
    script.async = true;
    script.src = src;
    // script.timeout = 120000;
    script.addEventListener('load', resolve);
    script.addEventListener('error', () => reject(new Error('Error loading script.')));
    script.addEventListener('abort', () => reject(new Error('Script loading aborted.')));
    document.body.append(script);
});

export const loadStyles = (src: string): Promise<any> => new Promise<any>((resolve, reject) => {
    const link = document.createElement('link');
    link.type = 'text/css';
    link.rel = 'stylesheet';
    link.addEventListener('load', () => { resolve(null); });
    link.href = src;

    const head = document.querySelectorAll('head');

    if (head) {
        head[0].append(link);
    }
});