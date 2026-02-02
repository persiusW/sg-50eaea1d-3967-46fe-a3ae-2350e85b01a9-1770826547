/** @type {import('next-sitemap').IConfig} */
module.exports = {
    siteUrl: 'https://www.transparentturtle.com',
    generateRobotsTxt: true,

    // Keep Google away from admin & APIs
    exclude: ['/admin/*', '/api/*'],

    robotsTxtOptions: {
        policies: [
            { userAgent: '*', allow: '/', disallow: ['/admin', '/api'] },
        ],
    },
};