$(document).ready(function() {
  // Get truckId from URL
  const pathParts = window.location.pathname.split('/');
  const truckId = pathParts[pathParts.length - 1];

  if (!truckId || isNaN(truckId)) {
    $('#alertContainer').html(`
      <div class="alert alert-danger">
        Invalid truck ID. Redirecting to trucks page...
      </div>
    `);
    setTimeout(function() {
      location.href = '/trucks';
    }, 2000);
    return;
  }

  loadTruckInfo(truckId);
  loadMenuItems(truckId);
  setupCategoryFilters(truckId);

  function loadTruckInfo(truckId) {
    // Try to get truck name from trucks endpoint
    $.ajax({
      type: "GET",
      url: '/api/v1/trucks/view',
      success: function(trucks) {
        const truck = trucks.find(t => t.truckId === parseInt(truckId));
        if (truck) {
          $('#truckName').text(truck.truckName + ' - Menu');
        }
      },
      error: function() {
        // If we can't get truck name, just keep default
        console.log('Could not load truck info');
      }
    });
  }

  function loadMenuItems(truckId, category = null) {
    let url = `/api/v1/menuItem/truck/${truckId}`;
    if (category && category !== 'all') {
      url = `/api/v1/menuItem/truck/${truckId}/category/${encodeURIComponent(category)}`;
    }

    $.ajax({
      type: "GET",
      url: url,
      success: function(menuItems) {
        $('#alertContainer').html('');
        $('#emptyState').hide();

        if (!menuItems || menuItems.length === 0) {
          $('#menuItemsContainer').hide();
          $('#emptyState').show();
          return;
        }

        $('#menuItemsContainer').show();
        $('#menuItemsContainer').html('');

        menuItems.forEach(function(item) {
          const itemCard = createMenuItemCard(item);
          $('#menuItemsContainer').append(itemCard);
        });
      },
      error: function(xhr) {
        if (xhr.status === 403) {
          alert('Forbidden: You don\'t have access to this page');
          location.href = '/dashboard';
        } else if (xhr.status === 404) {
          $('#alertContainer').html(`
            <div class="alert alert-danger">
              Truck not found or not available. Redirecting...
            </div>
          `);
          setTimeout(function() {
            location.href = '/trucks';
          }, 2000);
        } else {
          const errorMsg = xhr.responseJSON?.error || xhr.responseText || 'Failed to load menu items';
          $('#alertContainer').html(`
            <div class="alert alert-danger">
              ${errorMsg}
            </div>
          `);
          $('#menuItemsContainer').hide();
          $('#emptyState').show();
        }
      }
    });
  }

  function setupCategoryFilters(truckId) {
    // First load all items to get categories
    $.ajax({
      type: "GET",
      url: `/api/v1/menuItem/truck/${truckId}`,
      success: function(menuItems) {
        if (!menuItems || menuItems.length === 0) {
          return;
        }

        // Extract unique categories
        const categories = [...new Set(menuItems.map(item => item.category))].sort();
        
        // Add category filter buttons
        categories.forEach(function(category) {
          const categoryBtn = `
            <button class="btn-secondary category-filter" data-category="${category}">
              ${category}
            </button>
          `;
          $('#categoryFilters').append(categoryBtn);
        });

        // Setup click handlers for category filters
        $('.category-filter').click(function() {
          $('.category-filter').removeClass('active');
          $(this).addClass('active');
          const selectedCategory = $(this).data('category');
          loadMenuItems(truckId, selectedCategory);
        });
      },
      error: function(xhr) {
        console.error('Failed to load categories:', xhr);
      }
    });
  }

  function createMenuItemCard(item) {
    return `
      <div class="card">
        <div class="card-header">
          ${item.name}
        </div>
        <div class="card-body">
          <div style="margin-bottom: 10px;">
            <strong>Category:</strong> <span class="badge badge-available">${item.category}</span>
          </div>
          ${item.description ? `<div style="margin-bottom: 15px; color: #000000;">${item.description}</div>` : ''}
          <div style="margin-bottom: 15px;">
            <strong>Price:</strong> <span style="font-size: 1.2em; font-weight: bold; color: #000000;">$${parseFloat(item.price).toFixed(2)}</span>
          </div>
          <div style="margin-bottom: 15px;">
            <label for="quantity-${item.itemId}" style="display: block; margin-bottom: 5px;">Quantity:</label>
            <div style="display: flex; align-items: center; gap: 10px;">
              <button class="btn-secondary quantity-btn" data-item-id="${item.itemId}" data-action="decrease" style="width: 40px; height: 40px; padding: 0;">-</button>
              <input type="number" id="quantity-${item.itemId}" class="form-control" value="1" min="1" style="width: 80px; text-align: center;">
              <button class="btn-secondary quantity-btn" data-item-id="${item.itemId}" data-action="increase" style="width: 40px; height: 40px; padding: 0;">+</button>
            </div>
          </div>
          <div style="text-align: center;">
            <button class="btn-primary add-to-cart-btn" data-item-id="${item.itemId}" data-item-price="${item.price}" style="width: 100%;">
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // Quantity button handlers
  $(document).on('click', '.quantity-btn', function() {
    const itemId = $(this).data('item-id');
    const action = $(this).data('action');
    const quantityInput = $(`#quantity-${itemId}`);
    let currentQuantity = parseInt(quantityInput.val()) || 1;

    if (action === 'increase') {
      currentQuantity += 1;
    } else if (action === 'decrease' && currentQuantity > 1) {
      currentQuantity -= 1;
    }

    quantityInput.val(currentQuantity);
  });

  // Add to cart handler
  $(document).on('click', '.add-to-cart-btn', function() {
    const itemId = parseInt($(this).data('item-id'));
    const price = parseFloat($(this).data('item-price'));
    const quantity = parseInt($(`#quantity-${itemId}`).val()) || 1;

    if (quantity < 1) {
      $('#alertContainer').html(`
        <div class="alert alert-warning">
          Please select a quantity of at least 1.
        </div>
      `);
      return;
    }

    // Disable button during request
    $(this).prop('disabled', true).text('Adding...');

    $.ajax({
      type: "POST",
      url: '/api/v1/cart/new',
      data: {
        itemId: itemId,
        quantity: quantity,
        price: price
      },
      success: function(response) {
        $('#alertContainer').html(`
          <div class="alert alert-success">
            Item added to cart successfully!
          </div>
        `);
        
        // Reset button
        $(`.add-to-cart-btn[data-item-id="${itemId}"]`).prop('disabled', false).text('Add to Cart');
        $(`#quantity-${itemId}`).val(1);

        // Auto-hide success message after 3 seconds
        setTimeout(function() {
          $('#alertContainer').html('');
        }, 3000);
      },
      error: function(xhr) {
        const errorMsg = xhr.responseJSON?.error || xhr.responseJSON?.message || xhr.responseText || 'Failed to add item to cart';
        $('#alertContainer').html(`
          <div class="alert alert-danger">
            ${errorMsg}
          </div>
        `);
        
        // Reset button
        $(`.add-to-cart-btn[data-item-id="${itemId}"]`).prop('disabled', false).text('Add to Cart');
      }
    });
  });
});

