const db = require('../../connectors/db');
const { getUser } = require('../../utils/session');

function handlePrivateBackendApi(app) {

  app.get('/test', async (req, res) => {
    try {
      return res.status(200).send("succesful connection");
    } catch (err) {
      console.log("error message", err.message);
      return res.status(400).send(err.message)
    }
  });

  app.post('/api/v1/menuItem/new', async (req, res) => {
    try {
      const user = await getUser(req);
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      if (user.role !== 'truckOwner') {
        return res.status(403).json({ error: 'Forbidden: Only truck owners can create menu items' });
      }
      if (!user.truckId) {
        return res.status(404).json({ error: 'User has no truck' });
      }
      const { name, description, price, category, status } = req.body;
      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({ error: 'Name is required and must be a non-empty string' });
      }
      if (price === undefined || price === null || typeof price !== 'number' || price <= 0) {
        return res.status(400).json({ error: 'Price is required and must be a positive number' });
      }
      if (!category || typeof category !== 'string' || category.trim().length === 0) {
        return res.status(400).json({ error: 'Category is required and must be a non-empty string' });
      }
      const menuItemData = {
        truckId: user.truckId,
        name: name.trim(),
        price: price,
        category: category.trim()
      };
      if (description !== undefined) {
        menuItemData.description = description;
      }
      if (status !== undefined) {
        menuItemData.status = status;
      } else {
        menuItemData.status = 'available';
      }
      const [createdItem] = await db('FoodTruck.MenuItems')
        .insert(menuItemData)
        .returning('*');
      return res.status(201).json(createdItem);
    } catch (err) {
      console.log('error message', err.message);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/v1/menuItem/view', async (req, res) => {
    try {
      const user = await getUser(req);
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      if (user.role !== 'truckOwner') {
        return res.status(403).json({ error: 'Forbidden: Only truck owners can view their menu items' });
      }
      if (!user.truckId) {
        return res.status(404).json({ error: 'User has no truck' });
      }
      const menuItems = await db('FoodTruck.MenuItems')
        .where('truckId', user.truckId)
        .orderBy('createdAt', 'desc');
      return res.status(200).json(menuItems);
    } catch (err) {
      console.log('error message', err.message);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });































};



module.exports = { handlePrivateBackendApi };

