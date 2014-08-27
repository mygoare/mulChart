requirejs.config({
    baseUrl: './lib',
    paths:
    {
        app: '../app'
    }
});

require(['app/main']);