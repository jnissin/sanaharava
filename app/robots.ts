export default function robots() {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/api/', '/private/']
        },
        sitemap: 'https://sanaharava.fi/sitemap.xml',
        host: 'https://sanaharava.fi'
    }
}