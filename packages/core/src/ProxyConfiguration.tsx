/**
 * Proxy server configuration.
 */
class ProxyConfiguration {
    constructor(
        /**
         * Proxy type.
         */
        readonly type: ProxyType,
        /**
         * Proxy address. Can be either in the IP address format, ex. "1.1.1.1", or hostname, ex. "example.com".
         */
        readonly address: string,
        /**
         * Proxy port.
         */
        readonly port: number,
        /**
         * Username for Basic authentication scheme.
         *
         * Note: in case of Android, credentials are working out of the box only for "http" or "https" proxy types.
         * In case of "socks" type you need to create a native module which will set "java.net.Authenticator", because
         * OkHttp library doesn't support SOCKS+authentication proxy scheme.
         */
        readonly username?: string,
        /**
         * Password for Basic authentication scheme.
         */
        readonly password?: string
    ) { }
}

enum ProxyType {
    HTTP = "http",
    HTTPS = "https",
    SOCKS = "socks"
}

export { ProxyConfiguration, ProxyType }
