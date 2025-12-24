$(document).ready(function() {
  loadOrders();

  function loadOrders() {
    $.ajax({
      type: "GET",
      url: '/api/v1/order/myOrders',
      success: function(orders) {
        $('#alertContainer').html('');
        
        if (!orders || orders.length === 0) {
          $('#ordersContainer').hide();
          $('#emptyState').show();
          return;
        }

        $('#ordersContainer').show();
        $('#emptyState').hide();
        displayOrders(orders);
      },
      error: function(xhr) {
        if (xhr.status === 403) {
          alert('Forbidden: You don\'t have access to this page');
          location.href = '/dashboard';
        } else {
          const errorMsg = xhr.responseJSON?.error || xhr.responseText || 'Failed to load orders';
          $('#alertContainer').html(`
            <div class="alert alert-danger">
              ${errorMsg}
            </div>
          `);
          $('#ordersContainer').hide();
          $('#emptyState').show();
        }
      }
    });
  }

  function displayOrders(orders) {
    const tbody = $('#ordersBody');
    tbody.html('');

    orders.forEach(function(order) {
      const orderDate = new Date(order.createdAt).toLocaleString();
      const pickupTime = order.scheduledPickupTime ? new Date(order.scheduledPickupTime).toLocaleString() : 'N/A';
      const statusBadge = getStatusBadge(order.orderStatus);
      
      const row = `
        <tr>
          <td>#${order.orderId}</td>
          <td>${order.truckName}</td>
          <td>${statusBadge}</td>
          <td>$${parseFloat(order.totalPrice).toFixed(2)}</td>
          <td>${orderDate}</td>
          <td>${pickupTime}</td>
          <td>
            <button class="btn-primary view-details-btn" data-order-id="${order.orderId}" style="padding: 6px 12px; font-size: 14px;">
              View Details
            </button>
          </td>
        </tr>
      `;
      tbody.append(row);
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

  // View details handler
  $(document).on('click', '.view-details-btn', function() {
    const orderId = $(this).data('order-id');
    loadOrderDetails(orderId);
  });

  function loadOrderDetails(orderId) {
    $.ajax({
      type: "GET",
      url: `/api/v1/order/details/${orderId}`,
      success: function(orderDetails) {
        displayOrderDetails(orderDetails);
        $('#orderDetailsModal').modal('show');
      },
      error: function(xhr) {
        const errorMsg = xhr.responseJSON?.error || xhr.responseText || 'Failed to load order details';
        $('#alertContainer').html(`
          <div class="alert alert-danger">
            ${errorMsg}
          </div>
        `);
      }
    });
  }

  function displayOrderDetails(orderDetails) {
    const statusBadge = getStatusBadge(orderDetails.orderStatus);
    const orderDate = new Date(orderDetails.createdAt).toLocaleString();
    const pickupTime = orderDetails.scheduledPickupTime ? new Date(orderDetails.scheduledPickupTime).toLocaleString() : 'N/A';
    const estimatedPickup = orderDetails.estimatedEarliestPickup ? new Date(orderDetails.estimatedEarliestPickup).toLocaleString() : 'N/A';

    let itemsHtml = '';
    orderDetails.items.forEach(function(item) {
      const itemSubtotal = item.price * item.quantity;
      itemsHtml += `
        <tr>
          <td>${item.itemName}</td>
          <td>$${item.price.toFixed(2)}</td>
          <td>${item.quantity}</td>
          <td>$${itemSubtotal.toFixed(2)}</td>
        </tr>
      `;
    });

    const detailsHtml = `
      <div class="card" style="background-color: #FAF6F0; border: 1px solid #000000;">
        <div class="card-header">
          <h4>Order #${orderDetails.orderId}</h4>
        </div>
        <div class="card-body">
          <div style="margin-bottom: 20px;">
            <strong>Truck Name:</strong> ${orderDetails.truckName}<br>
            <strong>Status:</strong> ${statusBadge}<br>
            <strong>Order Date:</strong> ${orderDate}<br>
            <strong>Scheduled Pickup:</strong> ${pickupTime}<br>
            <strong>Estimated Pickup:</strong> ${estimatedPickup}
          </div>
          
          <div style="margin-top: 20px;">
            <h5>Order Items</h5>
            <table class="table">
              <thead>
                <tr>
                  <th>Item Name</th>
                  <th>Price</th>
                  <th>Quantity</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="3" style="text-align: right; font-weight: bold;">Total:</td>
                  <td style="font-weight: bold; font-size: 1.2em;">$${orderDetails.totalPrice.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    `;

    $('#orderDetailsContent').html(detailsHtml);
  }
});

