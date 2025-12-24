$(document).ready(function() {
  $('#submitBtn').click(function() {
    const name = $('#name').val().trim();
    const category = $('#category').val().trim();
    const description = $('#description').val().trim();
    const price = parseFloat($('#price').val());

    // Clear previous alerts
    $('#alertContainer').html('');

    // Validation
    if (!name) {
      $('#alertContainer').html(`
        <div class="alert alert-warning">
          Please enter a name for the menu item.
        </div>
      `);
      $('#name').focus();
      return;
    }

    if (!category) {
      $('#alertContainer').html(`
        <div class="alert alert-warning">
          Please enter a category for the menu item.
        </div>
      `);
      $('#category').focus();
      return;
    }

    if (!price || isNaN(price) || price <= 0) {
      $('#alertContainer').html(`
        <div class="alert alert-warning">
          Please enter a valid price greater than 0.
        </div>
      `);
      $('#price').focus();
      return;
    }

    // Disable button during request
    $(this).prop('disabled', true).text('Adding...');

    const menuItemData = {
      name: name,
      category: category,
      price: price
    };

    if (description) {
      menuItemData.description = description;
    }

    $.ajax({
      type: "POST",
      url: '/api/v1/menuItem/new',
      contentType: 'application/json',
      data: JSON.stringify(menuItemData),
      success: function(response) {
        $('#alertContainer').html(`
          <div class="alert alert-success">
            Menu item added successfully! Redirecting to menu items...
          </div>
        `);
        setTimeout(function() {
          location.href = '/menuItems';
        }, 2000);
      },
      error: function(xhr) {
        const errorMsg = xhr.responseJSON?.error || xhr.responseText || 'Failed to add menu item';
        $('#alertContainer').html(`
          <div class="alert alert-danger">
            ${errorMsg}
          </div>
        `);
        // Re-enable button
        $('#submitBtn').prop('disabled', false).text('Add Item');
      }
    });
  });

  // Allow Enter key to submit
  $('#name, #category, #description, #price').keypress(function(e) {
    if (e.which === 13) {
      e.preventDefault();
      $('#submitBtn').click();
    }
  });
});

