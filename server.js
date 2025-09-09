const express = require('express');
const client = require('prom-client');

const app = express();
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics();

const httpRequestDurationMicroseconds = new client.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'code']
});

app.get('/', (req, res) => {
    res.send('Hello from Travel App sample!');
});

app.get('/api/hello', (req, res) => {
    res.json({ msg: 'Hello JSON' });
});

app.get('/metrics', async (req, res) => {
    res.set('Content-Type', client.register.contentType);
    res.end(await client.register.metrics());
});

const port = process.env.PORT || 8081;
app.listen(port, () => console.log(`App listening on ${port}`));
