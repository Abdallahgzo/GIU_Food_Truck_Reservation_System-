$(document).ready(function() {
  loadCart();

  function loadCart() {
    $.ajax({
      type: "GET",
      url: '/api/v1/cart/view',
      success: function(cartItems) {
        $('#alertContainer').html('');
        
        if (!cartItems || cartItems.length === 0) {
          $('#cartContainer').hide();
          $('#emptyState').show();
          return;
        }

        $('#cartContainer').show();
        $('#emptyState').hide();
        displayCartItems(cartItems);
        calculateTotal(cartItems);
      },
      error: function(xhr) {
        if (xhr.status === 403) {
          alert('Forbidden: You don\'t have access to this page');
          location.href = '/dashboard';
        } else {
          const errorMsg = xhr.responseJSON?.error || xhr.responseText || 'Failed to load cart';
          $('#alertContainer').html(`
            <div class="alert alert-danger">
              ${errorMsg}
            </div>
          `);
          $('#cartContainer').hide();
          $('#emptyState').show();
        }
      }
    });
  }

  function displayCartItems(cartItems) {
    const tbody = $('#cartItemsBody');
    tbody.html('');

    cartItems.forEach(function(item) {
      const subtotal = parseFloat(item.price) * item.quantity;
      const row = `
        <tr id="cart-row-${item.cartId}">
          <td>${item.itemName}</td>
          <td>$${parseFloat(item.price).toFixed(2)}</td>
          <td>
            <div style="display: flex; align-items: center; gap: 10px; justify-content: center;">
              <button class="btn-secondary quantity-decrease" data-cart-id="${item.cartId}" style="width: 35px; height: 35px; padding: 0;">-</button>
              <span id="quantity-${item.cartId}" style="min-width: 40px; text-align: center; font-weight: bold;">${item.quantity}</span>
              <button class="btn-secondary quantity-increase" data-cart-id="${item.cartId}" style="width: 35px; height: 35px; padding: 0;">+</button>
            </div>
          </td>
          <td id="subtotal-${item.cartId}" style="font-weight: bold;">$${subtotal.toFixed(2)}</td>
          <td>
            <button class="btn-danger remove-item" data-cart-id="${item.cartId}" style="padding: 6px 12px; font-size: 14px;">
              Remove
            </button>
          </td>
        </tr>
      `;
      tbody.append(row);
    });
  }

  function calculateTotal(cartItems) {
    let total = 0;
    cartItems.forEach(function(item) {
      total += parseFloat(item.price) * item.quantity;
    });
    $('#cartTotal').text('$' + total.toFixed(2));
  }

  // Quantity decrease handler
  $(document).on('click', '.quantity-decrease', function() {
    const cartId = $(this).data('cart-id');
    const quantitySpan = $(`#quantity-${cartId}`);
    const currentQuantity = parseInt(quantitySpan.text());

    if (currentQuantity <= 1) {
      $('#alertContainer').html(`
        <div class="alert alert-warning">
          Quantity cannot be less than 1. Use Remove button to delete the item.
        </div>
      `);
      setTimeout(function() {
        $('#alertContainer').html('');
      }, 3000);
      return;
    }

    updateQuantity(cartId, currentQuantity - 1);
  });

  // Quantity increase handler
  $(document).on('click', '.quantity-increase', function() {
    const cartId = $(this).data('cart-id');
    const quantitySpan = $(`#quantity-${cartId}`);
    const currentQuantity = parseInt(quantitySpan.text());
    updateQuantity(cartId, currentQuantity + 1);
  });

  function updateQuantity(cartId, newQuantity) {
    // Disable buttons during update
    $(`.quantity-decrease[data-cart-id="${cartId}"], .quantity-increase[data-cart-id="${cartId}"]`).prop('disabled', true);

    $.ajax({
      type: "PUT",
      url: `/api/v1/cart/edit/${cartId}`,
      contentType: 'application/json',
      data: JSON.stringify({
        quantity: newQuantity
      }),
      success: function(updatedItem) {
        // Reload cart to get updated state and total
        loadCart();
      },
      error: function(xhr) {
        const errorMsg = xhr.responseJSON?.error || xhr.responseText || 'Failed to update quantity';
        $('#alertContainer').html(`
          <div class="alert alert-danger">
            ${errorMsg}
          </div>
        `);
        // Re-enable buttons
        $(`.quantity-decrease[data-cart-id="${cartId}"], .quantity-increase[data-cart-id="${cartId}"]`).prop('disabled', false);
        // Reload cart to sync state
        loadCart();
      }
    });
  }

  // Remove item handler
  $(document).on('click', '.remove-item', function() {
    const cartId = $(this).data('cart-id');
    const itemName = $(this).closest('tr').find('td:first').text();
    
    if (!confirm(`Are you sure you want to remove "${itemName}" from your cart?`)) {
      return;
    }

    $.ajax({
      type: "DELETE",
      url: `/api/v1/cart/delete/${cartId}`,
      success: function(response) {
        $('#alertContainer').html(`
          <div class="alert alert-success">
            Item removed from cart successfully.
          </div>
        `);
        // Reload cart
        loadCart();
        setTimeout(function() {
          $('#alertContainer').html('');
        }, 3000);
      },
      error: function(xhr) {
        const errorMsg = xhr.responseJSON?.error || xhr.responseText || 'Failed to remove item';
        $('#alertContainer').html(`
          <div class="alert alert-danger">
            ${errorMsg}
          </div>
        `);
      }
    });
  });

  // Place order handler
  $('#placeOrderBtn').click(function() {
    const scheduledPickupTime = $('#scheduledPickupTime').val();

    if (!scheduledPickupTime) {
      $('#alertContainer').html(`
        <div class="alert alert-warning">
          Please select a scheduled pickup time.
        </div>
      `);
      return;
    }

    // Validate that pickup time is in the future
    const pickupDate = new Date(scheduledPickupTime);
    const now = new Date();
    if (pickupDate <= now) {
      $('#alertContainer').html(`
        <div class="alert alert-warning">
          Please select a pickup time in the future.
        </div>
      `);
      return;
    }

    // Disable button during request
    $(this).prop('disabled', true).text('Placing Order...');

    $.ajax({
      type: "POST",
      url: '/api/v1/order/new',
      data: {
        scheduledPickupTime: scheduledPickupTime
      },
      success: function(response) {
        $('#alertContainer').html(`
          <div class="alert alert-success">
            Order placed successfully! Redirecting to your orders...
          </div>
        `);
        setTimeout(function() {
          location.href = '/myOrders';
        }, 2000);
      },
      error: function(xhr) {
        const errorMsg = xhr.responseJSON?.error || xhr.responseText || 'Failed to place order';
        $('#alertContainer').html(`
          <div class="alert alert-danger">
            ${errorMsg}
          </div>
        `);
        // Re-enable button
        $('#placeOrderBtn').prop('disabled', false).text('Place Order');
      }
    });
  });

  // Set minimum datetime to current time
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const minDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;
  $('#scheduledPickupTime').attr('min', minDateTime);
});

