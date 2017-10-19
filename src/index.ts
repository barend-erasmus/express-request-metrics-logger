import * as express from 'express';
import * as onHeaders from 'on-headers';
import * as StatsdClient from "statsd-client";
import * as winston from 'winston';

export function ExpressRequestMetricsLogger(opt: any) {
    const options: {
        applicationName: string,
        filename: string,
        token: string,
    } = opt;

    const logger = new (winston.Logger)({
        transports: [
            new (winston.transports.Console)({ level: 'debug' }),
            new (winston.transports.File)({
                filename: options.filename || './http-request.log',
                level: 'debug',
            }),
        ],
    });

    const statsdClient = new StatsdClient({ host: "open-stats.openservices.co.za" });

    return (req: express.Request, res: express.Response, next: express.NextFunction) => {
        const start = Date.now();

        onHeaders(res, () => {
            const duration: number = Date.now() - start;

            logger.info(`HTTP Request: ${res.statusCode} ${req.method} ${duration}ms ${req.url}`);

            statsdClient.timing('HTTPResponseTime', duration, {
                application: options.applicationName,
                method: req.method,
                statusCode: res.statusCode,
                token: options.token || 'express-request-metrics-logger',
                url: req.url,
            });

            statsdClient.counter('HTTPRequest', 1, {
                application: options.applicationName,
                method: req.method,
                statusCode: res.statusCode,
                token: options.token || 'express-request-metrics-logger',
                url: req.url,

            });
        });

        next();
    };
}
