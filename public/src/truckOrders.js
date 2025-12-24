$(document).ready(function() {
  let allOrders = [];
  let currentFilter = 'all';

  loadOrders();

  function loadOrders() {
    $.ajax({
      type: "GET",
      url: '/api/v1/order/truckOrders',
      success: function(orders) {
        $('#alertContainer').html('');
        allOrders = orders || [];
        filterOrders(currentFilter);
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
          $('#ordersTable').closest('.card').hide();
          $('#emptyState').show();
        }
      }
    });
  }

  function filterOrders(status) {
    currentFilter = status;
    
    // Update active tab
    $('.filter-tab').removeClass('active');
    $(`.filter-tab[data-status="${status}"]`).addClass('active');

    let filteredOrders = allOrders;
    if (status !== 'all') {
      filteredOrders = allOrders.filter(order => 
        order.orderStatus.toLowerCase() === status.toLowerCase()
      );
    }

    if (filteredOrders.length === 0) {
      $('#ordersTable').closest('.card').hide();
      $('#emptyState').show();
      return;
    }

    $('#ordersTable').closest('.card').show();
    $('#emptyState').hide();
    displayOrders(filteredOrders);
  }

  function displayOrders(orders) {
    const tbody = $('#ordersBody');
    tbody.html('');

    orders.forEach(function(order) {
      const statusBadge = getStatusBadge(order.orderStatus);
      const orderDate = new Date(order.createdAt).toLocaleString();
      const pickupTime = order.scheduledPickupTime ? new Date(order.scheduledPickupTime).toLocaleString() : 'N/A';
      
      const row = `
        <tr>
          <td>#${order.orderId}</td>
          <td>${order.customerName}</td>
          <td>${statusBadge}</td>
          <td>$${order.totalPrice.toFixed(2)}</td>
          <td>${pickupTime}</td>
          <td>${orderDate}</td>
          <td>
            <button class="btn-primary view-details-btn" data-order-id="${order.orderId}" style="padding: 4px 8px; font-size: 12px; margin-right: 5px;">
              View Details
            </button>
            <button class="btn-secondary update-status-btn" data-order-id="${order.orderId}" style="padding: 4px 8px; font-size: 12px;">
              Update Status
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

  // Filter tab handlers
  $('.filter-tab').click(function() {
    const status = $(this).data('status');
    filterOrders(status);
  });

  // View details handler
  $(document).on('click', '.view-details-btn', function() {
    const orderId = $(this).data('order-id');
    loadOrderDetails(orderId);
  });

  function loadOrderDetails(orderId) {
    $.ajax({
      type: "GET",
      url: `/api/v1/order/truckOwner/${orderId}`,
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
            <p><strong>Truck Name:</strong> ${orderDetails.truckName}</p>
            <p><strong>Status:</strong> ${statusBadge}</p>
            <p><strong>Order Date:</strong> ${orderDate}</p>
            <p><strong>Scheduled Pickup:</strong> ${pickupTime}</p>
            <p><strong>Estimated Pickup:</strong> ${estimatedPickup}</p>
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

  // Update status handler
  $(document).on('click', '.update-status-btn', function() {
    const orderId = $(this).data('order-id');
    const order = allOrders.find(o => o.orderId === orderId);
    
    if (order) {
      $('#statusUpdateOrderId').val(orderId);
      $('#statusSelect').val(order.orderStatus);
      $('#estimatedPickup').val('');
      $('#statusUpdateModal').modal('show');
    }
  });

  // Save status update handler
  $('#updateStatusBtn').click(function() {
    const orderId = parseInt($('#statusUpdateOrderId').val());
    const orderStatus = $('#statusSelect').val();
    const estimatedPickup = $('#estimatedPickup').val();

    if (!orderStatus) {
      $('#alertContainer').html(`
        <div class="alert alert-warning">
          Please select a status.
        </div>
      `);
      return;
    }

    $(this).prop('disabled', true).text('Updating...');

    const updateData = {
      orderStatus: orderStatus
    };

    if (estimatedPickup) {
      updateData.estimatedEarliestPickup = estimatedPickup;
    }

    $.ajax({
      type: "PUT",
      url: `/api/v1/order/updateStatus/${orderId}`,
      contentType: 'application/json',
      data: JSON.stringify(updateData),
      success: function(response) {
        $('#statusUpdateModal').modal('hide');
        $('#alertContainer').html(`
          <div class="alert alert-success">
            Order status updated successfully!
          </div>
        `);
        loadOrders();
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
        $('#updateStatusBtn').prop('disabled', false).text('Update Status');
      }
    });
  });

  // Reset status update form when modal is closed
  $('#statusUpdateModal').on('hidden.bs.modal', function() {
    $('#statusUpdateForm')[0].reset();
    $('#statusUpdateOrderId').val('');
    $('#updateStatusBtn').prop('disabled', false).text('Update Status');
  });
});

