const express = require('express');

const app = express();
const port = 3000;


app.use(express.json());
app.use(express.urlencoded({ extended: true }));


const createPurchaseAPIRouter = require('./src/routes/createPurchaseAPI');

app.use('/api/createPurchaseAPI', createPurchaseAPIRouter);


app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
