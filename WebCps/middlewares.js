import routes from './routes.js';

export const localMiddleware = (req, res, next) => {
    res.locals.siteName = "Web CPS";
    res.locals.routes = routes;
    
    next();
};