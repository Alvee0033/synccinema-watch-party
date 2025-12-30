const { onRequest } = require("firebase-functions/v2/https");
const next = require("next");

const nextApp = next({
    dev: false,
    conf: {
        distDir: ".next",
    },
});

const handle = nextApp.getRequestHandler();

exports.nextjsFunc = onRequest(
    {
        memory: "1GiB",
        timeoutSeconds: 60,
        maxInstances: 10,
    },
    async (req, res) => {
        await nextApp.prepare();
        return handle(req, res);
    }
);
