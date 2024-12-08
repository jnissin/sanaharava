export default async function sitemap() {
    return [
        {
            url: 'https://sanaharava.fi',
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1.0,
        },
        // TODO: Possibly add an info page for better SEO
    ]
}