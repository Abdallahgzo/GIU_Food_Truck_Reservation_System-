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
    }
    catch (err) {
      console.log('error message', err.message);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });



  app.put('/api/v1/cart/edit/:cartId', async (req, res) => {
    try {
      const user = await getUser(req);
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      if (user.role !== 'customer') {
        return res.status(403).json({ error: 'Forbidden: Only customers can update cart items' });
      }
      const { cartId } = req.params;
      const { quantity } = req.body;
      if (quantity === undefined || quantity === null || typeof quantity !== 'number' || quantity <= 0 || !Number.isInteger(quantity)) {
        return res.status(400).json({ error: 'Quantity is required and must be a positive integer' });
      }
      const cartItem = await db('FoodTruck.Carts')
        .where({ cartId, userId: user.userId })
        .first();
      if (!cartItem) {
        return res.status(404).json({ error: 'Cart item not found' });
      }
      const [updatedCartItem] = await db('FoodTruck.Carts')
        .where({ cartId, userId: user.userId })
        .update({ quantity })
        .returning('*');
      return res.status(200).json(updatedCartItem);

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

  app.delete('/api/v1/cart/delete/:cartId', async (req, res) => {
    try {
      const user = await getUser(req);
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (user.role !== 'customer') {
        return res.status(403).json({ error: 'Forbidden: Only customers can delete cart items' });
      }
      const { cartId } = req.params;
      const cartItem = await db('FoodTruck.Carts')
        .where({ cartId, userId: user.userId })
        .first();
      if (!cartItem) {
        return res.status(404).json({ error: 'Cart item not found' });
      }
      await db('FoodTruck.Carts')
        .where({ cartId, userId: user.userId })
        .del();
      return res.status(200).json({ message: 'Cart item deleted successfully' });
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

  app.post('/api/v1/order/new', async (req, res) => {
    try {
      const user = await getUser(req);
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      if (user.role !== 'customer') {
        return res.status(403).json({ error: 'Forbidden: Only customers can place orders' });
      }
      const { scheduledPickupTime } = req.body;
      if (!scheduledPickupTime) {
        return res.status(400).json({ error: 'scheduledPickupTime is required' });
      }
      const cartItems = await db('FoodTruck.Carts')
        .join('FoodTruck.MenuItems', 'Carts.itemId', 'MenuItems.itemId')
        .where('Carts.userId', user.userId)
        .select('Carts.*', 'MenuItems.truckId', 'MenuItems.status as itemStatus', 'MenuItems.price as currentPrice');
      if (!cartItems || cartItems.length === 0) {
        return res.status(400).json({ error: 'Cart is empty' });
      }
      for (const cartItem of cartItems) {
        if (cartItem.itemStatus !== 'available') {
          return res.status(400).json({ error: 'One or more items in cart are no longer available' });
        }
      }
      const uniqueTruckIds = [...new Set(cartItems.map(item => item.truckId))];
      if (uniqueTruckIds.length > 1) {
        return res.status(400).json({ error: 'Cannot order from multiple trucks' });
      }
      const truckId = uniqueTruckIds[0];
      let totalPrice = 0;
      for (const item of cartItems) {
        totalPrice += parseFloat(item.currentPrice) * item.quantity;
      }
      const [newOrder] = await db('FoodTruck.Orders')
        .insert({
          userId: user.userId,
          truckId: truckId,
          orderStatus: 'pending',
          totalPrice: totalPrice,
          scheduledPickupTime: scheduledPickupTime,
          estimatedEarliestPickup: scheduledPickupTime
        })
        .returning('*');
      const orderItems = cartItems.map(item => ({
        orderId: newOrder.orderId,
        itemId: item.itemId,
        quantity: item.quantity,
        price: item.currentPrice
      }));
      await db('FoodTruck.OrderItems')
        .insert(orderItems);
      await db('FoodTruck.Carts')
        .where('userId', user.userId)
        .del();
      return res.status(200).json({ message: 'order placed successfully' });
    } catch (err) {
      console.log('error message', err.message);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/v1/order/details/:orderId', async (req, res) => {
    try {
      const user = await getUser(req);
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      if (user.role !== 'customer') {
        return res.status(403).json({ error: 'Forbidden: Only customers can view order details' });
      }
      const orderId = parseInt(req.params.orderId);
      if (isNaN(orderId)) {
        return res.status(400).json({ error: 'Invalid orderId' });
      }
      const order = await db('FoodTruck.Orders')
        .join('FoodTruck.Trucks', 'Orders.truckId', 'Trucks.truckId')
        .where({ 'Orders.orderId': orderId, 'Orders.userId': user.userId })
        .select('Orders.orderId', 'Orders.orderStatus', 'Orders.totalPrice', 'Orders.scheduledPickupTime', 'Orders.estimatedEarliestPickup', 'Orders.createdAt', 'Trucks.truckName')
        .first();
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }
      const orderItems = await db('FoodTruck.OrderItems')
        .join('FoodTruck.MenuItems', 'OrderItems.itemId', 'MenuItems.itemId')
        .where('OrderItems.orderId', orderId)
        .select('MenuItems.name as itemName', 'OrderItems.quantity', 'OrderItems.price');
      const orderDetails = {
        orderId: order.orderId,
        truckName: order.truckName,
        orderStatus: order.orderStatus,
        totalPrice: parseFloat(order.totalPrice),
        scheduledPickupTime: order.scheduledPickupTime,
        estimatedEarliestPickup: order.estimatedEarliestPickup,
        createdAt: order.createdAt,
        items: orderItems.map(item => ({
          itemName: item.itemName,
          quantity: item.quantity,
          price: parseFloat(item.price)
        }))
      };
      return res.status(200).json(orderDetails);
    } catch (err) {
      console.log('error message', err.message);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/v1/order/truckOwner/:orderId', async (req, res) => {
    try {
      const user = await getUser(req);
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      if (user.role !== 'truckOwner') {
        return res.status(403).json({ error: 'Forbidden: Only truck owners can view order details' });
      }
      if (!user.truckId) {
        return res.status(404).json({ error: 'User has no truck' });
      }
      const orderId = parseInt(req.params.orderId);
      if (isNaN(orderId)) {
        return res.status(400).json({ error: 'Invalid orderId' });
      }
      const order = await db('FoodTruck.Orders')
        .join('FoodTruck.Trucks', 'Orders.truckId', 'Trucks.truckId')
        .where({ 'Orders.orderId': orderId, 'Orders.truckId': user.truckId })
        .select('Orders.orderId', 'Orders.orderStatus', 'Orders.totalPrice', 'Orders.scheduledPickupTime', 'Orders.estimatedEarliestPickup', 'Orders.createdAt', 'Trucks.truckName')
        .first();
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }
      const orderItems = await db('FoodTruck.OrderItems')
        .join('FoodTruck.MenuItems', 'OrderItems.itemId', 'MenuItems.itemId')
        .where('OrderItems.orderId', orderId)
        .select('MenuItems.name as itemName', 'OrderItems.quantity', 'OrderItems.price');
      const orderDetails = {
        orderId: order.orderId,
        truckName: order.truckName,
        orderStatus: order.orderStatus,
        totalPrice: parseFloat(order.totalPrice),
        scheduledPickupTime: order.scheduledPickupTime,
        estimatedEarliestPickup: order.estimatedEarliestPickup,
        createdAt: order.createdAt,
        items: orderItems.map(item => ({
          itemName: item.itemName,
          quantity: item.quantity,
          price: parseFloat(item.price)
        }))
      };
      return res.status(200).json(orderDetails);
    } catch (err) {
      console.log('error message', err.message);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/v1/order/truckOrders', async (req, res) => {
    try {
      const user = await getUser(req);
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      if (user.role !== 'truckOwner') {
        return res.status(403).json({ error: 'Forbidden: Only truck owners can view truck orders' });
      }
      if (!user.truckId) {
        return res.status(404).json({ error: 'User has no truck' });
      }
      const orders = await db('FoodTruck.Orders')
        .join('FoodTruck.Users', 'Orders.userId', 'Users.userId')
        .where('Orders.truckId', user.truckId)
        .select('Orders.orderId', 'Orders.userId', 'Orders.orderStatus', 'Orders.totalPrice', 'Orders.scheduledPickupTime', 'Orders.estimatedEarliestPickup', 'Orders.createdAt', 'Users.name as customerName')
        .orderBy('Orders.orderId', 'desc');
      const truckOrders = orders.map(order => ({
        orderId: order.orderId,
        userId: order.userId,
        customerName: order.customerName,
        orderStatus: order.orderStatus,
        totalPrice: parseFloat(order.totalPrice),
        scheduledPickupTime: order.scheduledPickupTime,
        estimatedEarliestPickup: order.estimatedEarliestPickup,
        createdAt: order.createdAt
      }));
      return res.status(200).json(truckOrders);
    } catch (err) {
      console.log('error message', err.message);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.put('/api/v1/order/updateStatus/:orderId', async (req, res) => {
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
      const orderId = parseInt(req.params.orderId);
      if (isNaN(orderId)) {
        return res.status(400).json({ error: 'Invalid orderId' });
      }
      const { orderStatus, estimatedEarliestPickup } = req.body;
      if (!orderStatus || typeof orderStatus !== 'string') {
        return res.status(400).json({ error: 'orderStatus is required and must be a string' });
      }
      const validStatuses = ['pending', 'preparing', 'ready', 'completed', 'cancelled'];
      if (!validStatuses.includes(orderStatus)) {
        return res.status(400).json({ error: 'orderStatus must be one of: pending, preparing, ready, completed, cancelled' });
      }
      const order = await db('FoodTruck.Orders')
        .where({ orderId, truckId: user.truckId })
        .first();
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }
      const updateData = { orderStatus };
      if (estimatedEarliestPickup !== undefined) {
        updateData.estimatedEarliestPickup = estimatedEarliestPickup;
      }
      await db('FoodTruck.Orders')
        .where({ orderId, truckId: user.truckId })
        .update(updateData);
      return res.status(200).json({ message: 'order status updated successfully' });
    } catch (err) {
      console.log('error message', err.message);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });































};



module.exports = { handlePrivateBackendApi };

