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

  app.get('/api/v1/menuItem/view/:itemId', async (req, res) => {
    try {
      const user = await getUser(req);
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      if (user.role !== 'truckOwner') {
        return res.status(403).json({ error: 'Forbidden: Only truck owners can view menu items' });
      }
      if (!user.truckId) {
        return res.status(404).json({ error: 'User has no truck' });
      }
      const itemId = parseInt(req.params.itemId);
      if (isNaN(itemId)) {
        return res.status(400).json({ error: 'Invalid itemId' });
      }
      const menuItem = await db('FoodTruck.MenuItems')
        .where({ itemId, truckId: user.truckId })
        .first();
      if (!menuItem) {
        return res.status(404).json({ error: 'Menu item not found' });
      }
      return res.status(200).json(menuItem);
    } catch (err) {
      console.log('error message', err.message);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.put('/api/v1/menuItem/edit/:itemId', async (req, res) => {
    try {
      const user = await getUser(req);
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      if (user.role !== 'truckOwner') {
        return res.status(403).json({ error: 'Forbidden: Only truck owners can edit menu items' });
      }
      if (!user.truckId) {
        return res.status(404).json({ error: 'User has no truck' });
      }
      const itemId = parseInt(req.params.itemId);
      if (isNaN(itemId)) {
        return res.status(400).json({ error: 'Invalid itemId' });
      }
      const existingItem = await db('FoodTruck.MenuItems')
        .where({ itemId, truckId: user.truckId })
        .first();
      if (!existingItem) {
        return res.status(404).json({ error: 'Menu item not found' });
      }
      const { name, description, price, category, status } = req.body;
      const updateData = {};
      if (name !== undefined) {
        if (typeof name !== 'string' || name.trim().length === 0) {
          return res.status(400).json({ error: 'Name must be a non-empty string' });
        }
        updateData.name = name.trim();
      }
      if (description !== undefined) {
        updateData.description = description;
      }
      if (price !== undefined) {
        if (typeof price !== 'number' || price <= 0) {
          return res.status(400).json({ error: 'Price must be a positive number' });
        }
        updateData.price = price;
      }
      if (category !== undefined) {
        if (typeof category !== 'string' || category.trim().length === 0) {
          return res.status(400).json({ error: 'Category must be a non-empty string' });
        }
        updateData.category = category.trim();
      }
      if (status !== undefined) {
        updateData.status = status;
      }
      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ error: 'At least one field must be provided for update' });
      }
      const [updatedItem] = await db('FoodTruck.MenuItems')
        .where({ itemId, truckId: user.truckId })
        .update(updateData)
        .returning('*');
      return res.status(200).json(updatedItem);
    } catch (err) {
      console.log('error message', err.message);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/v1/trucks/myTruck', async (req, res) => {
    try {
      const user = await getUser(req);
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      if (user.role !== 'truckOwner') {
        return res.status(403).json({ error: 'Forbidden: Only truck owners can view their truck' });
      }
      if (!user.truckId) {
        return res.status(404).json({ error: 'User has no truck' });
      }
      const truck = await db('FoodTruck.Trucks')
        .where('truckId', user.truckId)
        .first();
      if (!truck) {
        return res.status(404).json({ error: 'Truck not found' });
      }
      return res.status(200).json(truck);
    } catch (err) {
      console.log('error message', err.message);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.put('/api/v1/trucks/updateOrderStatus', async (req, res) => {
    try {
      const user = await getUser(req);
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      if (user.role !== 'truckOwner') {
        return res.status(403).json({ error: 'Forbidden: Only truck owners can update order status' });
      }
      if (!user.truckId) {
        return res.status(404).json({ error: 'User has no truck' });
      }
      const { orderStatus } = req.body;
      if (!orderStatus || typeof orderStatus !== 'string') {
        return res.status(400).json({ error: 'orderStatus is required and must be a string' });
      }
      if (orderStatus !== 'available' && orderStatus !== 'unavailable') {
        return res.status(400).json({ error: 'orderStatus must be either "available" or "unavailable"' });
      }
      const truck = await db('FoodTruck.Trucks')
        .where('truckId', user.truckId)
        .first();
      if (!truck) {
        return res.status(404).json({ error: 'Truck not found' });
      }
      const [updatedTruck] = await db('FoodTruck.Trucks')
        .where('truckId', user.truckId)
        .update({ orderStatus })
        .returning('*');
      return res.status(200).json(updatedTruck);
    } catch (err) {
      console.log('error message', err.message);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });































};



module.exports = { handlePrivateBackendApi };

