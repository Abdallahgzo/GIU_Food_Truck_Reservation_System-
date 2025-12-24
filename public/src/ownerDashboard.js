$(document).ready(function() {
  loadTruckInfo();
  loadStats();
  loadRecentOrders();

  function loadTruckInfo() {
    $.ajax({
      type: "GET",
      url: '/api/v1/trucks/myTruck',
      success: function(truck) {
        const statusBadge = truck.orderStatus === 'available' 
          ? '<span class="badge badge-available">Available</span>' 
          : '<span class="badge badge-unavailable">Unavailable</span>';
        
        const truckInfoHtml = `
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap;">
            <div>
              <h3 style="margin: 0 0 10px 0;">${truck.truckName}</h3>
              <p style="margin: 0;"><strong>Status:</strong> ${statusBadge}</p>
            </div>
            <div>
              <label for="orderStatusToggle" style="margin-right: 10px;">Order Availability:</label>
              <select id="orderStatusToggle" class="form-control" style="display: inline-block; width: auto; min-width: 150px;">
                <option value="available" ${truck.orderStatus === 'available' ? 'selected' : ''}>Available</option>
                <option value="unavailable" ${truck.orderStatus === 'unavailable' ? 'selected' : ''}>Unavailable</option>
              </select>
              <button id="updateOrderStatusBtn" class="btn-primary" style="margin-left: 10px;">Update</button>
            </div>
          </div>
        `;
        
        $('#truckInfoContent').html(truckInfoHtml);
        
        // Setup update handler
        $('#updateOrderStatusBtn').click(function() {
          updateOrderStatus();
        });
      },
      error: function(xhr) {
        if (xhr.status === 403) {
          alert('Forbidden: You don\'t have access to this page');
          location.href = '/dashboard';
        } else {
          const errorMsg = xhr.responseJSON?.error || xhr.responseText || 'Failed to load truck information';
          $('#alertContainer').html(`
            <div class="alert alert-danger">
              ${errorMsg}
            </div>
          `);
        }
      }
    });
  }

  function updateOrderStatus() {
    const orderStatus = $('#orderStatusToggle').val();
    
    $('#updateOrderStatusBtn').prop('disabled', true).text('Updating...');

    $.ajax({
      type: "PUT",
      url: '/api/v1/trucks/updateOrderStatus',
      contentType: 'application/json',
      data: JSON.stringify({
        orderStatus: orderStatus
      }),
      success: function(updatedTruck) {
        $('#alertContainer').html(`
          <div class="alert alert-success">
            Order status updated successfully!
          </div>
        `);
        // Reload truck info to reflect changes
        loadTruckInfo();
        setTimeout(function() {
          $('#alertContainer').html('');
        }, 3000);
      },
      error: function(xhr) {
        const errorMsg = xhr.responseJSON?.error || xhr.responseText || 'Failed to update order status';
        $('#alertContainer').html(`
          <div class="alert alert-danger">
            ${errorMsg}
          </div>
        `);
        $('#updateOrderStatusBtn').prop('disabled', false).text('Update');
      }
    });
  }

  function loadStats() {
    // Load menu items count
    $.ajax({
      type: "GET",
      url: '/api/v1/menuItem/view',
      success: function(menuItems) {
        const totalItems = menuItems ? menuItems.length : 0;
        $('#totalMenuItems').text(totalItems);
      },
      error: function(xhr) {
        $('#totalMenuItems').text('0');
      }
    });

    // Load orders for stats
    $.ajax({
      type: "GET",
      url: '/api/v1/order/truckOrders',
      success: function(orders) {
        if (!orders || orders.length === 0) {
          $('#pendingOrders').text('0');
          $('#completedOrders').text('0');
          return;
        }

        const pendingCount = orders.filter(order => 
          order.orderStatus === 'pending' || order.orderStatus === 'preparing' || order.orderStatus === 'ready'
        ).length;
        
        const completedCount = orders.filter(order => 
          order.orderStatus === 'completed'
        ).length;

        $('#pendingOrders').text(pendingCount);
        $('#completedOrders').text(completedCount);
      },
      error: function(xhr) {
        $('#pendingOrders').text('0');
        $('#completedOrders').text('0');
      }
    });
  }

  function loadRecentOrders() {
    $.ajax({
      type: "GET",
      url: '/api/v1/order/truckOrders',
      success: function(orders) {
        if (!orders || orders.length === 0) {
          $('#recentOrdersContent').html(`
            <p style="text-align: center; color: #000000;">No orders yet.</p>
          `);
          return;
        }

        // Get last 5 orders
        const recentOrders = orders.slice(0, 5);
        
        let ordersHtml = `
          <table class="table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Status</th>
                <th>Total</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
        `;

        recentOrders.forEach(function(order) {
          const statusBadge = getStatusBadge(order.orderStatus);
          const orderDate = new Date(order.createdAt).toLocaleString();
          
          ordersHtml += `
            <tr>
              <td>#${order.orderId}</td>
              <td>${order.customerName}</td>
              <td>${statusBadge}</td>
              <td>$${order.totalPrice.toFixed(2)}</td>
              <td>${orderDate}</td>
            </tr>
          `;
        });

        ordersHtml += `
            </tbody>
          </table>
        `;

        if (orders.length > 5) {
          ordersHtml += `
            <div style="text-align: center; margin-top: 15px;">
              <a href="/truckOrders" class="btn-primary" style="text-decoration: none; display: inline-block;">
                View All Orders
              </a>
            </div>
          `;
        }

        $('#recentOrdersContent').html(ordersHtml);
      },
      error: function(xhr) {
        $('#recentOrdersContent').html(`
          <p style="text-align: center; color: #000000;">Failed to load recent orders.</p>
        `);
      }
    });
  }

  function getStatusBadge(status) {
    const statusLower = status.toLowerCase();
    let badgeClass = 'badge-available';
    let statusText = status;

    switch(statusLower) {
      case 'pending':
        badgeClass = 'badge-pending';
        statusText = 'Pending';
        break;
      case 'preparing':
        badgeClass = 'badge-preparing';
        statusText = 'Preparing';
        break;
      case 'ready':
        badgeClass = 'badge-ready';
        statusText = 'Ready';
        break;
      case 'completed':
        badgeClass = 'badge-completed';
        statusText = 'Completed';
        break;
      case 'cancelled':
        badgeClass = 'badge-cancelled';
        statusText = 'Cancelled';
        break;
      default:
        badgeClass = 'badge-available';
    }

    return `<span class="badge ${badgeClass}">${statusText}</span>`;
  }
});

