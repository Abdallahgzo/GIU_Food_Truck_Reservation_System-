$(document).ready(function() {
  loadMenuItems();

  function loadMenuItems() {
    $.ajax({
      type: "GET",
      url: '/api/v1/menuItem/view',
      success: function(menuItems) {
        $('#alertContainer').html('');
        
        if (!menuItems || menuItems.length === 0) {
          $('#menuItemsTable').closest('.card').hide();
          $('#emptyState').show();
          return;
        }

        $('#menuItemsTable').closest('.card').show();
        $('#emptyState').hide();
        displayMenuItems(menuItems);
      },
      error: function(xhr) {
        if (xhr.status === 403) {
          alert('Forbidden: You don\'t have access to this page');
          location.href = '/dashboard';
        } else {
          const errorMsg = xhr.responseJSON?.error || xhr.responseText || 'Failed to load menu items';
          $('#alertContainer').html(`
            <div class="alert alert-danger">
              ${errorMsg}
            </div>
          `);
          $('#menuItemsTable').closest('.card').hide();
          $('#emptyState').show();
        }
      }
    });
  }

  function displayMenuItems(menuItems) {
    const tbody = $('#menuItemsBody');
    tbody.html('');

    menuItems.forEach(function(item) {
      const statusBadge = item.status === 'available' 
        ? '<span class="badge badge-available">Available</span>' 
        : '<span class="badge badge-unavailable">Unavailable</span>';
      
      const description = item.description || '<em>No description</em>';
      const truncatedDescription = description.length > 50 
        ? description.substring(0, 50) + '...' 
        : description;

      const row = `
        <tr>
          <td>${item.itemId}</td>
          <td>${item.name}</td>
          <td>${item.category}</td>
          <td>${truncatedDescription}</td>
          <td>$${parseFloat(item.price).toFixed(2)}</td>
          <td>${statusBadge}</td>
          <td>
            <button class="btn-secondary view-details-btn" data-item-id="${item.itemId}" style="padding: 4px 8px; font-size: 12px; margin-right: 5px;">
              View
            </button>
            <button class="btn-primary edit-item-btn" data-item-id="${item.itemId}" style="padding: 4px 8px; font-size: 12px; margin-right: 5px;">
              Edit
            </button>
            <button class="btn-danger delete-item-btn" data-item-id="${item.itemId}" data-item-name="${item.name}" style="padding: 4px 8px; font-size: 12px;">
              Delete
            </button>
          </td>
        </tr>
      `;
      tbody.append(row);
    });
  }

  // View details handler
  $(document).on('click', '.view-details-btn', function() {
    const itemId = $(this).data('item-id');
    loadItemDetails(itemId);
  });

  function loadItemDetails(itemId) {
    $.ajax({
      type: "GET",
      url: `/api/v1/menuItem/view/${itemId}`,
      success: function(item) {
        const statusBadge = item.status === 'available' 
          ? '<span class="badge badge-available">Available</span>' 
          : '<span class="badge badge-unavailable">Unavailable</span>';
        
        const description = item.description || '<em>No description provided</em>';

        const detailsHtml = `
          <div>
            <p><strong>ID:</strong> ${item.itemId}</p>
            <p><strong>Name:</strong> ${item.name}</p>
            <p><strong>Category:</strong> ${item.category}</p>
            <p><strong>Description:</strong> ${description}</p>
            <p><strong>Price:</strong> $${parseFloat(item.price).toFixed(2)}</p>
            <p><strong>Status:</strong> ${statusBadge}</p>
            <p><strong>Created:</strong> ${new Date(item.createdAt).toLocaleString()}</p>
          </div>
        `;

        $('#viewDetailsContent').html(detailsHtml);
        $('#viewDetailsModal').modal('show');
      },
      error: function(xhr) {
        const errorMsg = xhr.responseJSON?.error || xhr.responseText || 'Failed to load item details';
        $('#alertContainer').html(`
          <div class="alert alert-danger">
            ${errorMsg}
          </div>
        `);
      }
    });
  }

  // Edit handler
  $(document).on('click', '.edit-item-btn', function() {
    const itemId = $(this).data('item-id');
    loadItemForEdit(itemId);
  });

  function loadItemForEdit(itemId) {
    $.ajax({
      type: "GET",
      url: `/api/v1/menuItem/view/${itemId}`,
      success: function(item) {
        $('#editItemId').val(item.itemId);
        $('#editName').val(item.name);
        $('#editCategory').val(item.category);
        $('#editDescription').val(item.description || '');
        $('#editPrice').val(item.price);
        $('#editStatus').val(item.status);
        $('#editModal').modal('show');
      },
      error: function(xhr) {
        const errorMsg = xhr.responseJSON?.error || xhr.responseText || 'Failed to load item for editing';
        $('#alertContainer').html(`
          <div class="alert alert-danger">
            ${errorMsg}
          </div>
        `);
      }
    });
  }

  // Reset edit form when modal is closed
  $('#editModal').on('hidden.bs.modal', function() {
    $('#editForm')[0].reset();
    $('#editItemId').val('');
    $('#saveEditBtn').prop('disabled', false).text('Save Changes');
  });

  // Save edit handler
  $('#saveEditBtn').click(function() {
    const itemId = $('#editItemId').val();
    const name = $('#editName').val().trim();
    const category = $('#editCategory').val().trim();
    const description = $('#editDescription').val().trim();
    const price = parseFloat($('#editPrice').val());
    const status = $('#editStatus').val();

    // Validation
    if (!name || !category || !price || price <= 0) {
      $('#alertContainer').html(`
        <div class="alert alert-warning">
          Please fill in all required fields. Price must be greater than 0.
        </div>
      `);
      return;
    }

    $(this).prop('disabled', true).text('Saving...');

    const updateData = {
      name: name,
      category: category,
      price: price,
      status: status
    };

    if (description) {
      updateData.description = description;
    }

    $.ajax({
      type: "PUT",
      url: `/api/v1/menuItem/edit/${itemId}`,
      contentType: 'application/json',
      data: JSON.stringify(updateData),
      success: function(updatedItem) {
        $('#editModal').modal('hide');
        $('#alertContainer').html(`
          <div class="alert alert-success">
            Menu item updated successfully!
          </div>
        `);
        loadMenuItems();
        setTimeout(function() {
          $('#alertContainer').html('');
        }, 3000);
      },
      error: function(xhr) {
        const errorMsg = xhr.responseJSON?.error || xhr.responseText || 'Failed to update menu item';
        $('#alertContainer').html(`
          <div class="alert alert-danger">
            ${errorMsg}
          </div>
        `);
        $('#saveEditBtn').prop('disabled', false).text('Save Changes');
      }
    });
  });

  // Delete handler
  $(document).on('click', '.delete-item-btn', function() {
    const itemId = $(this).data('item-id');
    const itemName = $(this).data('item-name');
    
    if (!confirm(`Are you sure you want to delete "${itemName}"?\n\nThis will set the item status to unavailable.`)) {
      return;
    }

    $.ajax({
      type: "DELETE",
      url: `/api/v1/menuItem/delete/${itemId}`,
      success: function(response) {
        $('#alertContainer').html(`
          <div class="alert alert-success">
            Menu item deleted successfully.
          </div>
        `);
        loadMenuItems();
        setTimeout(function() {
          $('#alertContainer').html('');
        }, 3000);
      },
      error: function(xhr) {
        const errorMsg = xhr.responseJSON?.error || xhr.responseText || 'Failed to delete menu item';
        $('#alertContainer').html(`
          <div class="alert alert-danger">
            ${errorMsg}
          </div>
        `);
      }
    });
  });
});

