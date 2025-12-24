const db = require('../../connectors/db');
const { getSessionToken , getUser } = require('../../utils/session');
const axios = require('axios');
require('dotenv').config();
const PORT = process.env.PORT || 3001;

function handlePrivateFrontEndView(app) {

    app.get('/dashboard' , async (req , res) => {
        
        const user = await getUser(req);
        if(user.role == "truckOwner"){
            return res.redirect('/ownerDashboard');
        }
        // role of customer
        return res.render('customerHomepage' , {name : user.name});
    });

    app.get('/trucks', async (req, res) => {
        const user = await getUser(req);
        if (user.role !== 'customer') {
            return res.status(403).send('Forbidden');
        }
        return res.render('trucks');
    });

    app.get('/truckMenu/:truckId', async (req, res) => {
        const user = await getUser(req);
        if (user.role !== 'customer') {
            return res.status(403).send('Forbidden');
        }
        return res.render('truckMenu', { truckId: req.params.truckId });
    });

    app.get('/cart', async (req, res) => {
        const user = await getUser(req);
        if (user.role !== 'customer') {
            return res.status(403).send('Forbidden');
        }
        return res.render('cart');
    });

    app.get('/myOrders', async (req, res) => {
        const user = await getUser(req);
        if (user.role !== 'customer') {
            return res.status(403).send('Forbidden');
        }
        return res.render('myOrders');
    });

    app.get('/ownerDashboard', async (req, res) => {
        const user = await getUser(req);
        if (user.role !== 'truckOwner') {
            return res.status(403).send('Forbidden');
        }
        return res.render('ownerDashboard', { name: user.name });
    });

    app.get('/menuItems', async (req, res) => {
        const user = await getUser(req);
        if (user.role !== 'truckOwner') {
            return res.status(403).send('Forbidden');
        }
        return res.render('menuItems');
    });

    app.get('/addMenuItem', async (req, res) => {
        const user = await getUser(req);
        if (user.role !== 'truckOwner') {
            return res.status(403).send('Forbidden');
        }
        return res.render('addMenuItem');
    });

    app.get('/truckOrders', async (req, res) => {
        const user = await getUser(req);
        if (user.role !== 'truckOwner') {
            return res.status(403).send('Forbidden');
        }
        return res.render('truckOrders');
    });

    app.get('/testingAxios' , async (req , res) => {

        try {
            const result = await axios.get(`http://localhost:${PORT}/test`);
            return res.status(200).send(result.data);
        } catch (error) {
            console.log("error message",error.message);
            return res.status(400).send(error.message);
        }
      
    });  
}  
  
module.exports = {handlePrivateFrontEndView};
  