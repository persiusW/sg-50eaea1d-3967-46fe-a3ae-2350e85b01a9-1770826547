/** @type {import('next-sitemap').IConfig} */
module.exports = {
    siteUrl: 'https://www.transparentturtle.com',
    generateRobotsTxt: true,
    sitemapSize: 7000,
    exclude: ['/admin/*', '/api/*'],
    robotsTxtOptions: {
        policies: [
            { userAgent: '*', allow: '/', disallow: ['/admin', '/api'] },
        ],
    },
};